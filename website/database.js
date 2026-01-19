const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const db = new Database(path.join(__dirname, 'aeroapi.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT UNIQUE NOT NULL,
    discord_username TEXT NOT NULL,
    discord_discriminator TEXT,
    discord_avatar TEXT,
    email TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS moderation_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    duration_seconds INTEGER,
    moderator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (moderator_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
  CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
  CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
  CREATE INDEX IF NOT EXISTS idx_moderation_user_id ON moderation_actions(user_id);
  CREATE INDEX IF NOT EXISTS idx_moderation_active ON moderation_actions(is_active);
`);

function generateApiKey() {
  return 'AeroAPI-' + crypto.randomBytes(32).toString('hex');
}

const userQueries = {
  findByDiscordId: db.prepare('SELECT * FROM users WHERE discord_id = ?'),
  findById: db.prepare('SELECT * FROM users WHERE id = ?'),
  create: db.prepare(`
    INSERT INTO users (discord_id, discord_username, discord_discriminator, discord_avatar, email, is_admin)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  update: db.prepare(`
    UPDATE users 
    SET discord_username = ?, discord_discriminator = ?, discord_avatar = ?, email = ?, updated_at = CURRENT_TIMESTAMP
    WHERE discord_id = ?
  `),
  getAll: db.prepare('SELECT * FROM users ORDER BY created_at DESC'),
  search: db.prepare(`
    SELECT * FROM users 
    WHERE discord_username LIKE ? OR discord_id LIKE ?
    ORDER BY created_at DESC
  `),
  setAdmin: db.prepare('UPDATE users SET is_admin = ? WHERE discord_id = ?')
};

const apiKeyQueries = {
  findByUserId: db.prepare('SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'),
  findByKey: db.prepare('SELECT * FROM api_keys WHERE api_key = ?'),
  create: db.prepare('INSERT INTO api_keys (user_id, api_key, name) VALUES (?, ?, ?)'),
  delete: db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?'),
  updateLastUsed: db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE api_key = ?')
};

const moderationQueries = {
  getActiveByUserId: db.prepare(`
    SELECT * FROM moderation_actions 
    WHERE user_id = ? AND is_active = 1 
    AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY created_at DESC
  `),
  create: db.prepare(`
    INSERT INTO moderation_actions (user_id, action_type, reason, duration_seconds, moderator_id, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  deactivate: db.prepare('UPDATE moderation_actions SET is_active = 0 WHERE user_id = ? AND action_type = ?'),
  getHistory: db.prepare(`
    SELECT m.*, u.discord_username as moderator_username
    FROM moderation_actions m
    LEFT JOIN users u ON m.moderator_id = u.id
    WHERE m.user_id = ?
    ORDER BY m.created_at DESC
  `)
};

module.exports = {
  db,
  generateApiKey,
  users: {
    findByDiscordId: (discordId) => userQueries.findByDiscordId.get(discordId),
    findById: (id) => userQueries.findById.get(id),
    create: (discordId, username, discriminator, avatar, email, isAdmin = 0) => {
      return userQueries.create.run(discordId, username, discriminator, avatar, email, isAdmin);
    },
    update: (discordId, username, discriminator, avatar, email) => {
      return userQueries.update.run(username, discriminator, avatar, email, discordId);
    },
    getAll: () => userQueries.getAll.all(),
    search: (query) => {
      const searchTerm = `%${query}%`;
      return userQueries.search.all(searchTerm, searchTerm);
    },
    setAdmin: (discordId, isAdmin) => userQueries.setAdmin.run(isAdmin, discordId)
  },
  apiKeys: {
    findByUserId: (userId) => apiKeyQueries.findByUserId.all(userId),
    findByKey: (key) => apiKeyQueries.findByKey.get(key),
    create: (userId, name = 'Default') => {
      const apiKey = generateApiKey();
      apiKeyQueries.create.run(userId, apiKey, name);
      return apiKey;
    },
    delete: (id, userId) => apiKeyQueries.delete.run(id, userId),
    updateLastUsed: (apiKey) => apiKeyQueries.updateLastUsed.run(apiKey)
  },
  moderation: {
    getActive: (userId) => moderationQueries.getActiveByUserId.all(userId),
    create: (userId, actionType, reason, durationSeconds, moderatorId) => {
      let expiresAt = null;
      if (durationSeconds && actionType === 'ratelimit') {
        const expiryDate = new Date(Date.now() + durationSeconds * 1000);
        expiresAt = expiryDate.toISOString();
      }
      return moderationQueries.create.run(userId, actionType, reason, durationSeconds, moderatorId, expiresAt);
    },
    deactivate: (userId, actionType) => moderationQueries.deactivate.run(userId, actionType),
    getHistory: (userId) => moderationQueries.getHistory.all(userId),
    checkStatus: (userId) => {
      const actions = moderationQueries.getActiveByUserId.all(userId);
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
  }
};
