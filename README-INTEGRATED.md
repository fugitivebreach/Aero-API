# AeroAPI - Integrated API & Dashboard

A unified Railway-ready application combining the Roblox group rank management API with a modern Discord OAuth2 dashboard.

## 🚀 Features

### API Features
- **POST /api/setrank** - Set ranks for Roblox users in groups
- Comprehensive validation and error handling
- API key authentication with database integration
- Moderation status checking for API keys

### Dashboard Features
- **Discord OAuth2 Login** - Secure authentication
- **API Key Management** - Generate, view, and delete API keys
- **Admin Panel** - User moderation and management
- **Modern UI** - Dark sea blue theme with animations
- **SQLite Database** - JSON-based storage (no compilation needed)

## 📦 Installation

**1. Install dependencies:**
```bash
npm install
```

**2. Configure environment variables:**

Edit the `.env` file with your Discord application settings:

```env
PORT=3000
SESSION_SECRET=your-random-secret-key-here

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback

ADMIN_DISCORD_IDS=your-discord-user-id
```

**3. Set up Discord Application:**
- Go to https://discord.com/developers/applications
- Create a new application
- Go to **OAuth2** → **General**
- Add redirect URL: `http://localhost:3000/auth/discord/callback`
- Copy Client ID and Secret to `.env`
- Enable scopes: `identify` and `email`

**4. Get your Discord User ID (to become admin):**
- Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
- Right-click your profile → Copy User ID
- Add it to `ADMIN_DISCORD_IDS` in `.env`

## 🎯 Running the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The application will be available at: **http://localhost:3000**

## 📍 Endpoints

### Website Routes
- `GET /` - Landing page (redirects to dashboard if logged in)
- `GET /auth/discord` - Initiate Discord OAuth2
- `GET /auth/discord/callback` - OAuth2 callback
- `GET /logout` - Logout
- `GET /dashboard` - User dashboard (authenticated)
- `GET /admin` - Admin panel (admin only)

### API Routes (Dashboard)
- `GET /api/user/keys` - Get user's API keys
- `POST /api/user/keys/generate` - Generate new API key
- `DELETE /api/user/keys/:id` - Delete API key
- `GET /api/admin/users` - Get all users (admin)
- `POST /api/admin/moderate` - Moderate user (admin)
- `POST /api/admin/unmoderate` - Remove moderation (admin)
- `GET /api/admin/moderation-history/:userId` - Get moderation history (admin)
- `GET /api/validate-key/:apiKey` - Validate API key (public)

### Roblox API Routes
- `POST /api/setrank` - Set rank in Roblox group

## 🔑 Using the Roblox API

**Endpoint:** `POST /api/setrank`

**Headers:**
```
api-key: your-generated-api-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "roblox-cookie": "your-roblox-cookie",
  "group-id": 123456,
  "rank-id": 255,
  "roblox-username": "targetUsername"
}
```

**Success Response (200):**
```json
{
  "roblox-username": "targetUsername",
  "roblox-id": 123456789,
  "roblox-profile": "https://www.roblox.com/users/123456789/profile",
  "group-id": 123456,
  "rank-id": 255,
  "returnCode": 200
}
```

**Error Responses:**
- `400` - Invalid cookie or missing fields
- `401` - Invalid API key
- `403` - Insufficient permissions or moderated account
- `404` - Username not found
- `429` - API key is ratelimited

## 👮 Admin Features

### Moderation Actions
1. **Lock Account** - Completely blocks account access
2. **Disable Account** - Disables account functionality
3. **Ratelimit Account** - Temporary restriction with custom duration

All moderation actions:
- Require a detailed reason
- Are logged in moderation history
- Can be reversed with the "Unmoderate" button
- Affect API key validation

### User Search
- Search by Discord username or ID
- View all users with their moderation status
- See admin badges and active moderation flags

## 🗄️ Database

The application uses a JSON file-based database (`database.json`) that stores:
- **Users** - Discord profiles and admin status
- **API Keys** - Generated keys with usage tracking
- **Moderation Actions** - All moderation history

No compilation or external database required!

## 🚂 Railway Deployment

**1. Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

**2. Deploy to Railway:**
- Create new project in Railway
- Connect your GitHub repository
- Add environment variables in Railway dashboard:
  - `DISCORD_CLIENT_ID`
  - `DISCORD_CLIENT_SECRET`
  - `DISCORD_CALLBACK_URL` (update to your Railway URL)
  - `ADMIN_DISCORD_IDS`
  - `SESSION_SECRET`
- Railway will automatically run `npm start`

**3. Update Discord OAuth2:**
- Go to Discord Developer Portal
- Update redirect URL to: `https://your-railway-url.up.railway.app/auth/discord/callback`

## 📁 Project Structure

```
Aero API/
├── index.js                 # Main server (API + Dashboard)
├── database-simple.js       # JSON-based database
├── package.json            # Dependencies
├── .env                    # Environment variables
├── views/                  # EJS templates
│   ├── index.ejs          # Landing page
│   ├── dashboard.ejs      # User dashboard
│   └── admin.ejs          # Admin panel
└── public/                # Static assets
    ├── css/
    │   ├── style.css      # Main styles
    │   ├── dashboard.css  # Dashboard styles
    │   └── admin.css      # Admin styles
    └── js/
        ├── animations.js  # Landing animations
        ├── dashboard.js   # Dashboard functionality
        └── admin.js       # Admin functionality
```

## 🎨 Customization

### Theme Colors
Edit `public/css/style.css`:
```css
:root {
    --primary-color: #1e3a5f;      /* Dark sea blue */
    --secondary-color: #2c5f8d;    /* Medium sea blue */
    --accent-color: #3d7fb8;       /* Light sea blue */
    --border-color: #ffffff;       /* White outlines */
}
```

## 🔒 Security Notes

- Never commit `.env` file
- Keep Discord Client Secret secure
- Use HTTPS in production
- Session secret should be random and secure
- API keys are automatically tracked for usage

## 📝 Workflow

1. **User logs in** with Discord OAuth2
2. **User generates API key** in dashboard
3. **User uses API key** to call `/api/setrank` endpoint
4. **Admin can moderate users** if needed
5. **Moderated users** see warning and cannot use API keys

## 🐛 Troubleshooting

**Server won't start:**
- Check all environment variables are set in `.env`
- Verify Discord Client ID and Secret are correct
- Ensure port 3000 is not already in use

**Discord login fails:**
- Verify callback URL matches Discord settings exactly
- Check scopes include `identify` and `email`
- Ensure Client ID and Secret are correct

**Admin panel not accessible:**
- Verify your Discord ID is in `ADMIN_DISCORD_IDS`
- Restart server after changing `.env`
- Check you're logged in with correct Discord account

## 📄 License

MIT
