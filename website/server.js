require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const db = require('./database-simple');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'aeroapi-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = db.users.findById(id);
  done(null, user);
});

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
  try {
    let user = db.users.findByDiscordId(profile.id);
    
    const isAdmin = process.env.ADMIN_DISCORD_IDS && 
                    process.env.ADMIN_DISCORD_IDS.split(',').includes(profile.id) ? 1 : 0;
    
    if (user) {
      db.users.update(
        profile.id,
        profile.username,
        profile.discriminator,
        profile.avatar,
        profile.email
      );
      
      if (isAdmin && !user.is_admin) {
        db.users.setAdmin(profile.id, 1);
      }
      
      user = db.users.findByDiscordId(profile.id);
    } else {
      db.users.create(
        profile.id,
        profile.username,
        profile.discriminator,
        profile.avatar,
        profile.email,
        isAdmin
      );
      user = db.users.findByDiscordId(profile.id);
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.is_admin) {
    return next();
  }
  res.status(403).json({ error: 'Access denied' });
}

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/dashboard');
  }
  res.render('index', { user: null });
});

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
  const moderationStatus = db.moderation.checkStatus(req.user.id);
  res.render('dashboard', { 
    user: req.user, 
    moderationStatus 
  });
});

app.get('/api/user/keys', isAuthenticated, (req, res) => {
  const moderationStatus = db.moderation.checkStatus(req.user.id);
  if (moderationStatus.isLocked || moderationStatus.isDisabled) {
    return res.status(403).json({ error: 'Account is moderated', moderationStatus });
  }
  
  const keys = db.apiKeys.findByUserId(req.user.id);
  res.json({ keys });
});

app.post('/api/user/keys/generate', isAuthenticated, (req, res) => {
  const moderationStatus = db.moderation.checkStatus(req.user.id);
  if (moderationStatus.isLocked || moderationStatus.isDisabled) {
    return res.status(403).json({ error: 'Account is moderated', moderationStatus });
  }
  
  const { name } = req.body;
  const apiKey = db.apiKeys.create(req.user.id, name || 'Default');
  res.json({ success: true, apiKey });
});

app.delete('/api/user/keys/:id', isAuthenticated, (req, res) => {
  const moderationStatus = db.moderation.checkStatus(req.user.id);
  if (moderationStatus.isLocked || moderationStatus.isDisabled) {
    return res.status(403).json({ error: 'Account is moderated', moderationStatus });
  }
  
  db.apiKeys.delete(req.params.id, req.user.id);
  res.json({ success: true });
});

app.get('/admin', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin', { user: req.user });
});

app.get('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
  const { search } = req.query;
  let users;
  
  if (search) {
    users = db.users.search(search);
  } else {
    users = db.users.getAll();
  }
  
  const usersWithStatus = users.map(user => {
    const moderationStatus = db.moderation.checkStatus(user.id);
    return { ...user, moderationStatus };
  });
  
  res.json({ users: usersWithStatus });
});

app.post('/api/admin/moderate', isAuthenticated, isAdmin, (req, res) => {
  const { userId, actionType, reason, durationSeconds } = req.body;
  
  if (!userId || !actionType || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.moderation.deactivate(userId, actionType);
  
  db.moderation.create(userId, actionType, reason, durationSeconds || null, req.user.id);
  
  res.json({ success: true });
});

app.post('/api/admin/unmoderate', isAuthenticated, isAdmin, (req, res) => {
  const { userId, actionType } = req.body;
  
  if (!userId || !actionType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  db.moderation.deactivate(userId, actionType);
  
  res.json({ success: true });
});

app.get('/api/admin/moderation-history/:userId', isAuthenticated, isAdmin, (req, res) => {
  const history = db.moderation.getHistory(req.params.userId);
  res.json({ history });
});

app.get('/api/validate-key/:apiKey', (req, res) => {
  const apiKey = req.params.apiKey;
  const keyData = db.apiKeys.findByKey(apiKey);
  
  if (!keyData) {
    return res.status(404).json({ 
      valid: false, 
      message: 'The API Key you input no longer exists' 
    });
  }
  
  const user = db.users.findById(keyData.user_id);
  const moderationStatus = db.moderation.checkStatus(user.id);
  
  if (moderationStatus.isLocked) {
    return res.status(403).json({ 
      valid: false, 
      message: 'The API Key you input is associated with a moderated account on our database' 
    });
  }
  
  if (moderationStatus.isDisabled) {
    return res.status(403).json({ 
      valid: false, 
      message: 'The API Key you input is no longer valid' 
    });
  }
  
  if (moderationStatus.isRatelimited) {
    return res.status(429).json({ 
      valid: false, 
      message: 'The API Key you input is ratelimited' 
    });
  }
  
  db.apiKeys.updateLastUsed(apiKey);
  
  res.json({ 
    valid: true, 
    user: {
      discord_username: user.discord_username,
      discord_id: user.discord_id
    }
  });
});

app.listen(PORT, () => {
  console.log(`AeroAPI Dashboard running on port ${PORT}`);
  console.log(`Discord OAuth2 configured: ${!!process.env.DISCORD_CLIENT_ID}`);
  console.log(`Admin IDs configured: ${process.env.ADMIN_DISCORD_IDS || 'None'}`);
});

module.exports = app;
