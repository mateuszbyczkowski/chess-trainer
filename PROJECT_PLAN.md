# Chess Trainer - Project Plan & Roadmap

## 📋 Project Overview

**Name:** Chess Trainer - Lichess Puzzle Training Platform
**Goal:** Create an application for solving chess puzzles and tracking progress using the Lichess puzzle database
**Target:** Certification project for Przeprogramowani course

---

## 🎯 Project Iterations

### Iteration 1: MVP (Minimum Viable Product)
**Goal:** Meet all mandatory certification requirements

**Features:**
- ✅ User authentication (Lichess OAuth + Guest mode)
- ✅ Puzzle solving interface with chess board
- ✅ Puzzle categories (by theme, by opening)
- ✅ Basic statistics tracking
- ✅ Puzzle history view with retry capability
- ✅ Puzzle of the Day
- ✅ CI/CD pipeline (build + test on PR, auto-deploy)
- ✅ E2E test (login → solve puzzle → check progress)

**Deliverables:**
- Working application
- User can log in via Lichess or continue as guest
- User can solve puzzles from different categories
- User can view their statistics and history
- All mandatory certification requirements met

---

### Iteration 2: Enhanced Features
**Goal:** Add intelligent recommendations and training sessions

**Features:**
- 📊 Recommended categories based on worst performance
- 🎯 Training sessions (100 puzzles with selected themes)
- 👤 Lichess profile integration (fetch rating, propose difficulty)
- 📈 Advanced statistics (performance by theme/difficulty, streak tracking)
- ⏱️ Time tracking per puzzle
- ⏭️ Skip puzzle functionality
- 📉 Pain points analysis (worst performing themes)

**Deliverables:**
- Personalized puzzle recommendations
- Training session system with progress tracking
- Deep integration with Lichess profile data
- Comprehensive statistics dashboard

---

### Iteration 3: AI-Powered Learning (Optional)
**Goal:** Add AI hints and explanations (for distinction)

**Features:**
- 🤖 Optional AI toggle in settings
- 💡 AI hints during puzzle solving
- ❓ AI asking guiding questions
- 📝 AI explaining mistakes after completion
- 🔍 AI explaining why alternative moves don't work
- 🎓 Personalized learning insights

**Technology Decision Required:**
- OpenAI GPT-4 OR Anthropic Claude
- Will be decided before iteration 3

**Deliverables:**
- AI-powered learning assistant
- Enhanced user experience for learning from mistakes

---

### Iteration 4: Polish & Optimization
**Goal:** Production-ready application

**Features:**
- 🎨 UI/UX improvements and polish
- ⚡ Performance optimizations (database indexing, caching)
- 🔒 Security hardening
- 📱 Responsive design improvements
- 🐛 Bug fixes based on usage feedback
- 📚 Comprehensive documentation

---

## 🏗️ Technical Architecture

### Directory Structure
```
chess-trainer/
├── frontend/           # React + Refine frontend
├── backend/            # Node.js + NestJS backend
├── infra/              # CI/CD, deployment scripts, infrastructure
├── docs/               # Project documentation (PRD, specs)
├── CERTIFICATION_REQUIREMENTS.md
└── PROJECT_PLAN.md (this file)
```

### Technology Stack

#### Frontend
- **Framework:** React 18+
- **Admin Framework:** Refine
- **Chess Board:** react-chessboard
- **Chess Logic:** chess.js
- **Styling:** TBD (Ant Design with Refine / Tailwind CSS)
- **State Management:** React Query (via Refine)
- **HTTP Client:** Axios (via Refine)

#### Backend
- **Framework:** NestJS
- **Runtime:** Node.js 20+ LTS
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM (NestJS default) or Prisma
- **Authentication:** Passport.js (OAuth strategies)
- **API:** RESTful API
- **Validation:** class-validator, class-transformer

#### Infrastructure
- **CI/CD:** GitHub Actions
- **Hosting:** mikr.us
- **Database Hosting:** mikr.us or separate PostgreSQL instance
- **File Storage:** Local filesystem or S3-compatible for puzzle data

#### Development Tools
- **Package Manager:** pnpm or npm
- **Linting:** ESLint
- **Formatting:** Prettier
- **Testing:** Jest (unit + E2E)
- **Version Control:** Git + GitHub

---

## 📊 Data Models

### Core Entities

