# ♟️ Chess Trainer

A chess puzzle training platform built with the Lichess puzzle database. Practice tactics, track your progress, and improve your chess skills.

**Status:** 🚧 In Development - Iteration 1 (MVP)

---

## 📋 Project Documentation

- [Certification Requirements](CERTIFICATION_REQUIREMENTS.md) - Przeprogramowani certification criteria
- [Project Plan](PROJECT_PLAN.md) - Roadmap, iterations, and architecture overview
- [Product Requirements (PRD)](PRD.md) - Detailed feature specifications
- [Technical Specification](TECHNICAL_SPEC.md) - Implementation details, API design, database schema
- [Docker Setup Guide](DOCKER_SETUP.md) - Local development environment setup

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

Edit `.env` and add your OAuth credentials:

- **Lichess OAuth:** https://lichess.org/account/oauth/app
  - Create app with redirect URI: `http://localhost:3000/api/auth/lichess/callback`

- **Google OAuth:** https://console.cloud.google.com/apis/credentials
  - Create OAuth client with redirect URI: `http://localhost:3000/api/auth/google/callback`

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

**Last Updated:** 2026-01-26
