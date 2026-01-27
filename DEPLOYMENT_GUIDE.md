# Chess Trainer - Deployment Guide for Mikr.us

This guide will help you deploy the Chess Trainer application to mikr.us hosting with PostgreSQL database and OAuth authentication.

## Table of Contents

1. [Mikr.us Server Setup](#1-mikrus-server-setup)
2. [PostgreSQL Shared Database Setup](#2-postgresql-shared-database-setup)
3. [Google OAuth Setup](#3-google-oauth-setup)
4. [Lichess OAuth Setup](#4-lichess-oauth-setup)
5. [Server Configuration](#5-server-configuration)
6. [GitHub Secrets Configuration](#6-github-secrets-configuration)
7. [Manual Deployment](#7-manual-deployment)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Mikr.us Server Setup

### Prerequisites
- Active mikr.us VPS account (plan 2.x or 3.x recommended for shared databases)
- SSH access to your server
- Basic Linux command line knowledge

### Initial Access
1. **Connect to your server via SSH:**
   ```bash
   ssh <username>@<your-server-ip>
   ```
   Use credentials provided by mikr.us.

2. **Update system packages:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Node.js 20.x:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Verify installation:**
   ```bash
   node --version  # Should show v20.x.x
   npm --version
   ```

5. **Install PM2 globally:**
   ```bash
   sudo npm install -g pm2
   ```

6. **Configure PM2 to start on boot:**
   ```bash
   pm2 startup
   # Follow the instructions shown (copy and run the generated command)
   ```

### Port Configuration
Mikr.us provides:
- 2 forwarded IPv4 ports initially (expandable to 7 total)
- One port for SSH
- IPv6 address for unlimited services

Check your mikr.us panel to see which ports are assigned to you.

---

## 2. PostgreSQL Shared Database Setup

### Access Shared Database
1. **Request PostgreSQL credentials:**
   - Go to: https://mikr.us/panel/?a=postgres
   - Request shared database access
   - Save the credentials (server, login, password, database name)

2. **Database Limits:**
   - Storage: 100MB per user (leniently enforced)
   - One database per user for PostgreSQL

3. **Connection Details Format:**
   ```
   Server: <postgres-server-hostname>
   Port: 5432
   Database: <your-database-name>
   Username: <your-username>
   Password: <your-password>
   ```

4. **Create DATABASE_URL:**
   ```bash
   DATABASE_URL=postgresql://<username>:<password>@<server>:5432/<database>
   ```

### Test Connection
From your local machine, test the connection:
```bash
psql "postgresql://<username>:<password>@<server>:5432/<database>"
```

---

## 3. Google OAuth Setup

### Create Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Sign in with your Google account

2. **Create a new project:**
   - Click "Select a project" → "New Project"
   - Name it "Chess Trainer" (or your preference)
   - Click "Create"

3. **Enable required APIs:**
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - Google+ API (or People API)
     - Google OAuth2 API

4. **Configure OAuth Consent Screen:**
   - Go to "OAuth consent screen"
   - Select "External" (for public use)
   - Fill in:
     - App name: "Chess Trainer"
     - User support email: your email
     - Developer contact: your email
   - Add scopes:
     - `userinfo.email`
     - `userinfo.profile`
   - Save and continue

5. **Create OAuth 2.0 Client ID:**
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Chess Trainer Web"
   - Authorized JavaScript origins:
     ```
     http://localhost:5173 (for local development)
     https://your-domain.com (for production)
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/google/callback (local)
     https://your-domain.com/api/auth/google/callback (production)
     ```
   - Click "Create"

6. **Save Credentials:**
   - Copy the Client ID → This is `GOOGLE_CLIENT_ID`
   - Copy the Client Secret → This is `GOOGLE_CLIENT_SECRET`
   - **Important:** Keep the Client Secret secure!

### Configuration Values Needed:
```bash
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
```

---

## 4. Lichess OAuth Setup

Lichess has a simpler OAuth setup than most providers - no app registration required!

### For Personal Use (Simple Method)

1. **Create Personal Access Token:**
   - Visit: https://lichess.org/account/oauth/token/create
   - Or navigate: Click username → Preferences → API Access tokens → '+' button

2. **Configure token:**
   - Description: "Chess Trainer App"
   - Select scopes needed:
     - `Read email address` (email:read)
     - `Read preferences` (preference:read)
   - Click "Create"

3. **Save the token:**
   - Copy the token immediately (you won't see it again!)
   - This can be used for testing

### For Multi-User OAuth (Recommended for Production)

Lichess supports standard OAuth 2.0 without requiring app registration:

1. **OAuth Endpoints:**
   ```
   Authorization: https://lichess.org/oauth
   Token: https://lichess.org/api/token
   User Info: https://lichess.org/api/account
   ```

2. **Configuration Values Needed:**
   ```bash
   LICHESS_CLIENT_ID=chess-trainer-app  # Can be any identifier
   LICHESS_CALLBACK_URL=https://your-domain.com/api/auth/lichess/callback
   ```

3. **Scopes Available:**
   - `email:read` - Read email address
   - `preference:read` - Read preferences
   - `challenge:read` - Read incoming challenges
   - `challenge:write` - Create, accept, decline challenges

4. **Implementation Notes:**
   - Lichess uses PKCE (Proof Key for Code Exchange) for added security
   - No client secret is required
   - Perfect for client-side and mobile apps
   - Official API docs: https://lichess.org/api

### Your Backend Configuration

For your NestJS backend, you'll configure Lichess OAuth in `backend/src/modules/auth/`:

```typescript
// No client secret needed for Lichess!
LICHESS_CLIENT_ID: process.env.LICHESS_CLIENT_ID,
LICHESS_CALLBACK_URL: process.env.LICHESS_CALLBACK_URL,
```

---

## 5. Server Configuration

### Create Application Directory

```bash
# Connect to your mikr.us server
ssh <username>@<server-ip>

# Create application directory
sudo mkdir -p /var/www/chess-trainer
sudo chown -R $USER:$USER /var/www/chess-trainer
cd /var/www/chess-trainer
```

### Environment Variables

Create environment file for backend:

```bash
cd /var/www/chess-trainer
nano .env
```

Add the following (replace with your actual values):

```bash
# Database
DATABASE_URL=postgresql://<username>:<password>@<server>:5432/<database>
NODE_ENV=production

# JWT
JWT_SECRET=<generate-a-strong-random-secret>  # Use: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback

# Lichess OAuth
LICHESS_CLIENT_ID=chess-trainer-app
LICHESS_CALLBACK_URL=https://your-domain.com/api/auth/lichess/callback

# Application
PORT=<your-assigned-port>  # Check mikr.us panel
FRONTEND_URL=https://your-domain.com
```

### Generate JWT Secret

```bash
openssl rand -base64 32
```

### PM2 Ecosystem File (Optional but Recommended)

Create `ecosystem.config.js` in `/var/www/chess-trainer/`:

```javascript
module.exports = {
  apps: [{
    name: 'chess-trainer-api',
    script: './backend/dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false
  }]
}
```

---

## 6. GitHub Secrets Configuration

Configure these secrets in your GitHub repository for automated deployment:

### Navigate to GitHub Secrets
1. Go to your repository on GitHub
2. Click "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"

### Required Secrets

| Secret Name | Description | Example/How to Get |
|-------------|-------------|-------------------|
| `MIKR_US_HOST` | Your mikr.us server IP or hostname | `123.456.789.0` or `s42.mikr.us` |
| `MIKR_US_USER` | SSH username | Check mikr.us panel |
| `MIKR_US_SSH_KEY` | Private SSH key content | Generate: `ssh-keygen -t ed25519` |
| `APP_URL` | Your application URL (optional) | `https://your-domain.com` |

### Generate SSH Key for Deployment

On your **local machine**:

```bash
# Generate new SSH key for deployment
ssh-keygen -t ed25519 -C "github-actions-chess-trainer" -f ~/.ssh/chess-trainer-deploy

# Copy public key to clipboard (macOS)
cat ~/.ssh/chess-trainer-deploy.pub | pbcopy

# Copy private key to clipboard (macOS)
cat ~/.ssh/chess-trainer-deploy | pbcopy
```

On your **mikr.us server**:

```bash
# Add public key to authorized_keys
nano ~/.ssh/authorized_keys
# Paste the public key, save and exit

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

On **GitHub**:
- Add the **private key** content to GitHub Secret `MIKR_US_SSH_KEY`
- Include the entire key:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  <key content>
  -----END OPENSSH PRIVATE KEY-----
  ```

### Environment Variables on Server

The deployment will use the `.env` file you created on the server. Make sure it exists at:
```
/var/www/chess-trainer/.env
```

---

## 7. Manual Deployment

If you prefer to deploy manually or want to test before setting up automated deployment:

### First-Time Deployment

```bash
# 1. Connect to server
ssh <username>@<server-ip>

# 2. Navigate to app directory
cd /var/www/chess-trainer

# 3. Clone repository (first time only)
git clone git@github.com:mateuszbyczkowski/chess-trainer.git .
# Or use HTTPS if SSH keys not set up:
# git clone https://github.com/mateuszbyczkowski/chess-trainer.git .

# 4. Install backend dependencies
cd backend
npm ci --production

# 5. Build backend
npm run build

# 6. Run database migrations
npm run migration:run

# 7. Install frontend dependencies and build
cd ../frontend
npm ci
npm run build

# 8. Start application with PM2
cd ..
pm2 start ecosystem.config.js

# 9. Save PM2 configuration
pm2 save

# 10. Check status
pm2 status
pm2 logs chess-trainer-api
```

### Subsequent Deployments

```bash
# 1. Connect to server
ssh <username>@<server-ip>

# 2. Navigate to app directory
cd /var/www/chess-trainer

# 3. Pull latest changes
git pull origin main

# 4. Update and build backend
cd backend
npm ci --production
npm run build

# 5. Run migrations
npm run migration:run

# 6. Update and build frontend
cd ../frontend
npm ci
npm run build

# 7. Restart application
cd ..
pm2 restart chess-trainer-api

# 8. Check status
pm2 status
pm2 logs chess-trainer-api --lines 50
```

### Useful PM2 Commands

```bash
# View application status
pm2 status

# View logs (real-time)
pm2 logs chess-trainer-api

# View last 100 log lines
pm2 logs chess-trainer-api --lines 100

# Restart application
pm2 restart chess-trainer-api

# Stop application
pm2 stop chess-trainer-api

# Delete from PM2
pm2 delete chess-trainer-api

# Monitor resource usage
pm2 monit

# View detailed info
pm2 show chess-trainer-api
```

---

## 8. Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to PostgreSQL database

**Solutions:**
1. Verify credentials in mikr.us panel
2. Test connection:
   ```bash
   psql "postgresql://<user>:<pass>@<server>:5432/<db>"
   ```
3. Check if database exists:
   ```sql
   \l  -- List all databases
   ```
4. Verify DATABASE_URL in `.env` file

### Port Issues

**Problem:** Application not accessible

**Solutions:**
1. Check mikr.us panel for assigned ports
2. Verify PORT in `.env` matches assigned port
3. Check if port is open:
   ```bash
   netstat -tuln | grep <port>
   ```
4. Ensure PM2 is running:
   ```bash
   pm2 status
   ```

### PM2 Application Crashes

**Problem:** Application keeps restarting

**Solutions:**
1. Check logs:
   ```bash
   pm2 logs chess-trainer-api --lines 100
   ```
2. Verify all environment variables are set:
   ```bash
   pm2 show chess-trainer-api
   ```
3. Test application manually:
   ```bash
   cd /var/www/chess-trainer/backend
   node dist/main.js
   ```
4. Check for missing dependencies:
   ```bash
   npm ci --production
   ```

### OAuth Issues

**Problem:** OAuth login not working

**Solutions:**

**Google:**
1. Verify redirect URIs match exactly in Google Console
2. Check client ID and secret in `.env`
3. Ensure OAuth consent screen is configured
4. Check callback URL format: `https://domain.com/api/auth/google/callback`

**Lichess:**
1. Verify callback URL in `.env`
2. Check Lichess API status: https://lichess.org/api
3. Ensure scopes are correct
4. Test with personal token first

### Migration Failures

**Problem:** Database migrations fail

**Solutions:**
1. Check database connection
2. Verify user has CREATE/ALTER permissions
3. Run migrations manually:
   ```bash
   cd /var/www/chess-trainer/backend
   npm run migration:run
   ```
4. Check migration status:
   ```bash
   npm run typeorm -- migration:show -d src/config/typeorm.config.ts
   ```
5. Revert last migration if needed:
   ```bash
   npm run migration:revert
   ```

### GitHub Actions Deployment Failures

**Problem:** CI/CD pipeline fails

**Solutions:**

1. **SSH Connection Errors:**
   - Verify SSH key is correct in GitHub Secrets
   - Check key format includes BEGIN and END lines
   - Ensure public key is in `~/.ssh/authorized_keys` on server
   - Test SSH connection locally:
     ```bash
     ssh -i ~/.ssh/chess-trainer-deploy user@server
     ```

2. **SCP Transfer Failures:**
   - Verify target directory exists: `/var/www/chess-trainer`
   - Check directory permissions
   - Ensure enough disk space:
     ```bash
     df -h
     ```

3. **Build Failures:**
   - Check Node.js version (should be 20.x)
   - Verify package.json and lock files are committed
   - Clear npm cache if needed:
     ```bash
     npm cache clean --force
     ```

### Disk Space Issues

**Problem:** Running out of disk space

**Solutions:**
1. Check disk usage:
   ```bash
   df -h
   du -sh /var/www/chess-trainer/*
   ```
2. Clean PM2 logs:
   ```bash
   pm2 flush
   ```
3. Remove old node_modules:
   ```bash
   rm -rf node_modules && npm ci --production
   ```
4. Clean npm cache:
   ```bash
   npm cache clean --force
   ```

### SSL/HTTPS Setup

For production, you'll want HTTPS. On mikr.us:

1. **Using Nginx as reverse proxy:**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:<your-port>;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

---

## Quick Checklist

Before going live, verify:

- [ ] Mikr.us server is accessible via SSH
- [ ] PostgreSQL shared database credentials obtained
- [ ] Google OAuth credentials created and redirect URIs configured
- [ ] Lichess OAuth callback URL configured
- [ ] `.env` file created on server with all variables
- [ ] JWT_SECRET generated and added to `.env`
- [ ] Application directory created: `/var/www/chess-trainer`
- [ ] PM2 installed and configured for startup
- [ ] GitHub Secrets configured (if using automated deployment)
- [ ] SSH keys generated and added to server
- [ ] Database migrations run successfully
- [ ] Frontend built and serving correctly
- [ ] Backend API responding to health checks
- [ ] OAuth login tested for both Google and Lichess
- [ ] PM2 process saved and set to auto-start

---

## Resources

- **Mikr.us Documentation:** https://wiki.mikr.us/
- **Mikr.us PostgreSQL Setup:** https://wiki.mikr.us/wspoldzielone_bazy_danych/
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **Google OAuth Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Lichess API Documentation:** https://lichess.org/api
- **Lichess OAuth Token Creation:** https://lichess.org/account/oauth/token/create
- **PM2 Documentation:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **NestJS Deployment:** https://docs.nestjs.com/techniques/security

---

## Support

If you encounter issues not covered in this guide:

1. Check mikr.us wiki: https://wiki.mikr.us/
2. Review application logs: `pm2 logs chess-trainer-api`
3. Check database connectivity
4. Verify all environment variables are set correctly
5. Review GitHub Actions logs (if using automated deployment)

Good luck with your deployment! 🚀
