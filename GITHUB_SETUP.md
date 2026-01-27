# GitHub Repository & CI/CD Setup Guide

This guide explains how to set up the GitHub repository and configure the CI/CD pipeline.

---

## 📦 Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Login to GitHub
gh auth login

# Create repository (from project root)
gh repo create chess-trainer --public --source=. --remote=origin

# Push code
git init
git add .
git commit -m "feat: initial project setup with backend, frontend, and CI/CD"
git branch -M main
git push -u origin main
```

### Option B: Using GitHub Web Interface

1. Go to https://github.com/new
2. Repository name: `chess-trainer`
3. Description: "Chess puzzle training platform - Przeprogramowani certification project"
4. Visibility: Public (or Private)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

Then push your code:

```bash
git init
git add .
git commit -m "feat: initial project setup with backend, frontend, and CI/CD"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chess-trainer.git
git push -u origin main
```

---

## 🔐 Step 2: Configure GitHub Secrets

The CI/CD pipeline requires several secrets to be configured in your GitHub repository.

### Navigate to Secrets Settings

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `MIKR_US_HOST` | Your mikr.us server hostname/IP | From mikr.us dashboard |
| `MIKR_US_USER` | SSH username for your server | From mikr.us dashboard (usually `root` or your username) |
| `MIKR_US_SSH_KEY` | Private SSH key for authentication | Generate using `ssh-keygen` (see below) |
| `APP_URL` | Your application URL | e.g., `https://chess-trainer.yourdomain.com` |

### Generating SSH Key for Deployment

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-chess-trainer" -f ~/.ssh/chess-trainer-deploy

# Copy private key to clipboard (for GitHub Secret)
# macOS:
cat ~/.ssh/chess-trainer-deploy | pbcopy
# Linux:
cat ~/.ssh/chess-trainer-deploy | xclip -selection clipboard

# Copy public key (to add to server)
cat ~/.ssh/chess-trainer-deploy.pub
```

**Add Private Key to GitHub:**
1. Create secret `MIKR_US_SSH_KEY`
2. Paste the entire private key content (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

**Add Public Key to mikr.us Server:**
```bash
# SSH into your server
ssh your_username@your_mikr_us_host

# Add public key to authorized_keys
echo "YOUR_PUBLIC_KEY_CONTENT_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Adding Secrets to GitHub

For each secret:

1. Click **New repository secret**
2. Enter the secret name (e.g., `MIKR_US_HOST`)
3. Paste the secret value
4. Click **Add secret**

---

## 🔧 Step 3: Configure Repository Settings

### Branch Protection Rules

Protect the `main` branch:

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Select: `test-backend`, `test-frontend`, `e2e-test`
   - ✅ Require branches to be up to date before merging
5. Click **Create**

### Enable GitHub Actions

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", select:
   - ✅ Allow all actions and reusable workflows
3. Under "Workflow permissions", select:
   - ✅ Read and write permissions
4. Click **Save**

---

## 🚀 Step 4: Test the CI/CD Pipeline

### Test on Pull Request

```bash
# Create a new branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify CI pipeline"
git push origin test/ci-pipeline

# Create pull request
gh pr create --title "Test CI Pipeline" --body "Testing CI/CD workflow"
```

The pipeline will:
1. ✅ Run linting (backend + frontend)
2. ✅ Run unit tests
3. ✅ Build backend and frontend
4. ✅ Run E2E tests
5. ❌ NOT deploy (only on merge to main)

### Test Deployment

```bash
# Merge the PR
gh pr merge --squash

# Or merge via GitHub web interface
```

The pipeline will:
1. Run all tests
2. Build for production
3. Deploy to mikr.us
4. Run migrations
5. Restart backend service
6. Run smoke test

---

## 📊 Step 5: Monitor CI/CD

### View Workflow Runs

1. Go to repository **Actions** tab
2. Click on a workflow run to see details
3. Click on individual jobs to see logs

### Check Deployment Status

```bash
# SSH into your server
ssh your_username@your_mikr_us_host

# Check if backend is running
pm2 list

# Check backend logs
pm2 logs chess-trainer-api

# Check if frontend files are deployed
ls -la /var/www/chess-trainer/frontend/dist

# Test API health endpoint
curl http://localhost:3000/api/health
```

---