#### User
```typescript
{
  id: uuid
  lichessId: string | null
  lichessUsername: string | null
  googleId: string | null
  email: string | null
  displayName: string
  avatarUrl: string | null
  lichessRating: number | null
  isGuest: boolean
  aiEnabled: boolean (default: false)
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Puzzle
```typescript
{
  id: uuid
  lichessPuzzleId: string (unique)
  fen: string                    // Starting position
  moves: string                  // Solution moves in UCI format
  rating: number
  ratingDeviation: number
  popularity: number
  nbPlays: number
  themes: string[]               // Array of theme tags
  gameUrl: string | null
  openingTags: string[] | null
  createdAt: timestamp
}
```

#### PuzzleAttempt
```typescript
{
  id: uuid
  userId: uuid (FK → User)
  puzzleId: uuid (FK → Puzzle)
  sessionId: uuid | null (FK → TrainingSession)
  solved: boolean
  moves: string[]                // User's moves
  timeSpentSeconds: number
  hintsUsed: number (default: 0)
  attemptNumber: number          // For retries
  attemptedAt: timestamp
}
```

#### TrainingSession
```typescript
{
  id: uuid
  userId: uuid (FK → User)
  name: string
  themes: string[]               // Selected themes
  targetCount: number (default: 100)
  completedCount: number
  accuracy: number
  startedAt: timestamp
  completedAt: timestamp | null
  isActive: boolean
}
```

#### DailyPuzzle
```typescript
{
  id: uuid
  puzzleId: uuid (FK → Puzzle)
  date: date (unique)
  createdAt: timestamp
}
```

---

## 🔌 API Design (Backend)

### Authentication Endpoints
```
POST   /auth/lichess              # Initiate Lichess OAuth
GET    /auth/lichess/callback     # OAuth callback
POST   /auth/google               # Initiate Google OAuth (fallback)
GET    /auth/google/callback      # OAuth callback
POST   /auth/guest                # Create guest session
GET    /auth/me                   # Get current user
POST   /auth/logout               # Logout
```

### Puzzle Endpoints
```
GET    /puzzles/daily             # Get puzzle of the day
GET    /puzzles/random            # Get random puzzle (with filters)
GET    /puzzles/:id               # Get specific puzzle
GET    /puzzles/categories/themes # List all themes
GET    /puzzles/categories/openings # List all openings
GET    /puzzles/by-theme/:theme   # Get puzzles by theme
GET    /puzzles/by-opening/:opening # Get puzzles by opening
```

### User Progress Endpoints
```
POST   /attempts                  # Submit puzzle attempt
GET    /attempts/history          # Get user's attempt history
GET    /attempts/:puzzleId        # Get attempts for specific puzzle
GET    /stats/overview            # Overall statistics
GET    /stats/by-theme            # Performance by theme
GET    /stats/recommended         # Recommended categories (worst performance)
```

### Training Session Endpoints
```
POST   /sessions                  # Create training session
GET    /sessions                  # List user's sessions
GET    /sessions/:id              # Get session details
GET    /sessions/:id/puzzles      # Get puzzles for session
PATCH  /sessions/:id              # Update session progress
```

### Lichess Integration Endpoints
```
GET    /lichess/profile/:username # Fetch Lichess profile
POST   /lichess/sync-rating       # Sync user's Lichess rating
```

### AI Endpoints (Iteration 3)
```
POST   /ai/hint                   # Get hint for current position
POST   /ai/explain                # Get explanation for moves
POST   /ai/question               # Get guiding question
```

---

## 🎨 Frontend Pages/Routes

### Public Routes
- `/` - Landing page with Puzzle of the Day
- `/login` - Login page (Lichess/Google/Guest)

### Authenticated Routes
- `/dashboard` - Main dashboard with stats overview
- `/puzzles/categories` - Browse by theme/opening
- `/puzzles/solve/:id` - Puzzle solving interface
- `/puzzles/daily` - Daily puzzle
- `/training/new` - Create new training session
- `/training/:id` - Active training session
- `/history` - Puzzle attempt history
- `/stats` - Detailed statistics
- `/profile` - User profile settings

---

## 🧪 Testing Strategy

### E2E Test (Mandatory for Certification)
**Test Scenario:** Complete user flow
```
1. User logs in via Lichess OAuth
2. System fetches user's Lichess rating
3. User navigates to "Puzzles by Theme"
4. User selects a category (e.g., "Endgame")
5. User solves a puzzle (correct moves)
6. System records the attempt
7. User views their statistics
8. Verify: Attempt is recorded, stats are updated
```

**Tool:** Jest + Supertest (API) + Puppeteer/Playwright (browser)

### Unit Tests
- Backend: NestJS services, controllers
- Frontend: React components, hooks
- Coverage target: >70%

### Integration Tests
- Database operations
- OAuth flow
- API endpoints

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

#### On Pull Request
```yaml
- Checkout code
- Install dependencies (frontend + backend)
- Lint code (ESLint)
- Run unit tests
- Run integration tests
- Build frontend
- Build backend
- Report status
```

#### On Merge to Main
```yaml
- Run all PR checks
- Run E2E tests
- Build Docker images (optional) OR build artifacts
- Deploy backend to mikr.us
- Deploy frontend to mikr.us
- Run smoke tests
- Notify on success/failure
```

### Deployment Strategy
- **Backend:** Deploy to mikr.us via SSH/rsync or Docker
- **Frontend:** Build static files, deploy to mikr.us
- **Database:** Migrations run automatically on deployment
- **Environment Variables:** Stored in GitHub Secrets

---

## 📦 Data Import Strategy

### Lichess Puzzle Database

**Source:** `lichess_db_puzzle.csv.zst`
**Format:** Compressed CSV (Zstandard compression)

**Approach:**
1. **Download** the dataset from Lichess database
2. **Decompress** using zstd library (Node.js: `node-zstd` or CLI tool)
3. **Parse** CSV using streaming parser (e.g., `csv-parser`)
4. **Import** into PostgreSQL in batches
   - Batch size: 1000-5000 rows per transaction
   - Use bulk insert for performance
5. **Index** critical columns (rating, themes, openingTags)

**Columns to Import:**
- PuzzleId → lichessPuzzleId
- FEN → fen
- Moves → moves
- Rating → rating
- RatingDeviation → ratingDeviation
- Popularity → popularity
- NbPlays → nbPlays
- Themes → themes (parse as array)
- GameUrl → gameUrl
- OpeningTags → openingTags (parse as array)

**Script Location:** `backend/src/scripts/import-puzzles.ts`

**Estimated Database Size:**
- ~3-4 million puzzles
- Storage: 2-5 GB (depending on indexes)

---

## 🔐 Security Considerations

### Authentication & Authorization
- Use JWT tokens for session management
- Refresh token rotation
- Secure cookie settings (httpOnly, secure, sameSite)
- CORS configuration for frontend domain

### Data Protection
- Environment variables for secrets
- Password hashing (if adding email/password auth later)
- Rate limiting on API endpoints
- Input validation on all endpoints

### OAuth Security
- Verify OAuth state parameter
- Use PKCE for public clients if applicable
- Store OAuth tokens encrypted

---

## 📈 Success Metrics

### For Certification
- ✅ All mandatory requirements implemented
- ✅ E2E test passing
- ✅ CI/CD pipeline functional
- ✅ Application deployed and accessible

### For Distinction
- ✅ Submitted in first deadline (16.11.2025)
- ✅ All optional requirements met (public URL)
- ✅ High-quality PRD and technical documentation
- ✅ AI integration implemented (Iteration 3)

### User Experience Metrics
- Puzzle solving time
- User retention (return visits)
- Puzzles solved per session
- Training session completion rate

---

## 🗓️ Timeline Suggestion

### Phase 1: Foundation (Weeks 1-2)
- Set up project structure (frontend, backend, infra)
- Configure PostgreSQL database
- Implement basic authentication (Lichess OAuth + Guest)
- Import Lichess puzzle dataset
- Set up CI/CD pipeline

### Phase 2: Core Features (Weeks 3-4)
- Build puzzle solving interface
- Implement puzzle categories
- Create statistics tracking
- Develop history view
- Write E2E test

### Phase 3: Enhancement (Weeks 5-6)
- Add training sessions
- Lichess profile integration
- Recommended categories
- Advanced statistics
- Polish UI/UX

### Phase 4: AI Integration (Weeks 7-8)
- Design AI prompts
- Implement hint system
- Add explanation features
- Test AI quality

### Phase 5: Final Polish (Week 9)
- Bug fixes
- Performance optimization
- Documentation
- Final testing
- Submit for certification

---

## 📚 Next Steps

1. **Create PRD (Product Requirements Document)** - Detailed feature specifications
2. **Create Technical Specification** - Detailed implementation guide
3. **Set up project structure** - Initialize repositories
4. **Begin Iteration 1** - Start with MVP features

---

## 🎯 Certification Alignment

| Requirement | Implementation |
|-------------|----------------|
| **Access Control** | Lichess OAuth + Google OAuth + Guest mode |
| **CRUD Operations** | Create/Read/Update puzzle attempts, training sessions, user stats |
| **Business Logic** | Puzzle selection algorithms, progress tracking, recommendations |
| **PRD & Context Docs** | This plan + PRD + Technical Spec |
| **Testing** | E2E test: login → solve → verify progress |
| **CI/CD Pipeline** | GitHub Actions: build + test on PR, deploy on merge |
| **Public URL** | Deployed on mikr.us (optional for distinction) |

---

**Status:** Planning Phase ✅
**Next:** Create detailed PRD and Technical Specification
