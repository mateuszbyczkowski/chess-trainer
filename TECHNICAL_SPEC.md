# Technical Specification
## Chess Trainer - Lichess Puzzle Training Platform

---

## 📄 Document Information

| Field | Value |
|-------|-------|
| **Product Name** | Chess Trainer |
| **Version** | 1.0 Technical Spec |
| **Date** | 2026-01-26 |
| **Author** | Mateusz Byczkowski |
| **Status** | Planning |

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         React + Refine Frontend (SPA)                  │ │
│  │  - Chess Board UI (react-chessboard)                   │ │
│  │  - State Management (React Query)                      │ │
│  │  - Routing (React Router)                              │ │
│  └─────────────┬──────────────────────────────────────────┘ │
└────────────────┼────────────────────────────────────────────┘
                 │ HTTPS/REST
                 │
┌────────────────▼────────────────────────────────────────────┐
│              NestJS Backend API Server                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controllers (REST endpoints)                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Services (Business Logic)                             │ │
│  │  - PuzzleService                                       │ │
│  │  - UserService                                         │ │
│  │  - AttemptService                                      │ │
│  │  - TrainingSessionService                              │ │
│  │  - StatsService                                        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Repositories (Data Access - TypeORM/Prisma)           │ │
│  └─────────────┬──────────────────────────────────────────┘ │
└────────────────┼────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│              PostgreSQL Database                            │
│  - Users                                                    │
│  - Puzzles (3-4 million rows)                               │
│  - PuzzleAttempts                                           │
│  - TrainingSessions                                         │
│  - DailyPuzzles                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              External Services                              │
│  - Lichess OAuth API                                        │
│  - Google OAuth API                                         │
│  - (Future) OpenAI/Claude API for AI features               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐         ┌──────────────────────┐
│      User        │         │      Puzzle          │
├──────────────────┤         ├──────────────────────┤
│ id (PK)          │         │ id (PK)              │
│ lichessId        │         │ lichessPuzzleId      │
│ lichessUsername  │         │ fen                  │
│ googleId         │         │ moves                │
│ email            │         │ rating               │
│ displayName      │         │ ratingDeviation      │
│ avatarUrl        │         │ popularity           │
│ lichessRating    │         │ nbPlays              │
│ isGuest          │         │ themes (array)       │
│ aiEnabled        │         │ gameUrl              │
│ createdAt        │         │ openingTags (array)  │
│ updatedAt        │         │ createdAt            │
└────────┬─────────┘         └──────────┬───────────┘
         │                              │
         │                              │
         │         ┌────────────────────┴───────────┐
         │         │                                │
         │    ┌────▼────────────┐         ┌────────▼─────────┐
         │    │ PuzzleAttempt   │         │  DailyPuzzle     │
         │    ├─────────────────┤         ├──────────────────┤
         │    │ id (PK)         │         │ id (PK)          │
         └───►│ userId (FK)     │         │ puzzleId (FK)    │
              │ puzzleId (FK)   │         │ date (unique)    │
              │ sessionId (FK)  │         │ createdAt        │
              │ solved          │         └──────────────────┘
              │ moves (array)   │
              │ timeSpentSec    │
              │ hintsUsed       │
              │ attemptNumber   │
              │ attemptedAt     │
              └────────┬────────┘
                       │
         ┌─────────────┘
         │
┌────────▼──────────────┐
│  TrainingSession      │
├───────────────────────┤
│ id (PK)               │
│ userId (FK)           │
│ name                  │
│ themes (array)        │
│ targetCount           │
│ completedCount        │
│ accuracy              │
│ startedAt             │
│ completedAt           │
│ isActive              │
└───────────────────────┘
```

### Detailed Schema Definitions

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lichess_id VARCHAR(50) UNIQUE,
  lichess_username VARCHAR(50),
  google_id VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  lichess_rating INTEGER,
  lichess_rating_synced_at TIMESTAMP,
  is_guest BOOLEAN DEFAULT FALSE,
  ai_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_lichess_id ON users(lichess_id);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
```

