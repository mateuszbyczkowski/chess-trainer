# ♟️ Chess Trainer

A chess puzzle training platform built with the Lichess puzzle database. Practice tactics, track your progress, and improve your chess skills.

**Status:** 🚧 In Development - Iteration 1 (MVP)

---

## 📋 Project Documentation

### Setup & Development
- [Getting Started](GETTING_STARTED.md) - Complete local development setup guide
- [Docker Setup Guide](DOCKER_SETUP.md) - Local PostgreSQL environment setup
- [Backend README](backend/README.md) - Backend architecture and API documentation
- [Frontend README](frontend/README.md) - Frontend components and structure

### Deployment & Production
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - **Mikr.us production deployment**
  - Server setup with Node.js 20 and PM2
  - PostgreSQL shared database (100MB limit)
  - Google OAuth production setup
  - Lichess OAuth configuration
  - GitHub Secrets and CI/CD configuration
  - Troubleshooting guide
- [Lichess OAuth Setup](LICHESS_OAUTH_SETUP.md) - **Detailed Lichess OAuth guide**
  - No app registration required
  - PKCE implementation
  - Complete OAuth flow
  - Troubleshooting and examples
- [GitHub Setup](GITHUB_SETUP.md) - Repository and CI/CD pipeline configuration

### Project Planning
- [Certification Requirements](CERTIFICATION_REQUIREMENTS.md) - Przeprogramowani certification criteria
- [Project Plan](PROJECT_PLAN.md) - Roadmap, iterations, and architecture overview
- [Product Requirements (PRD)](PRD.md) - Detailed feature specifications
- [Technical Specification](TECHNICAL_SPEC.md) - Implementation details, API design, database schema

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ LTS
- **Docker Desktop** (includes Docker Compose)
- **Git**

### 1. Clone and Setup

```bash
# Clone repository (once you create it)
git clone https://github.com/yourusername/chess-trainer.git
cd chess-trainer

# Initial setup (creates .env, starts PostgreSQL)
make setup
```

### 2. Configure Environment

Edit `.env` and add your OAuth credentials (optional for local development):

