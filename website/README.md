# AeroAPI Dashboard - Modern Discord OAuth2 Platform

A beautiful, modern web dashboard with Discord OAuth2 authentication, API key management, and comprehensive admin moderation tools.

## Features

### 🎨 Modern Design
- **Dark Sea Blue Theme** - Beautiful gradient backgrounds with animated orbs
- **Smooth Animations** - Fade-ins, slide-ups, and hover effects throughout
- **Responsive Layout** - Works perfectly on desktop, tablet, and mobile
- **White Outlines** - Clean borders and accents

### 🔐 Authentication
- **Discord OAuth2** - Secure login with Discord
- **Session Management** - Persistent sessions with express-session
- **Auto Admin Detection** - Automatic admin role assignment based on Discord ID

### 🔑 API Key Management
- **Generate Keys** - Create unlimited API keys with custom names
- **Copy to Clipboard** - One-click copy functionality
- **Usage Tracking** - See when keys were created and last used
- **Delete Keys** - Remove keys you no longer need

### 👮 Admin Panel
- **User Management** - View all registered users
- **Search Functionality** - Search by Discord username or ID
- **Moderation Actions**:
  - **Lock Account** - Prevent all account access
  - **Disable Account** - Disable account functionality
  - **Ratelimit Account** - Temporary restriction with custom duration (days, hours, seconds)
- **Moderation History** - View all past moderation actions
- **Unmoderate Users** - Remove moderation actions
- **Reason Required** - All actions require a detailed reason

### 🚫 Moderated User Experience
When a user is moderated, they see:
- Red warning icon
- Clear status message (locked/disabled/ratelimited)
- The reason for moderation
- Sidebar tabs still visible but content blocked

### 💾 Database
- **SQLite** - Lightweight, file-based database
- **Auto-migration** - Tables created automatically on first run
- **Indexed Queries** - Optimized for performance

## Installation

1. **Install Dependencies**
```bash
cd website
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `DISCORD_CLIENT_ID` - From Discord Developer Portal
- `DISCORD_CLIENT_SECRET` - From Discord Developer Portal
- `DISCORD_CALLBACK_URL` - Your callback URL (update for production)
- `ADMIN_DISCORD_IDS` - Comma-separated Discord user IDs for admins
- `SESSION_SECRET` - Random string for session encryption

3. **Set Up Discord Application**
- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Create a new application
- Go to OAuth2 settings
- Add redirect URL: `http://localhost:3001/auth/discord/callback`
- Copy Client ID and Client Secret to `.env`
- Under OAuth2 > General, enable `identify` and `email` scopes

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The application will be available at `http://localhost:3001`

## Project Structure

```
website/
├── server.js              # Express server with OAuth2 setup
├── database.js            # SQLite database configuration
├── package.json           # Dependencies
├── .env                   # Environment variables (create from .env.example)
├── views/                 # EJS templates
│   ├── index.ejs         # Landing page
│   ├── dashboard.ejs     # User dashboard
│   └── admin.ejs         # Admin panel
└── public/               # Static assets
    ├── css/
    │   ├── style.css     # Main styles with animations
    │   ├── dashboard.css # Dashboard-specific styles
    │   └── admin.css     # Admin panel styles
    └── js/
        ├── animations.js # Landing page animations
        ├── dashboard.js  # Dashboard functionality
        └── admin.js      # Admin panel functionality
```

## API Endpoints

### Authentication
- `GET /auth/discord` - Initiate Discord OAuth2 flow
- `GET /auth/discord/callback` - OAuth2 callback
- `GET /logout` - Logout user

### User Dashboard
- `GET /dashboard` - User dashboard page
- `GET /api/user/keys` - Get user's API keys
- `POST /api/user/keys/generate` - Generate new API key
- `DELETE /api/user/keys/:id` - Delete API key

### Admin Panel
- `GET /admin` - Admin panel page (admin only)
- `GET /api/admin/users` - Get all users with search
- `POST /api/admin/moderate` - Apply moderation action
- `POST /api/admin/unmoderate` - Remove moderation action
- `GET /api/admin/moderation-history/:userId` - Get user's moderation history

### API Key Validation
- `GET /api/validate-key/:apiKey` - Validate API key (for external use)

## Admin Features

### Making a User Admin
Add their Discord user ID to the `ADMIN_DISCORD_IDS` environment variable:
```env
ADMIN_DISCORD_IDS=123456789012345678,987654321098765432
```

### Moderation Actions

**Lock Account**
- Completely blocks account access
- User sees warning message
- Cannot generate or use API keys

**Disable Account**
- Disables account functionality
- Similar to lock but different status
- Cannot generate or use API keys

**Ratelimit Account**
- Temporary restriction
- Specify duration in days, hours, and seconds
- Automatically expires after duration
- API keys return ratelimited status

### Unmoderate
- Select the specific action to remove
- Immediately restores access
- Keeps moderation history for records

## Security Features

- Session-based authentication
- CSRF protection via session tokens
- SQL injection prevention (prepared statements)
- XSS protection (HTML escaping)
- Secure password-less authentication via Discord
- Admin-only routes protected with middleware

## Customization

### Theme Colors
Edit CSS variables in `public/css/style.css`:
```css
:root {
    --primary-color: #1e3a5f;      /* Dark sea blue */
    --secondary-color: #2c5f8d;    /* Medium sea blue */
    --accent-color: #3d7fb8;       /* Light sea blue */
    --border-color: #ffffff;       /* White outlines */
}
```

### Animations
All animations are defined in the CSS files and can be customized:
- Fade-in effects
- Slide animations
- Hover transitions
- Floating gradient orbs
- Pulse effects

## Database Schema

### Users Table
- `id` - Primary key
- `discord_id` - Discord user ID (unique)
- `discord_username` - Discord username
- `discord_discriminator` - Discord discriminator
- `discord_avatar` - Avatar hash
- `email` - User email
- `is_admin` - Admin flag
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### API Keys Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `api_key` - Unique API key
- `name` - Key name/description
- `created_at` - Creation timestamp
- `last_used` - Last usage timestamp

### Moderation Actions Table
- `id` - Primary key
- `user_id` - Foreign key to users (target)
- `action_type` - lock/disable/ratelimit
- `reason` - Moderation reason
- `duration_seconds` - Duration (for ratelimit)
- `moderator_id` - Foreign key to users (moderator)
- `created_at` - Action timestamp
- `expires_at` - Expiration timestamp (for ratelimit)
- `is_active` - Active status flag

## Deployment

### Railway
1. Push code to GitHub
2. Create new Railway project
3. Connect GitHub repository
4. Add environment variables in Railway dashboard
5. Deploy

### Heroku
1. Create Heroku app
2. Set environment variables
3. Deploy via Git or GitHub integration

### VPS
1. Clone repository
2. Install Node.js
3. Configure `.env`
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name aeroapi-dashboard
pm2 save
pm2 startup
```

## Troubleshooting

**Discord OAuth not working**
- Verify Client ID and Secret are correct
- Check callback URL matches Discord settings
- Ensure scopes include `identify` and `email`

**Admin panel not accessible**
- Verify your Discord ID is in `ADMIN_DISCORD_IDS`
- Check you're logged in with the correct Discord account
- Restart server after changing environment variables

**Database errors**
- Ensure write permissions in project directory
- Delete `aeroapi.db` to reset database
- Check SQLite is properly installed

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