#### Puzzles Table
```sql
CREATE TABLE puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lichess_puzzle_id VARCHAR(20) UNIQUE NOT NULL,
  fen TEXT NOT NULL,
  moves TEXT NOT NULL,
  rating INTEGER NOT NULL,
  rating_deviation INTEGER,
  popularity INTEGER DEFAULT 0,
  nb_plays INTEGER DEFAULT 0,
  themes TEXT[] NOT NULL DEFAULT '{}',
  game_url TEXT,
  opening_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_puzzles_lichess_id ON puzzles(lichess_puzzle_id);
CREATE INDEX idx_puzzles_rating ON puzzles(rating);
CREATE INDEX idx_puzzles_themes ON puzzles USING GIN(themes);
CREATE INDEX idx_puzzles_opening_tags ON puzzles USING GIN(opening_tags);
CREATE INDEX idx_puzzles_popularity ON puzzles(popularity DESC);
```

#### Puzzle Attempts Table
```sql
CREATE TABLE puzzle_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  solved BOOLEAN NOT NULL,
  moves TEXT[] NOT NULL DEFAULT '{}',
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attempts_user_id ON puzzle_attempts(user_id);
CREATE INDEX idx_attempts_puzzle_id ON puzzle_attempts(puzzle_id);
CREATE INDEX idx_attempts_session_id ON puzzle_attempts(session_id);
CREATE INDEX idx_attempts_attempted_at ON puzzle_attempts(attempted_at DESC);
CREATE INDEX idx_attempts_user_solved ON puzzle_attempts(user_id, solved);
```

#### Training Sessions Table
```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  themes TEXT[] NOT NULL DEFAULT '{}',
  target_count INTEGER DEFAULT 100,
  completed_count INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_user_id ON training_sessions(user_id);
CREATE INDEX idx_sessions_is_active ON training_sessions(is_active);
CREATE INDEX idx_sessions_started_at ON training_sessions(started_at DESC);
```

#### Session Puzzles Join Table
```sql
CREATE TABLE session_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, puzzle_id)
);

CREATE INDEX idx_session_puzzles_session_id ON session_puzzles(session_id);
CREATE INDEX idx_session_puzzles_order ON session_puzzles(session_id, order_index);
```

#### Daily Puzzles Table
```sql
CREATE TABLE daily_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  date DATE UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_puzzles_date ON daily_puzzles(date DESC);
```

---

## 🔌 API Specification

### Base URL
- **Development:** `http://localhost:3000/api`
- **Production:** `https://chess-trainer.yourdomain.com/api`

### Authentication
- **Type:** JWT Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Token Expiry:** 7 days
- **Refresh Token:** 30 days

---

### API Endpoints

#### Authentication Module

##### POST /auth/lichess
**Description:** Initiate Lichess OAuth flow
**Request:**
```json
{}
```
**Response:**
```json
{
  "authUrl": "https://lichess.org/oauth?client_id=...",
  "state": "random_state_token"
}
```

##### GET /auth/lichess/callback
**Description:** Handle Lichess OAuth callback
**Query Params:**
- `code`: string (required)
- `state`: string (required)

**Response:**
```json
{
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "uuid",
    "lichessUsername": "player123",
    "lichessRating": 1850,
    "displayName": "Player 123",
    "avatarUrl": "https://..."
  }
}
```

