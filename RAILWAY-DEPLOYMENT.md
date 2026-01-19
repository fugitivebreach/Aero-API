# 🚂 Railway Deployment Guide - AeroAPI

Complete guide to deploy your AeroAPI application to Railway.

---

## 📋 Pre-Deployment Checklist

### ✅ Required Files (Already in Place)
- [x] `package.json` - Dependencies and start script
- [x] `index.js` - Main server file
- [x] `.gitignore` - Prevents sensitive files from being committed
- [x] `.env.example` - Template for environment variables
- [x] All frontend files (`views/`, `public/`)
- [x] `database-simple.js` - JSON-based database

### ⚙️ What You Need Before Deploying
1. **GitHub Account** - To connect your repository
2. **Railway Account** - Sign up at https://railway.app
3. **Discord Application** - For OAuth2 (create at https://discord.com/developers/applications)
4. **Your Discord User ID** - To set yourself as admin

---

## 🎯 Step-by-Step Deployment

### **Step 1: Set Up Discord Application**

1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it "AeroAPI" (or your preferred name)
4. Go to **OAuth2** → **General**
5. Copy your **Client ID** (save for later)
6. Click **"Reset Secret"** and copy your **Client Secret** (save for later)
7. Under **Redirects**, click **"Add Redirect"**
8. For now, add: `http://localhost:3000/auth/discord/callback`
   - You'll update this with your Railway URL after deployment
9. Click **"Save Changes"**

### **Step 2: Get Your Discord User ID**

1. Open Discord
2. Go to **Settings** → **Advanced**
3. Enable **Developer Mode**
4. Close settings, right-click your profile → **Copy User ID**
5. Save this ID for later

### **Step 3: Push to GitHub**

```bash
cd "c:\Users\Owner\Downloads\Aero API"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - AeroAPI with dashboard"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### **Step 4: Deploy to Railway**

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your AeroAPI repository
6. Railway will automatically detect it's a Node.js app

### **Step 5: Configure Environment Variables**

In Railway dashboard, go to your project → **Variables** tab and add:

```env
PORT=3000
SESSION_SECRET=your-random-secret-key-here-make-it-long-and-random

DISCORD_CLIENT_ID=paste-your-discord-client-id
DISCORD_CLIENT_SECRET=paste-your-discord-client-secret
DISCORD_CALLBACK_URL=https://YOUR-RAILWAY-URL.up.railway.app/auth/discord/callback

ADMIN_DISCORD_IDS=paste-your-discord-user-id
```

**Important Notes:**
- Replace `YOUR-RAILWAY-URL` with your actual Railway URL (you'll get this after deployment)
- For `SESSION_SECRET`, use a long random string (e.g., generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- You can add multiple admin IDs separated by commas: `123456789,987654321`

### **Step 6: Get Your Railway URL**

1. After deployment, Railway will assign you a URL
2. Go to **Settings** tab in Railway
3. Under **Domains**, you'll see something like: `aeroapi-production-xxxx.up.railway.app`
4. Copy this URL

### **Step 7: Update Discord Redirect URL**

1. Go back to Discord Developer Portal
2. Open your application → **OAuth2** → **General**
3. Under **Redirects**, add your Railway URL:
   ```
   https://your-railway-url.up.railway.app/auth/discord/callback
   ```
4. Click **"Save Changes"**

### **Step 8: Update Railway Environment Variable**

1. Go back to Railway → **Variables**
2. Update `DISCORD_CALLBACK_URL` with your actual Railway URL:
   ```
   https://your-railway-url.up.railway.app/auth/discord/callback
   ```
3. Save changes (Railway will automatically redeploy)

---

## 🎉 Testing Your Deployment

1. Visit your Railway URL: `https://your-railway-url.up.railway.app`
2. You should see the AeroAPI landing page with animations
3. Click **"Login with Discord"**
4. Authorize the application
5. You should be redirected to your dashboard
6. Test generating an API key
7. Test the admin panel (if you set yourself as admin)

---

## 📊 Monitoring & Logs

### View Logs
- In Railway dashboard → **Deployments** tab
- Click on the latest deployment to see logs
- Check for any errors during startup

### Check Database
- Railway will create a `database.json` file automatically
- This persists between deployments
- Located in your project's file system

### Monitor Usage
- Railway dashboard shows:
  - CPU usage
  - Memory usage
  - Network traffic
  - Request logs

---

## 🔧 Common Issues & Solutions

### Issue: "InternalOAuthError: Failed to obtain access token"
**Solution:** 
- Verify Discord Client ID and Secret are correct
- Ensure callback URL matches exactly in both Discord and Railway
- Check that redirect URL is added in Discord Developer Portal

### Issue: "Cannot find module"
**Solution:**
- Railway should auto-install dependencies
- Check `package.json` has all required dependencies
- View deployment logs for specific missing modules

### Issue: Database not persisting
**Solution:**
- Railway automatically provides persistent storage
- `database.json` is created in the project root
- Check file permissions in logs

### Issue: Port already in use
**Solution:**
- Railway automatically assigns a port
- Your app uses `process.env.PORT || 3000`
- No action needed

---

## 🚀 Custom Domain (Optional)

1. In Railway → **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Add the CNAME record to your DNS provider:
   - Type: `CNAME`
   - Name: `api` (or your subdomain)
   - Value: Your Railway domain
5. Wait for DNS propagation (5-30 minutes)
6. Update Discord callback URL to use your custom domain

---

## 📝 Post-Deployment Updates

### To Deploy Changes:
```bash
git add .
git commit -m "Your update message"
git push
```

Railway will automatically detect the push and redeploy.

### To Update Environment Variables:
1. Go to Railway → **Variables**
2. Edit or add variables
3. Railway will automatically redeploy

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong SESSION_SECRET** - Generate a random 32+ character string
3. **Keep Discord Client Secret private** - Only in Railway environment variables
4. **Regularly rotate secrets** - Update Discord Client Secret periodically
5. **Monitor admin access** - Check who has admin privileges
6. **Review API key usage** - Use the admin panel to monitor users

---

## 📞 Support Resources

- **Railway Docs:** https://docs.railway.app
- **Discord Developer Docs:** https://discord.com/developers/docs
- **Railway Community:** https://discord.gg/railway
- **Your Project Logs:** Railway Dashboard → Deployments

---

## ✅ Deployment Complete!

Your AeroAPI is now live! Share your Railway URL with users and they can:
- Login with Discord
- Generate API keys
- Use the API for Roblox group management
- Admins can moderate users

**Your API Endpoint:**
```
POST https://your-railway-url.up.railway.app/api/setrank
```

**Your Dashboard:**
```
https://your-railway-url.up.railway.app
```

Enjoy your deployed AeroAPI! 🎉
