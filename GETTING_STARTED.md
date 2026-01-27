# Getting Started with Chess Trainer

Welcome! This guide will walk you through setting up and running the Chess Trainer application for the first time.

---

## 📚 Quick Links

- [Certification Requirements](CERTIFICATION_REQUIREMENTS.md) - Course requirements and deadlines
- [Project Plan](PROJECT_PLAN.md) - Roadmap and iterations
- [PRD](PRD.md) - Product requirements and features
- [Technical Spec](TECHNICAL_SPEC.md) - API design and architecture
- [Docker Setup](DOCKER_SETUP.md) - Database setup guide
- [GitHub Setup](GITHUB_SETUP.md) - Repository and CI/CD configuration

---

## 🎯 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 20+ LTS** - [Download](https://nodejs.org/)
- ✅ **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- ✅ **Git** - [Download](https://git-scm.com/)
- ✅ **Code Editor** - VS Code recommended

Optional:
- GitHub account (for version control and CI/CD)
- Lichess account (for OAuth testing)
- Google Cloud account (for OAuth testing)

---

## 🚀 Initial Setup (First Time Only)

### Step 1: Start PostgreSQL

```bash
# From project root directory
make setup
```

This command will:
- Create `.env` file from `.env.example`
- Start PostgreSQL Docker container
- Initialize the database

**Verify PostgreSQL is running:**
```bash
make ps
# Should show: chess-trainer-db (Up)
```

### Step 2: Configure Environment Variables

Edit the `.env` file in the project root:

```bash
# Open in your editor
code .env
# or
nano .env
```

**For local development, you can skip OAuth configuration initially.** The app will work in guest mode.

When you're ready to test OAuth:

1. **Lichess OAuth:**
   - Visit: https://lichess.org/account/oauth/app
   - Create new app with redirect URI: `http://localhost:3000/api/auth/lichess/callback`
   - Copy Client ID and Secret to `.env`

2. **Google OAuth:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Create OAuth client with redirect URI: `http://localhost:3000/api/auth/google/callback`
   - Copy Client ID and Secret to `.env`

### Step 3: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Set Up Backend

```bash
cd backend

# Copy backend .env
cp .env.example .env

# Run database migrations
npm run migration:run

# Import sample puzzles (optional but recommended)
npm run import:sample-puzzles
```

**Note:** Sample puzzle import script needs to be created. For now, you can manually insert test data or wait until the import script is implemented.

### Step 5: Set Up Frontend

```bash
cd frontend

# Copy frontend .env
cp .env.example .env
```

---

## 💻 Running the Application

### Development Mode (Daily Use)

You need **THREE terminal windows**:

**Terminal 1 - Database:**
```bash
# Start PostgreSQL (if not already running)
make up
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
Backend API runs on: http://localhost:3000/api
API Docs (Swagger): http://localhost:3000/api/docs

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:5173

### Quick Start Script (Optional)

You can create a start script for convenience. Create `start-dev.sh`:

```bash
#!/bin/bash
# Start all services for development

# Start database
docker-compose up -d

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend in background
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "Backend: http://localhost:3000/api"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT
wait
```

Make it executable:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

---

## 🧪 Testing

### Run Backend Tests

```bash
cd backend
npm test

# With coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Run Frontend Tests

```bash
cd frontend
npm test

# With UI
npm run test:ui
```

---

## 🗄️ Database Management

### Using psql (Command Line)

```bash
# Open database shell
make db-shell

# List tables
\dt

# Query users
SELECT * FROM users;

# Quit
\q
```

### Using pgAdmin (Web UI)

```bash
# Start PostgreSQL + pgAdmin
make up-tools
```

Access at: http://localhost:5050
- Email: admin@chess-trainer.local
- Password: admin

**Add server in pgAdmin:**
- Host: `postgres` (container name)
- Port: `5432`
- Database: `chess_trainer_dev`
- Username: `chess_trainer`
- Password: `chess_trainer_password`

### Common Database Tasks

```bash
# Backup database
make db-backup

# Restore database
make db-restore

# Reset database (⚠️ deletes all data!)
make db-reset

# View database logs
make logs
```

---

## 📝 Development Workflow

### Creating a New Feature

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/puzzle-solver
   ```

2. **Make changes and test locally**

3. **Run linting:**
   ```bash
   # Backend
   cd backend && npm run lint

   # Frontend
   cd frontend && npm run lint
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: implement puzzle solver"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/puzzle-solver
   # Then create PR on GitHub
   ```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add puzzle of the day feature"
git commit -m "fix: resolve authentication bug in OAuth flow"
git commit -m "docs: update API documentation"
```

---

## 🏗️ Project Structure Overview

```
chess-trainer/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── modules/     # Feature modules (auth, puzzles, etc.)
│   │   ├── entities/    # Database entities
│   │   ├── config/      # Configuration files
│   │   └── main.ts      # Application entry point
│   └── package.json
│
├── frontend/            # React + Refine
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API services
│   │   └── App.tsx      # Main app component
│   └── package.json
│
├── infra/               # Infrastructure
│   └── docker/         # Docker configs
│
├── .github/
│   └── workflows/      # GitHub Actions CI/CD
│
├── docker-compose.yml   # PostgreSQL setup
├── Makefile            # Development commands
└── README.md           # Main documentation
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Problem:** `Connection refused` or `ECONNREFUSED localhost:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
make ps

# If not running, start it
make up

# Check logs
make logs
```

### Port Already in Use

**Problem:** `Port 3000 already in use` or `Port 5173 already in use`

**Solution:**
```bash
# Find process using port
lsof -i :3000
lsof -i :5173

# Kill the process
kill -9 <PID>

# Or change port in configuration
# Backend: backend/.env (PORT=3001)
# Frontend: frontend/vite.config.ts (server.port)
```

### Module Not Found

**Problem:** `Cannot find module '@nestjs/core'` or similar

**Solution:**
```bash
# Clear node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

# Same for frontend if needed
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Database Migration Errors

**Problem:** Migration fails or tables not created

**Solution:**
```bash
cd backend

# Check migration status
npm run typeorm -- migration:show

# Revert last migration
npm run migration:revert

# Run migrations again
npm run migration:run

# If all else fails, reset database
cd ..
make db-reset
cd backend
npm run migration:run
```

### OAuth Redirect Issues

**Problem:** OAuth callback fails or redirects to wrong URL

**Solution:**
1. Verify redirect URIs match in OAuth app settings:
   - Lichess: `http://localhost:3000/api/auth/lichess/callback`
   - Google: `http://localhost:3000/api/auth/google/callback`

2. Check environment variables in `backend/.env`:
   ```env
   LICHESS_REDIRECT_URI=http://localhost:3000/api/auth/lichess/callback
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   ```

3. Ensure frontend URL is correct in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

---

## 📖 Learning Resources

### NestJS
- [Official Docs](https://docs.nestjs.com/)
- [TypeORM Guide](https://typeorm.io/)

### React + Refine
- [Refine Docs](https://refine.dev/docs/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### Chess Libraries
- [chess.js](https://github.com/jhlywa/chess.js)
- [react-chessboard](https://www.npmjs.com/package/react-chessboard)

### Lichess
- [Lichess API](https://lichess.org/api)
- [Puzzle Database](https://database.lichess.org/#puzzles)

---

## ✅ Checklist for First Run

- [ ] Docker Desktop installed and running
- [ ] Node.js 20+ installed (`node --version`)
- [ ] PostgreSQL started (`make up`)
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] Database migrations run (`cd backend && npm run migration:run`)
- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Frontend running (`cd frontend && npm run dev`)
- [ ] Can access http://localhost:5173 in browser

---

## 🎯 Next Steps After Setup

1. **Explore the application:**
   - Try guest login
   - Browse mock puzzle categories
   - View statistics page

2. **Configure OAuth (optional):**
   - Set up Lichess OAuth app
   - Set up Google OAuth app
   - Test login flows

3. **Import puzzle data:**
   - Download Lichess puzzle database
   - Run import script (when implemented)

4. **Start development:**
   - Pick a feature from [PROJECT_PLAN.md](PROJECT_PLAN.md)
   - Create a feature branch
   - Implement the feature
   - Write tests
   - Create a PR

5. **Set up GitHub repository:**
   - Follow [GITHUB_SETUP.md](GITHUB_SETUP.md)
   - Push code to GitHub
   - Configure CI/CD pipeline

---

## 💡 Helpful Make Commands

```bash
make help        # Show all available commands
make setup       # Initial setup (one-time)
make up          # Start PostgreSQL
make down        # Stop PostgreSQL
make logs        # View database logs
make db-shell    # Open database shell
make db-reset    # Reset database
make install     # Install all dependencies
```

---

## 🆘 Getting Help

If you run into issues:

1. **Check documentation:**
   - [DOCKER_SETUP.md](DOCKER_SETUP.md) - Database issues
   - [Backend README](backend/README.md) - Backend issues
   - [Frontend README](frontend/README.md) - Frontend issues

2. **Check logs:**
   ```bash
   # Database logs
   make logs

   # Backend logs (in terminal running backend)
   # Frontend logs (in terminal running frontend)
   ```

3. **Search for error messages:**
   - Google the error
   - Check GitHub issues in related libraries
   - Search Stack Overflow

4. **Ask for help:**
   - Przeprogramowani Discord/Slack
   - Create a GitHub issue (after setup)

---

## 🎓 Certification Checklist

Track your progress toward certification:

### MVP Features (Iteration 1)
- [ ] User authentication (Lichess OAuth, Google OAuth, Guest mode)
- [ ] Puzzle solving interface with chess board
- [ ] Puzzle categories (themes and openings)
- [ ] Puzzle of the Day
- [ ] Progress tracking (attempts saved to database)
- [ ] Basic statistics dashboard
- [ ] Puzzle history with retry capability
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] E2E test implemented
- [ ] Application deployed (mikr.us or other)

### Documentation
- [ ] PRD completed
- [ ] Technical specification completed
- [ ] README with setup instructions

### Submission
- [ ] All mandatory requirements met
- [ ] Tests passing
- [ ] CI/CD working
- [ ] Application accessible via public URL (optional for MVP)
- [ ] Submitted before deadline (16.11, 14.12, or 01.02)

---

**Good luck with your certification project! 🚀**

For questions or clarifications, refer to the documentation files or reach out to the Przeprogramowani community.

---

**Last Updated:** 2026-01-26