##### POST /auth/guest
**Description:** Create guest session
**Request:**
```json
{
  "displayName": "Guest_12345" // optional
}
```
**Response:**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "temp_uuid",
    "displayName": "Guest_12345",
    "isGuest": true
  }
}
```

**Guest Mode Implementation:**
- Guest user created in-memory only (not persisted to database)
- Puzzle attempts saved to browser localStorage as `guestAttempts` array
- Warning banner displayed on puzzle pages
- Guest data structure in localStorage:
```json
{
  "guestAttempts": [
    {
      "puzzleId": "uuid",
      "solved": true,
      "timeSpent": 45,
      "movesMade": "e2e4 e7e5",
      "timestamp": "2026-01-26T12:00:00Z"
    }
  ]
}
```
- Progress lost when browser data is cleared
- User prompted to create account to save progress permanently

##### GET /auth/me
**Description:** Get current authenticated user
**Headers:** Authorization required
**Response:**
```json
{
  "id": "uuid",
  "lichessUsername": "player123",
  "displayName": "Player 123",
  "avatarUrl": "https://...",
  "lichessRating": 1850,
  "isGuest": false,
  "aiEnabled": false,
  "createdAt": "2026-01-20T12:00:00Z"
}
```

---

#### Puzzles Module

##### GET /puzzles/daily
**Description:** Get puzzle of the day
**Response:**
```json
{
  "id": "uuid",
  "lichessPuzzleId": "abcd1234",
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "rating": 1650,
  "themes": ["fork", "middlegame"],
  "openingTags": ["Sicilian Defense"],
  "date": "2026-01-26",
  "solvedByUser": false,
  "globalSolveCount": 245
}
```

##### GET /puzzles/random
**Description:** Get random puzzle
**Query Params:**
- `minRating`: number (optional)
- `maxRating`: number (optional)
- `themes`: string[] (optional, comma-separated)
- `openings`: string[] (optional, comma-separated)
- `excludeSolved`: boolean (default: true)

**Response:**
```json
{
  "id": "uuid",
  "lichessPuzzleId": "xyz789",
  "fen": "...",
  "rating": 1720,
  "themes": ["pin", "endgame"],
  "openingTags": null,
  "userAttempts": 0
}
```

##### GET /puzzles/:id
**Description:** Get specific puzzle by ID
**Response:**
```json
{
  "id": "uuid",
  "lichessPuzzleId": "xyz789",
  "fen": "...",
  "moves": "e2e4 e7e5 g1f3",
  "rating": 1720,
  "ratingDeviation": 75,
  "popularity": 95,
  "nbPlays": 12450,
  "themes": ["fork", "opening"],
  "gameUrl": "https://lichess.org/game123",
  "openingTags": ["Italian Game"],
  "userAttempts": [
    {
      "solved": false,
      "attemptedAt": "2026-01-25T14:30:00Z",
      "timeSpentSeconds": 125
    }
  ]
}
```

##### GET /puzzles/categories/themes
**Description:** List all puzzle themes with counts
**Response:**
```json
{
  "themes": [
    {
      "name": "fork",
      "count": 45230,
      "userAccuracy": 72.5, // only if authenticated
      "userAttempts": 15 // only if authenticated
    },
    {
      "name": "pin",
      "count": 38450,
      "userAccuracy": null,
      "userAttempts": 0
    }
  ]
}
```

##### GET /puzzles/by-theme/:theme
**Description:** Get puzzles filtered by theme
**Query Params:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `minRating`: number (optional)
- `maxRating`: number (optional)

**Response:**
```json
{
  "puzzles": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45230,
    "totalPages": 2262
  }
}
```

---

#### Attempts Module

##### POST /attempts
**Description:** Submit puzzle attempt
**Request:**
```json
{
  "puzzleId": "uuid",
  "sessionId": "uuid", // optional
  "solved": true,
  "moves": ["e2e4", "e7e5", "g1f3"],
  "timeSpentSeconds": 87,
  "hintsUsed": 0
}
```
**Response:**
```json
{
  "id": "uuid",
  "solved": true,
  "attemptNumber": 1,
  "attemptedAt": "2026-01-26T15:22:00Z",
  "stats": {
    "totalSolved": 125,
    "totalAttempts": 180,
    "accuracy": 69.4,
    "streak": 3
  }
}
```

##### GET /attempts/history
**Description:** Get user's attempt history
**Query Params:**
- `page`: number (default: 1)
- `limit`: number (default: 50)
- `solved`: boolean (optional)
- `theme`: string (optional)
- `startDate`: ISO date (optional)
- `endDate`: ISO date (optional)

**Response:**
```json
{
  "attempts": [
    {
      "id": "uuid",
      "puzzle": {
        "id": "uuid",
        "lichessPuzzleId": "abc123",
        "fen": "...",
        "rating": 1650,
        "themes": ["fork"]
      },
      "solved": true,
      "moves": ["e2e4"],
      "timeSpentSeconds": 45,
      "attemptNumber": 1,
      "attemptedAt": "2026-01-26T10:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 180,
    "totalPages": 4
  }
}
```

---

#### Stats Module

##### GET /stats/overview
**Description:** Get overall user statistics
**Response:**
```json
{
  "totalSolved": 125,
  "totalAttempts": 180,
  "accuracy": 69.4,
  "averageTimeSeconds": 92,
  "currentStreak": 5,
  "longestStreak": 12,
  "solvedToday": 8,
  "solvedThisWeek": 35,
  "solvedThisMonth": 125,
  "ratingDistribution": {
    "800-1200": 15,
    "1200-1600": 45,
    "1600-2000": 52,
    "2000+": 13
  }
}
```

##### GET /stats/by-theme
**Description:** Performance breakdown by theme
**Response:**
```json
{
  "themes": [
    {
      "name": "fork",
      "attempts": 25,
      "solved": 18,
      "accuracy": 72.0,
      "averageTimeSeconds": 68
    },
    {
      "name": "endgame",
      "attempts": 15,
      "solved": 7,
      "accuracy": 46.7,
      "averageTimeSeconds": 145
    }
  ]
}
```

##### GET /stats/recommended
**Description:** Get recommended themes (worst performance)
**Response:**
```json
{
  "recommendations": [
    {
      "theme": "endgame",
      "accuracy": 46.7,
      "attempts": 15,
      "averageAccuracy": 65.0, // global average
      "gap": -18.3
    }
  ]
}
```

---

#### Training Sessions Module

##### POST /sessions
**Description:** Create new training session
**Request:**
```json
{
  "name": "Endgame Focus",
  "themes": ["endgame", "rook_endgame"],
  "usePainPoints": false, // if true, auto-select worst 3 themes
  "targetCount": 100
}
```
**Response:**
```json
{
  "id": "uuid",
  "name": "Endgame Focus",
  "themes": ["endgame", "rook_endgame"],
  "targetCount": 100,
  "completedCount": 0,
  "accuracy": 0,
  "startedAt": "2026-01-26T16:00:00Z",
  "isActive": true,
  "puzzles": [...] // first 20 puzzles
}
```

##### GET /sessions/:id
**Description:** Get session details
**Response:**
```json
{
  "id": "uuid",
  "name": "Endgame Focus",
  "themes": ["endgame"],
  "targetCount": 100,
  "completedCount": 25,
  "accuracy": 68.0,
  "startedAt": "2026-01-26T16:00:00Z",
  "completedAt": null,
  "isActive": true
}
```

##### GET /sessions/:id/puzzles
**Description:** Get puzzles for session
**Query Params:**
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Response:**
```json
{
  "puzzles": [...],
  "pagination": {...}
}
```

##### PATCH /sessions/:id
**Description:** Update session progress
**Request:**
```json
{
  "completedCount": 26,
  "accuracy": 69.2
}
```

---

## 🔐 Authentication Flow

### Lichess OAuth Flow

```
┌──────┐                                ┌────────────┐                   ┌─────────┐
│Client│                                │Backend API │                   │ Lichess │
└───┬──┘                                └─────┬──────┘                   └────┬────┘
    │                                         │                               │
    │ 1. Click "Login with Lichess"           │                               │
    ├────────────────────────────────────────►│                               │
    │                                         │                               │
    │ 2. GET /auth/lichess                    │                               │
    │◄────────────────────────────────────────┤                               │
    │    Returns: authUrl + state             │                               │
    │                                         │                               │
    │ 3. Redirect to Lichess OAuth            │                               │
    ├─────────────────────────────────────────┼──────────────────────────────►│
    │                                         │                               │
    │ 4. User authorizes app                  │                               │
    │                                         │                               │
    │ 5. Lichess redirects to callback        │                               │
    │    with code + state                    │                               │
    │◄────────────────────────────────────────┼───────────────────────────────┤
    │                                         │                               │
    │ 6. GET /auth/lichess/callback?code=...  │                               │
    ├────────────────────────────────────────►│                               │
    │                                         │                               │
    │                                         │ 7. Exchange code for token    │
    │                                         ├──────────────────────────────►│
    │                                         │                               │
    │                                         │ 8. Get user profile           │
    │                                         ├──────────────────────────────►│
    │                                         │◄──────────────────────────────┤
    │                                         │                               │
    │                                         │ 9. Create/Update user in DB   │
    │                                         │                               │
    │ 10. Return JWT + user data              │                               │
    │◄────────────────────────────────────────┤                               │
    │                                         │                               │
    │ 11. Store JWT, redirect to dashboard    │                               │
    │                                         │                               │
```

### JWT Token Structure

**Access Token (7 days):**
```json
{
  "sub": "user_uuid",
  "lichessId": "player123",
  "isGuest": false,
  "iat": 1706280000,
  "exp": 1706884800
}
```

**Refresh Token (30 days):**
```json
{
  "sub": "user_uuid",
  "type": "refresh",
  "iat": 1706280000,
  "exp": 1708872000
}
```

---

## 🎨 Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── OAuthCallback.tsx
│   │   └── GuestLogin.tsx
│   ├── chess/
│   │   ├── ChessBoard.tsx          # react-chessboard wrapper
│   │   ├── PuzzleSolver.tsx        # Main puzzle interface
│   │   ├── MoveHistory.tsx
│   │   ├── PuzzleInfo.tsx
│   │   └── PuzzleResult.tsx
│   ├── puzzles/
│   │   ├── PuzzleCard.tsx
│   │   ├── PuzzleList.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── ThemeSelector.tsx
│   │   └── DailyPuzzle.tsx
│   ├── stats/
│   │   ├── StatsOverview.tsx
│   │   ├── PerformanceChart.tsx
│   │   ├── ThemePerformance.tsx
│   │   └── StreakDisplay.tsx
│   ├── training/
│   │   ├── SessionCreator.tsx
│   │   ├── SessionProgress.tsx
│   │   ├── SessionList.tsx
│   │   └── SessionSummary.tsx
│   ├── history/
│   │   ├── AttemptHistory.tsx
│   │   ├── AttemptCard.tsx
│   │   └── AttemptFilters.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       ├── Footer.tsx
│       └── DashboardLayout.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── PuzzleSolve.tsx
│   ├── Categories.tsx
│   ├── History.tsx
│   ├── Stats.tsx
│   ├── TrainingSession.tsx
│   └── Profile.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── usePuzzle.ts
│   ├── useStats.ts
│   ├── useTrainingSession.ts
│   └── useChessBoard.ts
├── services/
│   ├── api.ts                      # Axios instance
│   ├── authService.ts
│   ├── puzzleService.ts
│   └── statsService.ts
├── types/
│   ├── puzzle.ts
│   ├── user.ts
│   ├── attempt.ts
│   └── session.ts
├── utils/
│   ├── chess.ts                    # Chess.js utilities
│   ├── date.ts
│   └── validation.ts
└── App.tsx
```

### State Management Strategy

**Using Refine + React Query:**
- **Server State:** React Query (via Refine)
  - Puzzle data
  - User stats
  - Attempt history
  - Training sessions
- **Local State:** React useState/useReducer
  - Current puzzle position
  - User's moves
  - Timer
  - UI state (modals, dropdowns)
- **Auth State:** Context API + localStorage
  - JWT token
  - Current user
  - Auth status

### Chess Board Integration

**Libraries:**
- `react-chessboard`: UI component
- `chess.js`: Game logic and validation

**Example Integration:**
```typescript
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

function PuzzleSolver({ puzzle }) {
  const [game, setGame] = useState(new Chess(puzzle.fen));
  const [position, setPosition] = useState(puzzle.fen);

  function onDrop(sourceSquare, targetSquare) {
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // always promote to queen for simplicity
    });

    if (move === null) return false; // illegal move

    setPosition(game.fen());
    checkSolution(move);
    return true;
  }

  return (
    <Chessboard
      position={position}
      onPieceDrop={onDrop}
      boardWidth={500}
    />
  );
}
```

---

## 🧪 Testing Strategy

### Unit Tests

**Backend (Jest):**
```typescript
// Example: PuzzleService.spec.ts
describe('PuzzleService', () => {
  it('should return random puzzle within rating range', async () => {
    const puzzle = await puzzleService.getRandomPuzzle({
      minRating: 1400,
      maxRating: 1600
    });
    expect(puzzle.rating).toBeGreaterThanOrEqual(1400);
    expect(puzzle.rating).toBeLessThanOrEqual(1600);
  });

  it('should exclude solved puzzles for user', async () => {
    const userId = 'test-user-id';
    const puzzle = await puzzleService.getRandomPuzzle({
      userId,
      excludeSolved: true
    });
    const attempts = await attemptRepo.find({ userId, puzzleId: puzzle.id });
    expect(attempts.length).toBe(0);
  });
});
```

**Frontend (Jest + React Testing Library):**
```typescript
// Example: ChessBoard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PuzzleSolver } from './PuzzleSolver';

describe('PuzzleSolver', () => {
  it('renders chess board with initial position', () => {
    const puzzle = {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      rating: 1500
    };
    render(<PuzzleSolver puzzle={puzzle} />);
    expect(screen.getByTestId('chess-board')).toBeInTheDocument();
  });

  it('validates legal moves', () => {
    // Test legal move validation
  });
});
```

### E2E Test (Jest + Playwright)

**Test File:** `e2e/user-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete User Flow', () => {
  test('user can login, solve puzzle, view stats', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('http://localhost:3000');

    // 2. Click login (we'll mock OAuth for testing)
    await page.click('text=Login with Lichess');

    // 3. Mock OAuth callback (in test env, skip actual OAuth)
    await page.goto('http://localhost:3000/auth/callback?mock=true');

    // 4. Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // 5. Click "Random Puzzle"
    await page.click('text=Random Puzzle');

    // 6. Wait for puzzle to load
    await page.waitForSelector('[data-testid="chess-board"]');

    // 7. Make moves (simulate solving puzzle)
    // This is complex - might need to interact with actual board
    await page.click('[data-square="e2"]');
    await page.click('[data-square="e4"]');

    // 8. Verify puzzle solved
    await expect(page.locator('text=Puzzle Solved!')).toBeVisible();

    // 9. Navigate to history
    await page.click('text=History');

    // 10. Verify attempt recorded
    await expect(page.locator('text=Puzzle #')).toBeVisible();

    // 11. Navigate to stats
    await page.click('text=Statistics');

    // 12. Verify stats updated
    const totalSolved = await page.locator('[data-testid="total-solved"]').textContent();
    expect(parseInt(totalSolved)).toBeGreaterThan(0);
  });
});
```

---

## 🚀 Deployment Architecture

### Mikr.us Deployment Strategy

**Server Setup:**
```
mikr.us server
├── /var/www/chess-trainer/
│   ├── frontend/             # React build (static files)
│   │   └── dist/
│   ├── backend/              # NestJS application
│   │   ├── dist/
│   │   ├── node_modules/
│   │   └── .env
│   └── data/
│       └── puzzles.csv       # Lichess puzzle data
└── PostgreSQL database
```

**Backend Deployment:**
```bash
# Build
cd backend
npm run build

# Start with PM2 (process manager)
pm2 start dist/main.js --name chess-trainer-api
pm2 save
pm2 startup
```

**Frontend Deployment:**
```bash
# Build
cd frontend
npm run build

# Serve with nginx or serve static from NestJS
# Option 1: Nginx
# Configure nginx to serve /var/www/chess-trainer/frontend/dist

# Option 2: NestJS ServeStaticModule
# Add to NestJS app to serve frontend from same server
```

**Nginx Configuration:**
```nginx
server {
  listen 80;
  server_name chess-trainer.yourdomain.com;

  # Frontend
  location / {
    root /var/www/chess-trainer/frontend/dist;
    try_files $uri $uri/ /index.html;
  }

  # Backend API
  location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/chess_trainer
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=30d

# Lichess OAuth
LICHESS_CLIENT_ID=your_lichess_client_id
LICHESS_CLIENT_SECRET=your_lichess_client_secret
LICHESS_REDIRECT_URI=https://chess-trainer.yourdomain.com/api/auth/lichess/callback

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://chess-trainer.yourdomain.com/api/auth/google/callback

# Frontend URL (for CORS)
FRONTEND_URL=https://chess-trainer.yourdomain.com

# AI (Iteration 3)
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

**Frontend (.env):**
```env
VITE_API_URL=https://chess-trainer.yourdomain.com/api
VITE_APP_NAME=Chess Trainer
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/main.yml`

```yaml
name: CI/CD Pipeline

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: chess_trainer_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Backend Dependencies
        working-directory: ./backend
        run: npm ci

      - name: Install Frontend Dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Lint Backend
        working-directory: ./backend
        run: npm run lint

      - name: Lint Frontend
        working-directory: ./frontend
        run: npm run lint

      - name: Run Backend Tests
        working-directory: ./backend
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/chess_trainer_test

      - name: Run Frontend Tests
        working-directory: ./frontend
        run: npm test

      - name: Build Backend
        working-directory: ./backend
        run: npm run build

      - name: Build Frontend
        working-directory: ./frontend
        run: npm run build

      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/chess_trainer_test

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Build Backend
        working-directory: ./backend
        run: |
          npm ci
          npm run build

      - name: Build Frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run build

      - name: Deploy to mikr.us
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.MIKR_US_HOST }}
          username: ${{ secrets.MIKR_US_USER }}
          key: ${{ secrets.MIKR_US_SSH_KEY }}
          source: "backend/dist,frontend/dist"
          target: "/var/www/chess-trainer"

      - name: Run Database Migrations
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.MIKR_US_HOST }}
          username: ${{ secrets.MIKR_US_USER }}
          key: ${{ secrets.MIKR_US_SSH_KEY }}
          script: |
            cd /var/www/chess-trainer/backend
            npm run migration:run

      - name: Restart Backend
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.MIKR_US_HOST }}
          username: ${{ secrets.MIKR_US_USER }}
          key: ${{ secrets.MIKR_US_SSH_KEY }}
          script: |
            pm2 restart chess-trainer-api

      - name: Smoke Test
        run: |
          sleep 10
          curl -f https://chess-trainer.yourdomain.com/api/health || exit 1
