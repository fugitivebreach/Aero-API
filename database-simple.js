const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'database.json');

let db = {
  users: [],
  apiKeys: [],
  moderationActions: []
};

if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (error) {
    console.error('Error loading database, starting fresh');
  }
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function generateApiKey() {
  return 'AeroAPI-' + crypto.randomBytes(32).toString('hex');
}

function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

const users = {
  findByDiscordId: (discordId) => {
    return db.users.find(u => u.discord_id === discordId);
  },
  
  findById: (id) => {
    return db.users.find(u => u.id === id);
  },
  
  create: (discordId, username, discriminator, avatar, email, isAdmin = 0) => {
    const user = {
      id: generateId(),
      discord_id: discordId,
      discord_username: username,
      discord_discriminator: discriminator,
      discord_avatar: avatar,
      email: email,
      is_admin: isAdmin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.users.push(user);
    saveDb();
    return { lastInsertRowid: user.id };
  },
  
  update: (discordId, username, discriminator, avatar, email) => {
    const user = db.users.find(u => u.discord_id === discordId);
    if (user) {
      user.discord_username = username;
      user.discord_discriminator = discriminator;
      user.discord_avatar = avatar;
      user.email = email;
      user.updated_at = new Date().toISOString();
      saveDb();
    }
    return { changes: user ? 1 : 0 };
  },
  
  getAll: () => {
    return [...db.users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  
  search: (query) => {
    const lowerQuery = query.toLowerCase();
    return db.users.filter(u => 
      u.discord_username.toLowerCase().includes(lowerQuery) ||
      u.discord_id.includes(query)
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  
  setAdmin: (discordId, isAdmin) => {
    const user = db.users.find(u => u.discord_id === discordId);
    if (user) {
      user.is_admin = isAdmin;
      saveDb();
    }
    return { changes: user ? 1 : 0 };
  }
};

const apiKeys = {
  findByUserId: (userId) => {
    return db.apiKeys.filter(k => k.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  
  findByKey: (key) => {
    return db.apiKeys.find(k => k.api_key === key);
  },
  
  create: (userId, name = 'Default') => {
    const apiKey = generateApiKey();
    const key = {
      id: generateId(),
      user_id: userId,
      api_key: apiKey,
      name: name,
      created_at: new Date().toISOString(),
      last_used: null
    };
    db.apiKeys.push(key);
    saveDb();
    return apiKey;
  },
  
  delete: (id, userId) => {
    const index = db.apiKeys.findIndex(k => k.id === id && k.user_id === userId);
    if (index !== -1) {
      db.apiKeys.splice(index, 1);
      saveDb();
    }
    return { changes: index !== -1 ? 1 : 0 };
  },
  
  updateLastUsed: (apiKey) => {
    const key = db.apiKeys.find(k => k.api_key === apiKey);
    if (key) {
      key.last_used = new Date().toISOString();
      saveDb();
    }
    return { changes: key ? 1 : 0 };
  }
};

const moderation = {
  getActive: (userId) => {
    const now = new Date();
    return db.moderationActions.filter(m => 
      m.user_id === userId && 
      m.is_active === 1 &&
      (!m.expires_at || new Date(m.expires_at) > now)
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },
  
  create: (userId, actionType, reason, durationSeconds, moderatorId) => {
    let expiresAt = null;
    if (durationSeconds && actionType === 'ratelimit') {
      const expiryDate = new Date(Date.now() + durationSeconds * 1000);
      expiresAt = expiryDate.toISOString();
    }
    
    const action = {
      id: generateId(),
      user_id: userId,
      action_type: actionType,
      reason: reason,
      duration_seconds: durationSeconds,
      moderator_id: moderatorId,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_active: 1
    };
    db.moderationActions.push(action);
    saveDb();
    return { lastInsertRowid: action.id };
  },
  
  deactivate: (userId, actionType) => {
    let count = 0;
    db.moderationActions.forEach(m => {
      if (m.user_id === userId && m.action_type === actionType) {
        m.is_active = 0;
        count++;
      }
    });
    if (count > 0) saveDb();
    return { changes: count };
  },
  
  getHistory: (userId) => {
    const actions = db.moderationActions.filter(m => m.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return actions.map(action => {
      const moderator = db.users.find(u => u.id === action.moderator_id);
      return {
        ...action,
        moderator_username: moderator ? moderator.discord_username : 'Unknown'
      };
    });
  },
  
  checkStatus: (userId) => {
    const actions = moderation.getActive(userId);
    const status = {
      isLocked: false,
      isDisabled: false,
      isRatelimited: false,
      reason: null,
      actionType: null
    };
    
    for (const action of actions) {
      if (action.action_type === 'lock') {
        status.isLocked = true;
        status.reason = action.reason;
        status.actionType = 'locked';
        break;
      } else if (action.action_type === 'disable') {
        status.isDisabled = true;
        status.reason = action.reason;
        status.actionType = 'disabled';
        break;
      } else if (action.action_type === 'ratelimit') {
        if (!action.expires_at || new Date(action.expires_at) > new Date()) {
          status.isRatelimited = true;
          status.reason = action.reason;
          status.actionType = 'ratelimited';
          break;
        }
      }
    }
    
    return status;
  }
};

module.exports = {
  db,
  generateApiKey,
  users,
  apiKeys,
  moderation
};