- **Lichess OAuth:** https://lichess.org/account/oauth/token/create
  - No app registration required - Lichess uses simplified OAuth
  - For local: `http://localhost:3000/api/auth/lichess/callback`
  - See [Deployment Guide](DEPLOYMENT_GUIDE.md#4-lichess-oauth-setup) for details

- **Google OAuth:** https://console.cloud.google.com/apis/credentials
  - Create OAuth client with redirect URI: `http://localhost:3000/api/auth/google/callback`
  - See [Deployment Guide](DEPLOYMENT_GUIDE.md#3-google-oauth-setup) for production setup

### 3. Install Dependencies

```bash
make install
# or manually:
# cd backend && npm install
# cd ../frontend && npm install
```

### 4. Run Database Migrations

```bash
cd backend
npm run migration:run
```

### 5. Import Sample Puzzles (Optional)

```bash
# Import ~1000 sample puzzles for development
cd backend
npm run import:sample-puzzles
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 7. Open Application

Visit: http://localhost:5173

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 + Vite
- **Admin Framework:** Refine
- **Chess UI:** react-chessboard + chess.js
- **Styling:** Tailwind CSS
- **State Management:** React Query (via Refine)

### Backend
- **Framework:** NestJS
- **Runtime:** Node.js 20 LTS
- **Database:** PostgreSQL 15
- **ORM:** TypeORM
- **Authentication:** Passport.js (OAuth2)

### Infrastructure
- **Local Development:** Docker Compose (PostgreSQL + pgAdmin)
- **CI/CD:** GitHub Actions
- **Deployment:** mikr.us
- **Testing:** Jest (unit + E2E)

---

## 📁 Project Structure

```
chess-trainer/
├── backend/              # NestJS backend API
│   ├── src/
│   │   ├── modules/
│   │   ├── entities/
│   │   ├── services/
│   │   └── main.ts
│   └── package.json
├── frontend/             # React + Refine frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── App.tsx
│   └── package.json
├── infra/                # CI/CD and infrastructure
│   ├── docker/
│   └── github/
├── docs/                 # Documentation
├── docker-compose.yml    # Local development services
├── Makefile              # Development commands
└── README.md             # This file
```

---

## 🧪 Testing

### Run Unit Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Run E2E Tests

```bash
cd backend
npm run test:e2e
```

---

## 🐳 Docker Commands

We provide a Makefile for convenience:

```bash
make up          # Start PostgreSQL
make up-tools    # Start PostgreSQL + pgAdmin
make down        # Stop containers
make logs        # View logs
make db-shell    # Open database shell
make db-reset    # Reset database
make help        # Show all commands
```

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker documentation.

---

## 🎯 MVP Features (Iteration 1)

- ✅ **Authentication**
  - Lichess OAuth login
  - Google OAuth fallback
  - Guest mode with localStorage progress tracking
    - Try the app without registration
    - Progress saved temporarily in browser
    - Warning banner prompts login for permanent storage
    - Data cleared when browser data is cleared

- ✅ **Puzzle Solving**
  - Interactive chess board
  - Puzzle of the Day
  - Random puzzle selection
  - Browse by theme (fork, pin, etc.)
  - Browse by opening (Sicilian, Ruy Lopez, etc.)

- ✅ **Progress Tracking**
  - Puzzle attempt history
  - Basic statistics (total solved, accuracy, streak)
  - Retry failed puzzles

- ✅ **CI/CD**
  - GitHub Actions pipeline
  - Automated testing
  - Auto-deployment to mikr.us

---

## 🗺️ Roadmap

### ✅ Iteration 1: MVP (Current)
- Authentication, puzzle solving, basic stats, CI/CD

### ⏳ Iteration 2: Enhanced Features
- Training sessions (100-puzzle sets)
- Lichess profile integration
- Recommended categories
- Advanced statistics

### ⏳ Iteration 3: AI-Powered Learning
- AI hints during solving
- Mistake explanations
- Guiding questions

### ⏳ Iteration 4: Polish
- UI/UX improvements
- Performance optimizations
- Bug fixes

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for detailed roadmap.

---

## 📊 Database

- **Main DB:** `chess_trainer_dev`
- **Test DB:** `chess_trainer_test`
- **Access:** localhost:5432
- **Credentials:** See `.env` file

### Database Management

**pgAdmin (Web UI):**
```bash
make up-tools
# Access at: http://localhost:5050
# Email: admin@chess-trainer.local
# Password: admin
```

**psql (CLI):**
```bash
make db-shell
```

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for more database commands.

---

## 🚢 Production Deployment

The application is deployed to **Mikr.us VPS** with shared PostgreSQL database and automated CI/CD.

### Quick Deployment Overview

**Infrastructure:**
- **Hosting:** Mikr.us VPS (Polish hosting provider)
- **Database:** PostgreSQL shared database (100MB limit per user)
- **Process Manager:** PM2 for Node.js application management
- **Web Server:** Nginx (optional, for SSL/reverse proxy)

**CI/CD Pipeline:**
- Automated testing on every PR
- Automatic deployment on merge to `main`
- Database migrations run automatically
- Health checks after deployment

**OAuth Configuration:**
- **Google OAuth:** Full setup required (client ID + secret)
- **Lichess OAuth:** Simplified setup (no app registration!)

### Deployment Steps

1. **Provision Mikr.us Server**
   - Sign up at https://mikr.us/
   - Get SSH access credentials

2. **Request PostgreSQL Database**
   - Visit https://mikr.us/panel/?a=postgres
   - Get database credentials (100MB limit)

3. **Configure OAuth Providers**
   - Google: Create OAuth app at https://console.cloud.google.com/apis/credentials
   - Lichess: Token at https://lichess.org/account/oauth/token/create (no app registration!)

4. **Set Up GitHub Secrets**
   - `MIKR_US_HOST` - Server IP/hostname
   - `MIKR_US_USER` - SSH username
   - `MIKR_US_SSH_KEY` - Private SSH key
   - `APP_URL` - Production URL

5. **Deploy**
   - Push to `main` branch
   - GitHub Actions handles the rest!

For complete step-by-step instructions, see the [Deployment Guide](DEPLOYMENT_GUIDE.md).

### Monitoring & Troubleshooting

```bash
# SSH into server
ssh <username>@<server>

# Check application status
pm2 status

# View logs
pm2 logs chess-trainer-api

# Restart application
pm2 restart chess-trainer-api

# Check database connection
psql "postgresql://<user>:<pass>@<server>:5432/<db>"
```

See [Deployment Guide - Troubleshooting](DEPLOYMENT_GUIDE.md#8-troubleshooting) for common issues and solutions.

---

## 🤝 Contributing

This is a certification project for the Przeprogramowani course.

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: your feature"`
3. Push and create PR: `git push origin feature/your-feature`
4. CI will run tests automatically
5. Merge to `main` after review

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Build/tooling changes

---

## 📝 License

This project is created for educational purposes as part of the Przeprogramowani certification program.

---

## 🙏 Acknowledgments

- **Lichess** - For providing the excellent puzzle database
- **Przeprogramowani** - For the amazing course and certification program
- **Chess.js & react-chessboard** - For the chess libraries

---

## 📧 Contact

**Author:** Mateusz Byczkowski

**Project:** Przeprogramowani Certification Project (2026)

---

---

## 🆘 Support & Resources

### Documentation
- [Mikr.us Wiki](https://wiki.mikr.us/) - Hosting platform documentation
- [Mikr.us Shared Databases](https://wiki.mikr.us/wspoldzielone_bazy_danych/) - PostgreSQL setup
- [NestJS Documentation](https://docs.nestjs.com/) - Backend framework
- [Refine Documentation](https://refine.dev/docs/) - Frontend framework
- [Lichess API](https://lichess.org/api) - Chess platform API
- [Google OAuth Guide](https://developers.google.com/identity/protocols/oauth2)

### Chess Resources
- [Lichess Puzzle Database](https://database.lichess.org/#puzzles) - Source of puzzle data
- [chess.js](https://github.com/jhlywa/chess.js) - Chess logic library
- [react-chessboard](https://www.npmjs.com/package/react-chessboard) - Interactive board

### Tools
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/) - Process manager
- [TypeORM](https://typeorm.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Last Updated:** 2026-01-27