```

---

## 🛡️ Security Considerations

### Input Validation
- **Backend:** Use `class-validator` on all DTOs
- **Frontend:** Validate before sending to API
- **SQL Injection:** Use ORM parameterized queries only
- **XSS:** Sanitize all user inputs, use React's built-in XSS protection

### Authentication Security
- Store JWT in httpOnly cookies (not localStorage)
- Implement CSRF protection
- Rate limit OAuth endpoints
- Validate OAuth state parameter

### API Security
- Rate limiting: 100 requests/minute per IP
- CORS: Whitelist frontend domain only
- Helmet.js for security headers
- Request size limits

### Database Security
- Use environment variables for credentials
- Principle of least privilege for DB user
- Regular backups
- Connection pooling limits

---

## ⚡ Performance Optimizations

### Database Optimizations
```sql
-- Indexes (already defined in schema)
-- Materialized view for theme statistics
CREATE MATERIALIZED VIEW theme_stats AS
SELECT
  UNNEST(themes) as theme,
  COUNT(*) as puzzle_count,
  AVG(rating) as avg_rating
FROM puzzles
GROUP BY theme;

-- Refresh periodically
REFRESH MATERIALIZED VIEW theme_stats;
```

### Backend Caching
```typescript
// Use Redis or in-memory cache for:
// - Daily puzzle (cache for 24 hours)
// - Theme list (cache for 1 hour)
// - User stats (cache for 5 minutes, invalidate on new attempt)