## 🐛 Troubleshooting

### Pipeline Fails: Authentication Error

**Problem:** `Permission denied (publickey)`

**Solution:**
- Verify `MIKR_US_SSH_KEY` secret contains the correct private key
- Ensure public key is added to server's `~/.ssh/authorized_keys`
- Test SSH connection manually: `ssh -i ~/.ssh/chess-trainer-deploy user@host`

### Pipeline Fails: Tests Don't Pass

**Problem:** Tests fail in CI but pass locally

**Solution:**
- Check PostgreSQL service is running in workflow
- Verify environment variables are set correctly
- Run tests locally with: `DATABASE_URL=postgresql://chess_trainer:chess_trainer_password@localhost:5432/chess_trainer_test npm test`

### Deployment Succeeds But App Doesn't Work

**Problem:** Deployment completes but application errors

**Solution:**
- SSH into server and check logs: `pm2 logs chess-trainer-api`
- Verify environment variables on server (`.env` file)
- Check database migrations ran: `cd /var/www/chess-trainer/backend && npm run migration:show`
- Restart manually: `pm2 restart chess-trainer-api`

### Migration Fails During Deployment

**Problem:** Database migration errors in deployment

**Solution:**
- Check migration files for syntax errors
- Verify database connection from server
- Run migrations manually: `ssh user@host "cd /var/www/chess-trainer/backend && npm run migration:run"`
- Revert if needed: `npm run migration:revert`

---

## 📝 Environment Variables on Server

After first deployment, SSH into your server and create the `.env` file:

```bash
# SSH into server
ssh your_username@your_mikr_us_host

# Create backend .env file
cd /var/www/chess-trainer/backend
nano .env
```

Add your production environment variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/chess_trainer_prod

JWT_SECRET=your_production_jwt_secret_here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_production_refresh_secret_here
REFRESH_TOKEN_EXPIRES_IN=30d

LICHESS_CLIENT_ID=your_production_lichess_client_id
LICHESS_CLIENT_SECRET=your_production_lichess_secret
LICHESS_REDIRECT_URI=https://yourdomain.com/api/auth/lichess/callback

GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

Save and restart:

```bash
pm2 restart chess-trainer-api
```

---

## 🔄 Development Workflow

### Feature Development

```bash
# Create feature branch
git checkout -b feature/puzzle-solver

# Make changes, commit
git add .
git commit -m "feat: implement puzzle solver"

# Push and create PR
git push origin feature/puzzle-solver
gh pr create --title "Add puzzle solver" --body "Implements puzzle solving interface"

# CI will run automatically on PR
# Merge when tests pass
gh pr merge --squash
```

### Hotfix

```bash
# Create hotfix branch from main
git checkout main
git pull
git checkout -b hotfix/critical-bug

# Fix bug, commit
git add .
git commit -m "fix: resolve critical authentication bug"

# Push and merge immediately
git push origin hotfix/critical-bug
gh pr create --title "Hotfix: Auth Bug" --body "Critical fix"
gh pr merge --squash
```

---

## 📋 CI/CD Pipeline Overview

### On Pull Request:
```
┌─────────────┐
│ Pull Request│
└──────┬──────┘
       │
       ├──► Lint Backend
       ├──► Lint Frontend
       ├──► Test Backend
       ├──► Test Frontend
       ├──► Build Backend
       ├──► Build Frontend
       └──► E2E Tests
            │
            └──► ✅ All checks pass → Ready to merge
```

### On Merge to Main:
```
┌──────────────┐
│ Push to Main │
└──────┬───────┘
       │
       ├──► Run all tests
       │
       ├──► Build for production
       │
       ├──► Deploy to mikr.us
       │    ├─► Copy backend dist
       │    ├─► Copy frontend dist
       │    ├─► Install dependencies
       │    ├─► Run migrations
       │    └─► Restart PM2 service
       │
       └──► Smoke test
            │
            └──► ✅ Deployment complete
```

---

## 🎯 Next Steps

1. ✅ Create GitHub repository
2. ✅ Configure secrets
3. ✅ Set up branch protection
4. ✅ Test CI pipeline with a PR
5. ✅ Verify deployment works
6. ✅ Add domain and SSL certificate (optional)
7. ✅ Set up monitoring (optional)

---

**Last Updated:** 2026-01-26
