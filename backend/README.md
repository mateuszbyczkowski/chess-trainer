# Chess Trainer Backend

NestJS backend API for the Chess Trainer application.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ LTS
- PostgreSQL (running via Docker Compose from root directory)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your OAuth credentials
```

### Database Setup

```bash
# Run migrations (creates tables)
npm run migration:run

# Import sample puzzles for development
npm run import:sample-puzzles
```

### Running the API

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api`
API Documentation (Swagger): `http://localhost:3000/api/docs`

## 📁 Project Structure

```
src/
├── modules/          # Feature modules
│   ├── auth/        # Authentication (OAuth, JWT)
│   ├── users/       # User management
│   ├── puzzles/     # Puzzle operations
│   ├── attempts/    # Puzzle attempt tracking
│   ├── stats/       # Statistics calculations
│   └── sessions/    # Training sessions
├── entities/        # TypeORM entities
├── config/          # Configuration files
├── common/          # Shared utilities
└── scripts/         # Data import scripts
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Lint code |
| `npm run migration:generate` | Generate new migration |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run import:sample-puzzles` | Import ~1000 sample puzzles |
| `npm run import:full-puzzles` | Import full Lichess puzzle database |

## 🗄️ Database Migrations

```bash
# Create a new migration
npm run migration:create src/migrations/YourMigrationName

# Generate migration from entity changes
npm run migration:generate src/migrations/YourMigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 🔐 Environment Variables

See `.env.example` for all required environment variables.

**Required for OAuth:**
- `LICHESS_CLIENT_ID` - Get from https://lichess.org/account/oauth/app
- `LICHESS_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` - Get from https://console.cloud.google.com/apis/credentials
- `GOOGLE_CLIENT_SECRET`

## 📚 API Endpoints

### Authentication
- `GET /api/auth/lichess` - Initiate Lichess OAuth
- `GET /api/auth/lichess/callback` - OAuth callback
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/guest` - Create guest session
- `GET /api/auth/me` - Get current user

### Puzzles
- `GET /api/puzzles/daily` - Get daily puzzle
- `GET /api/puzzles/random` - Get random puzzle
- `GET /api/puzzles/categories/themes` - List all themes
- `GET /api/puzzles/categories/openings` - List all openings
- `GET /api/puzzles/:id` - Get puzzle by ID

### Attempts
- `POST /api/attempts` - Submit puzzle attempt
- `GET /api/attempts/history` - Get attempt history

### Statistics
- `GET /api/stats/overview` - Get overall stats
- `GET /api/stats/by-theme` - Get performance by theme

### Training Sessions
- `POST /api/sessions` - Create training session
- `GET /api/sessions` - List user's sessions
- `GET /api/sessions/:id` - Get session details
- `PATCH /api/sessions/:id` - Update session

Full API documentation available at `/api/docs` in development mode.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

## 📦 Data Import

### Sample Puzzles (for development)
```bash
npm run import:sample-puzzles
```
Imports ~1000 puzzles for quick development setup.

### Full Database (for production)
```bash
# Download Lichess puzzle database
# https://database.lichess.org/#puzzles

# Place file in data/ directory
# Run import script
npm run import:full-puzzles
```
Imports 3-4 million puzzles (takes 10-30 minutes).

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose ps`
- Check `DATABASE_URL` in `.env`
- Test connection: `psql $DATABASE_URL`

### OAuth Not Working
- Verify callback URLs match in OAuth app settings
- Check `LICHESS_REDIRECT_URI` and `GOOGLE_REDIRECT_URI` in `.env`
- Ensure frontend URL is correct in `FRONTEND_URL`

### Migrations Failing
- Drop and recreate database: `make db-reset` (from root)
- Regenerate migrations: `npm run migration:generate`

## 📖 Development

### Adding a New Feature Module

```bash
# Generate module, service, and controller
nest g module modules/feature-name
nest g service modules/feature-name
nest g controller modules/feature-name
```

### Code Style

- Follow NestJS best practices
- Use TypeScript strict mode
- Write unit tests for services
- Document API endpoints with Swagger decorators

---

**Last Updated:** 2026-01-26