import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes default
      max: 100, // max items in cache
    }),
  ],
})
```

### Frontend Optimizations
- Code splitting by route
- Lazy load chess board component
- Pagination for history/stats
- Debounce search inputs
- Image optimization for avatars
- Service Worker for offline support (PWA)

---

## 📦 Data Import Script

### Puzzle Import Script

**File:** `backend/src/scripts/import-puzzles.ts`

```typescript
import * as fs from 'fs';
import * as zstd from 'node-zstd';
import * as csvParser from 'csv-parser';
import { DataSource } from 'typeorm';
import { Puzzle } from '../entities/Puzzle.entity';

async function importPuzzles() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Puzzle],
  });

  await dataSource.initialize();
  const puzzleRepo = dataSource.getRepository(Puzzle);

  // Decompress .zst file
  const inputFile = './data/lichess_db_puzzle.csv.zst';
  const outputFile = './data/lichess_db_puzzle.csv';

  console.log('Decompressing puzzle database...');
  await zstd.decompress(inputFile, outputFile);

  console.log('Importing puzzles...');
  let batch: Partial<Puzzle>[] = [];
  let count = 0;

  fs.createReadStream(outputFile)
    .pipe(csvParser())
    .on('data', (row) => {
      batch.push({
        lichessPuzzleId: row.PuzzleId,
        fen: row.FEN,
        moves: row.Moves,
        rating: parseInt(row.Rating),
        ratingDeviation: parseInt(row.RatingDeviation),
        popularity: parseInt(row.Popularity),
        nbPlays: parseInt(row.NbPlays),
        themes: row.Themes.split(' '),
        gameUrl: row.GameUrl,
        openingTags: row.OpeningTags ? row.OpeningTags.split(' ') : [],
      });

      // Insert in batches of 5000
      if (batch.length >= 5000) {
        puzzleRepo.insert(batch);
        count += batch.length;
        console.log(`Imported ${count} puzzles...`);
        batch = [];
      }
    })
    .on('end', async () => {
      if (batch.length > 0) {
        await puzzleRepo.insert(batch);
        count += batch.length;
      }
      console.log(`Import complete! Total: ${count} puzzles`);
      await dataSource.destroy();
    });
}

importPuzzles().catch(console.error);
```

**Run:** `npm run import:puzzles`

---

## 📝 Next Steps

1. ✅ **Planning Complete** - PRD, Project Plan, Technical Spec created
2. ⏳ **Set Up Project Structure** - Create directories, initialize repos
3. ⏳ **Database Setup** - Create PostgreSQL database, run initial migrations
4. ⏳ **Backend Scaffolding** - NestJS project, modules, entities
5. ⏳ **Frontend Scaffolding** - React + Refine setup
6. ⏳ **Import Puzzles** - Download and import Lichess database
7. ⏳ **Iteration 1 Development** - MVP features
8. ⏳ **Testing** - Unit, integration, E2E
9. ⏳ **CI/CD Setup** - GitHub Actions
10. ⏳ **Deployment** - Deploy to mikr.us
11. ⏳ **Certification Submission** - Submit for review

---

**Document Status:** ✅ Complete
**Ready for Implementation:** Yes
**Last Updated:** 2026-01-26
