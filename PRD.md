# Product Requirements Document (PRD)
## Chess Trainer - Lichess Puzzle Training Platform

---

## 📄 Document Information

| Field | Value |
|-------|-------|
| **Product Name** | Chess Trainer |
| **Version** | 1.0 (MVP) |
| **Date** | 2026-01-26 |
| **Author** | Mateusz Byczkowski |
| **Status** | Planning |
| **Target Deadline** | First: 16.11.2025, Second: 14.12.2025, Final: 01.02.2026 |

---

## 🎯 Executive Summary

### Vision
Create an engaging chess puzzle training platform that helps players improve their tactical skills through structured practice, personalized recommendations, and comprehensive progress tracking using the extensive Lichess puzzle database.

### Problem Statement
Chess players need a structured way to:
- Practice tactical puzzles consistently
- Track their improvement over time
- Focus on their weak areas
- Access a large, high-quality puzzle database
- Get personalized difficulty recommendations
- Learn from their mistakes

### Solution
A web application that:
- Provides access to millions of Lichess puzzles
- Offers personalized puzzle recommendations based on Lichess rating
- Tracks detailed progress and statistics
- Creates custom training sessions focused on specific themes
- Optionally provides AI-powered hints and explanations
- Integrates seamlessly with Lichess accounts

### Success Criteria
1. Users can solve puzzles and track their progress
2. All certification requirements met (authentication, CRUD, tests, CI/CD)
3. Application deployed and accessible via public URL
4. Positive user experience with intuitive interface
5. (Optional) AI integration enhances learning experience

---

## 👥 Target Users

### Primary User Persona: Intermediate Chess Player
**Name:** Alex the Improver
**Rating:** 1400-2000 Lichess
**Goals:**
- Improve tactical vision
- Practice consistently (daily)
- Identify and fix weaknesses
- Track measurable progress

**Pain Points:**
- Doesn't know which puzzle themes to focus on
- Lacks structured training approach
- Can't easily track improvement over time
- Gets stuck on puzzles without understanding why

**How We Help:**
- Personalized difficulty based on Lichess rating
- Recommended categories based on worst performance
- Detailed statistics and progress tracking
- (Future) AI explanations for mistakes

### Secondary User Persona: Casual Player
**Name:** Sam the Casual
**Rating:** 800-1400 Lichess or no rating
**Goals:**
- Have fun solving puzzles
- Learn chess casually
- Low commitment, play occasionally

**Pain Points:**
- Doesn't want to create an account
- Intimidated by competitive platforms
- Needs simpler interface

**How We Help:**
- Guest mode (no login required)
- Daily puzzle feature
- Simple, focused interface
- Progressive difficulty

---

## ✨ Feature Specifications

## Iteration 1: MVP Features

### F1: User Authentication

#### F1.1: Lichess OAuth Login
**Priority:** P0 (Must Have)
**User Story:** As a Lichess user, I want to log in with my Lichess account so that I can access personalized puzzles based on my rating.

**Acceptance Criteria:**
- [ ] "Login with Lichess" button on landing page
- [ ] OAuth flow redirects to Lichess authorization
- [ ] Successfully authenticates and creates/updates user in database
- [ ] Stores Lichess username, ID, and rating
- [ ] Redirects to dashboard after successful login
- [ ] Displays user's Lichess avatar and username in header
- [ ] Error handling for failed OAuth attempts

**Technical Notes:**
- Use Lichess OAuth API: https://lichess.org/api#tag/OAuth
- Store OAuth tokens securely
- Implement token refresh mechanism

---

#### F1.2: Google OAuth Login (Fallback)
**Priority:** P1 (Should Have)
**User Story:** As a user without a Lichess account, I want to log in with Google so that I can still use the application and save my progress.

**Acceptance Criteria:**
- [ ] "Login with Google" button on landing page
- [ ] OAuth flow redirects to Google authorization
- [ ] Successfully authenticates and creates user in database
- [ ] Stores Google ID, email, and display name
- [ ] Redirects to dashboard after successful login
- [ ] No Lichess rating available (uses default difficulty)

---

#### F1.3: Guest Mode
**Priority:** P0 (Must Have)
**User Story:** As a casual visitor, I want to solve puzzles without creating an account so that I can try the application immediately.

**Acceptance Criteria:**
- [x] "Continue as Guest" button on landing page
- [x] Creates temporary session (no database user)
- [x] Allows solving puzzles with default difficulty
- [x] Progress saved to localStorage (temporary, cleared on browser data clear)
- [x] Warning banner displayed explaining progress is not permanently saved
- [x] Prompts to log in to save progress permanently
- [x] Session persists until browser data is cleared

**Technical Notes:**
- Uses localStorage to store guest attempts as `guestAttempts`
- Guest users marked with `isGuest: true` flag in user object
- Guest users see rating range: 1200-1600
- Warning banner appears on puzzle pages with link to login
- All guest data is client-side only; no database storage

---

### F2: Puzzle Solving Interface

#### F2.1: Interactive Chess Board
**Priority:** P0 (Must Have)
**User Story:** As a user, I want to interact with a chess board to solve puzzles so that I can practice tactics.

**Acceptance Criteria:**
- [ ] Display chess board with initial position from puzzle FEN
- [ ] Show whose turn it is to move
- [ ] Allow legal move input (drag-and-drop or click-click)
- [ ] Validate moves against puzzle solution
- [ ] Provide immediate feedback (correct/incorrect)
- [ ] Automatically progress through solution on correct moves
- [ ] Display "Puzzle Solved!" message on completion
- [ ] Show puzzle rating and themes
- [ ] Track time spent on puzzle

**UI Elements:**
- Chess board (using react-chessboard)
- Puzzle info panel (rating, themes, attempts)
- Timer display
- Hint button (Iteration 2+)
- Skip button (Iteration 2)
- Give up button
- Next puzzle button

**Technical Notes:**
- Use `chess.js` for move validation
- Use `react-chessboard` for UI
- Parse FEN to set initial position
- Parse solution moves in UCI format
- Animate computer's response moves

---

#### F2.2: Puzzle Result Recording
**Priority:** P0 (Must Have)
**User Story:** As a user, I want my puzzle attempts to be saved so that I can track my progress.

**Acceptance Criteria:**
- [ ] Record attempt in database when puzzle is completed/failed
- [ ] Store: userId, puzzleId, solved status, moves, time spent
- [ ] Update user statistics in real-time
- [ ] Show success/failure message with stats
- [ ] Redirect to next puzzle or puzzle selection

**Data Recorded:**
- User ID
- Puzzle ID
- Solved (boolean)
- User's moves (array)
- Time spent (seconds)
- Hints used (if applicable)
- Timestamp

---

#### F2.3: Puzzle of the Day
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to solve a daily puzzle so that I have a consistent daily practice routine.

**Acceptance Criteria:**
- [ ] One puzzle selected each day (same for all users)
- [ ] Display on landing page / dashboard sidebar
- [ ] Show puzzle board in preview mode (non-interactive until clicked)
- [ ] Click to open full puzzle solving interface
- [ ] Show completion status (solved/not solved today)
- [ ] Show global stats (how many users solved it)

**Selection Algorithm:**
- Random puzzle from rating range 1400-1800
- Changes at midnight UTC
- Stored in `DailyPuzzle` table

---

### F3: Puzzle Categories & Discovery

#### F3.1: Browse Puzzles by Theme
**Priority:** P0 (Must Have)
**User Story:** As a user, I want to browse puzzles by tactical theme so that I can practice specific patterns.

**Acceptance Criteria:**
- [ ] Display grid/list of all available themes
- [ ] Show puzzle count for each theme
- [ ] Click theme to see puzzles in that category
- [ ] Filter puzzles by difficulty within theme
- [ ] Display theme name and description
- [ ] Show user's performance in that theme (% correct)

**Example Themes:**
- Fork
- Pin
- Skewer
- Discovered Attack
- Double Check
- Sacrifice
- Mate in 1/2/3
- Endgame
- Opening
- Middlegame

**Data Source:**
- Themes from Lichess puzzle database `Themes` column

---

#### F3.2: Browse Puzzles by Opening
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to practice puzzles from specific openings so that I can improve my opening knowledge.

**Acceptance Criteria:**
- [ ] Display grid/list of all available openings
- [ ] Show puzzle count for each opening
- [ ] Click opening to see puzzles in that category
- [ ] Display opening name (e.g., "Sicilian Defense", "Ruy Lopez")
- [ ] Show user's performance in that opening (% correct)

**Data Source:**
- Opening tags from Lichess puzzle database `OpeningTags` column

---

#### F3.3: Random Puzzle Selection
**Priority:** P0 (Must Have)
**User Story:** As a user, I want to solve a random puzzle so that I can practice without choosing a category.

**Acceptance Criteria:**
- [ ] "Random Puzzle" button on dashboard
- [ ] Selects puzzle based on user's rating (±200 rating range)
- [ ] Avoids recently solved puzzles (last 50)
- [ ] Redirects to puzzle solving interface
- [ ] Works for guest users (default rating range)

---

### F4: Progress Tracking & Statistics

#### F4.1: Puzzle History
**Priority:** P0 (Must Have)
**User Story:** As a user, I want to see my puzzle attempt history so that I can review what I've solved.

**Acceptance Criteria:**
- [ ] Display paginated list of all attempts
- [ ] Show: puzzle ID, theme, rating, result, date, time spent
- [ ] Sort by date (newest first)
- [ ] Filter by: solved/failed, theme, date range
- [ ] Click puzzle to view details and retry
- [ ] Show attempt number for retried puzzles
- [ ] Display board position as thumbnail

**Table Columns:**
- Puzzle preview (mini board)
- Puzzle ID
- Themes
- Rating
- Result (✓/✗)
- Time spent
- Date
- Actions (View, Retry)

---

#### F4.2: Basic Statistics Dashboard
**Priority:** P0 (Must Have)
**User Story:** As a user, I want to see my overall statistics so that I can track my improvement.

**Acceptance Criteria:**
- [ ] Total puzzles solved
- [ ] Overall accuracy (% correct)
- [ ] Average time per puzzle
- [ ] Current streak (consecutive days)
- [ ] Puzzles solved today/this week/this month
- [ ] Performance chart (accuracy over time)
- [ ] Rating distribution of solved puzzles

**UI Layout:**
- Summary cards (total solved, accuracy, streak)
- Line chart: accuracy over time
- Bar chart: puzzles solved per day (last 30 days)
- Theme performance table (top 5 best/worst)

---

#### F4.3: Retry Puzzles
**Priority:** P0 (Must Have)
**User Story:** As a user, I want to retry failed puzzles so that I can learn from my mistakes.

**Acceptance Criteria:**
- [ ] "Retry" button on puzzle history and puzzle result screen
- [ ] Opens puzzle in solving interface
- [ ] Increments attempt number
- [ ] Records new attempt separately in database
- [ ] Shows previous attempts at the end
- [ ] No limit on retry count

---

### F5: CI/CD & Testing

#### F5.1: E2E Test
**Priority:** P0 (Must Have - Certification Requirement)
**User Story:** As a developer, I want automated E2E tests so that I can verify the user flow works correctly.

**Test Scenario:**
```
1. User visits landing page
2. Clicks "Login with Lichess"
3. Completes OAuth flow (mocked in test environment)
4. Lands on dashboard
5. Clicks "Random Puzzle"
6. Puzzle board loads
7. Makes correct moves to solve puzzle
8. Puzzle is marked as solved
9. Navigates to "History"
10. Verify: Puzzle appears in history with solved status
11. Navigates to "Statistics"
12. Verify: Total solved count increased by 1
```

**Tools:**
- Jest
- Supertest (API testing)
- Playwright or Puppeteer (browser automation)

**Acceptance Criteria:**
- [ ] E2E test passes successfully
- [ ] Test runs in CI pipeline
- [ ] Test coverage for critical user flow

---

#### F5.2: CI/CD Pipeline
**Priority:** P0 (Must Have - Certification Requirement)
**User Story:** As a developer, I want automated builds and deployments so that I can ship features quickly and safely.

**Acceptance Criteria:**
- [ ] GitHub Actions workflow configured
- [ ] On Pull Request: lint, test, build
- [ ] On merge to main: lint, test, build, deploy
- [ ] Deploy backend to mikr.us
- [ ] Deploy frontend to mikr.us
- [ ] Run database migrations
- [ ] Notify on deployment success/failure
- [ ] Smoke test after deployment

**Pipeline Stages:**
1. Install dependencies
2. Lint (ESLint)
3. Unit tests (Jest)
4. Integration tests
5. Build frontend & backend
6. E2E tests
7. Deploy (on main branch only)
8. Smoke test

---

## Iteration 2: Enhanced Features

### F6: Intelligent Recommendations

#### F6.1: Recommended Categories (Worst Performance)
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to see which puzzle themes I struggle with so that I can focus my practice.

**Acceptance Criteria:**
- [ ] Calculate accuracy % for each theme user has attempted
- [ ] Display top 5 worst-performing themes on dashboard
- [ ] Show comparison to average user performance
- [ ] "Practice" button to start training session for that theme
- [ ] Minimum 10 attempts required per theme for recommendation
- [ ] Update recommendations weekly

**Algorithm:**
```
For each theme:
  - Calculate user accuracy = (solved / total_attempts)
  - If total_attempts >= 10:
    - Rank by accuracy (ascending)
  - Return bottom 5 themes
```

---

#### F6.2: Lichess Profile Integration
**Priority:** P1 (Should Have)
**User Story:** As a Lichess user, I want the app to fetch my current rating so that puzzles match my skill level.

**Acceptance Criteria:**
- [ ] Fetch Lichess profile on login
- [ ] Store: rating (blitz/rapid/bullet), username, avatar
- [ ] Use rating to filter puzzle difficulty (rating ±300)
- [ ] "Sync Rating" button on profile page
- [ ] Show last sync timestamp
- [ ] Auto-sync every 7 days

**API Endpoint:**
- GET https://lichess.org/api/user/{username}

---

### F7: Training Sessions

#### F7.1: Create Training Session
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to create a training session with specific themes so that I can practice focused sets of puzzles.

**Acceptance Criteria:**
- [ ] "New Training Session" page
- [ ] Select themes (checkboxes, multi-select)
- [ ] Option 1: Generate from selected themes
- [ ] Option 2: Generate from worst pain points (auto-select bottom 3 themes)
- [ ] Set target count (default: 100 puzzles)
- [ ] Name the session (optional)
- [ ] Create session and start immediately
- [ ] Generate 100 puzzles matching criteria

**Session Creation Algorithm:**
```
1. Query puzzles matching selected themes
2. Filter by user rating ±200
3. Exclude already solved puzzles (optional setting)
4. Randomly select 100 puzzles
5. Create TrainingSession record
6. Link puzzles to session
7. Redirect to session page
```

---

#### F7.2: Active Training Session
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to track my progress through a training session so that I can complete structured practice.

**Acceptance Criteria:**
- [ ] Display session progress (15/100 puzzles)
- [ ] Progress bar visualization
- [ ] Show session stats (accuracy, time, themes)
- [ ] "Next Puzzle" button advances through session
- [ ] Puzzles presented in random order
- [ ] Can pause and resume session later
- [ ] Mark session complete when all puzzles done
- [ ] Summary screen at completion

**UI Elements:**
- Progress indicator (15/100)
- Session name
- Session stats card
- Puzzle board
- Navigation (previous, next, pause)

---

#### F7.3: Training Session History
**Priority:** P2 (Nice to Have)
**User Story:** As a user, I want to see my past training sessions so that I can review my focused practice.

**Acceptance Criteria:**
- [ ] List all training sessions (active and completed)
- [ ] Show: name, themes, progress, accuracy, date
- [ ] Click to resume (if active) or review (if completed)
- [ ] Filter by status (active/completed)
- [ ] Delete session (marks as inactive)

---

### F8: Enhanced Statistics

#### F8.1: Performance by Theme
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to see my performance breakdown by theme so that I understand my strengths and weaknesses.

**Acceptance Criteria:**
- [ ] Table of all themes user has attempted
- [ ] Columns: theme, attempts, solved, accuracy %, avg time
- [ ] Sort by any column
- [ ] Visual indicators (color-coded by accuracy)
- [ ] Click theme to filter history

---

#### F8.2: Streak Tracking
**Priority:** P2 (Nice to Have)
**User Story:** As a user, I want to track my daily streak so that I stay motivated to practice consistently.

**Acceptance Criteria:**
- [ ] Calculate consecutive days with at least 1 puzzle solved
- [ ] Display current streak on dashboard
- [ ] Show longest streak ever
- [ ] Calendar heatmap (last 90 days)
- [ ] Visual reward for milestones (7, 30, 100 days)

---

#### F8.3: Time Tracking
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to see how long I spend on puzzles so that I can measure my calculation speed.

**Acceptance Criteria:**
- [ ] Timer starts when puzzle loads
- [ ] Pauses when user leaves page (optional)
- [ ] Stops when puzzle completed/given up
- [ ] Display time spent on result screen
- [ ] Show average time per puzzle in stats
- [ ] Filter history by time spent

---

### F9: User Experience Enhancements

#### F9.1: Skip Puzzle
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to skip a puzzle if I'm stuck so that I can move on without frustration.

**Acceptance Criteria:**
- [ ] "Skip" button on puzzle interface
- [ ] Shows confirmation dialog
- [ ] Records as "skipped" (not solved, not failed)
- [ ] Puzzle may appear again later
- [ ] Doesn't break streak
- [ ] Max 3 skips per training session

---

#### F9.2: Give Up / Show Solution
**Priority:** P1 (Should Have)
**User Story:** As a user, I want to see the solution if I'm completely stuck so that I can learn the correct moves.

**Acceptance Criteria:**
- [ ] "Give Up" button on puzzle interface
- [ ] Shows solution moves with annotations
- [ ] Records as "failed" attempt
- [ ] Displays explanation if available
- [ ] Option to retry immediately

---

## Iteration 3: AI-Powered Learning

### F10: AI Hint System

#### F10.1: AI Toggle Setting
**Priority:** P2 (Nice to Have)
**User Story:** As a user, I want to enable/disable AI hints so that I can control my learning experience.

**Acceptance Criteria:**
- [ ] "Enable AI Assistant" toggle in settings
- [ ] Persists preference to database
- [ ] Shows AI features only when enabled
- [ ] Displays remaining AI credits (if applicable)

---

#### F10.2: AI Hints During Solving
**Priority:** P2 (Nice to Have)
**User Story:** As a user, I want AI hints while solving so that I can get unstuck without seeing the full solution.

**Acceptance Criteria:**
- [ ] "Hint" button visible when AI enabled
- [ ] Progressive hints (3 levels):
  - Level 1: "Look for a tactical pattern on the kingside"
  - Level 2: "Consider a knight fork"
  - Level 3: "Nf5 attacks the queen and king"
- [ ] Each hint deducted from hint count
- [ ] Hints impact statistics (separate accuracy for no-hint solves)

**AI Prompt Template:**
```
You are a chess coach. The student is solving this puzzle:
- Position (FEN): {fen}
- Solution: {solution_moves}
- Themes: {themes}
- Student's moves so far: {user_moves}

Provide a subtle hint (level {level}) to guide them toward the solution without giving it away.
```

---

#### F10.3: AI Guiding Questions
**Priority:** P2 (Nice to Have)
**User Story:** As a user, I want AI to ask me questions so that I can develop my chess thinking process.

**Acceptance Criteria:**
- [ ] After incorrect move, AI asks: "What is your opponent threatening?"
- [ ] Encourages user to think about candidate moves
- [ ] Questions adapt to puzzle themes
- [ ] User can choose to skip questions

**Example Questions:**
- "What pieces are undefended in this position?"
- "Can you find a forcing move?"
- "What is the most active piece in your position?"

---

#### F10.4: AI Mistake Explanation
**Priority:** P2 (Nice to Have)
**User Story:** As a user, I want AI to explain my mistakes so that I understand what I did wrong.

**Acceptance Criteria:**
- [ ] After puzzle completion (solved or failed), show "Explain" button
- [ ] AI analyzes user's moves vs. solution
- [ ] Highlights mistakes and missed opportunities
- [ ] Explains why the correct move works
- [ ] Explains why alternative moves fail
- [ ] Saves explanation for future reference

**AI Prompt Template:**
```
You are a chess coach. Analyze the student's attempt at this puzzle:
- Position (FEN): {fen}
- Correct solution: {solution_moves}
- Student's moves: {user_moves}
- Result: {solved ? 'Solved' : 'Failed'}
- Themes: {themes}

Provide a clear, educational explanation:
1. What the student did correctly
2. Where they went wrong (if applicable)
3. Why the correct move works
4. What key tactical concepts apply
```

---

## 🚫 Out of Scope (Not in MVP)

### Features to Consider for Future Versions
- Multiplayer/social features (compete with friends)
- Leaderboards
- Puzzle creation by users
- Video lessons
- Puzzle rush mode (timed challenge)
- Mobile app (native iOS/Android)
- Spaced repetition algorithm
- Annotations and note-taking on puzzles
- Export progress to PDF
- Integration with Chess.com
- Voice-guided hints
- Dark mode (unless easy to implement with UI framework)

---

## 🎨 User Experience Principles

### Design Goals
1. **Simple & Focused:** Minimize distractions during puzzle solving
2. **Fast:** Instant feedback on moves, quick loading
3. **Clear Feedback:** Visual indicators for success/failure
4. **Progress Visibility:** Always show where user stands
5. **Mobile-Friendly:** Responsive design (but desktop-first)

### UI/UX Considerations
- Clean, minimal interface
- Chess board is the hero element on puzzle pages
- Consistent color scheme (chess.com/lichess-inspired)
- Accessibility: keyboard navigation, screen reader support
- Loading states and error messages
- Smooth animations for moves

---

## 🔒 Privacy & Data Policy

### User Data Collected
- Lichess/Google OAuth information (username, email, ID)
- Puzzle attempts and statistics
- Session data

### Data Usage
- Used only for application functionality
- No third-party sharing
- No advertising or tracking

### Data Retention
- User data kept indefinitely unless user requests deletion
- Guest progress stored in localStorage until browser data is cleared
- No guest data stored in backend database

### User Rights
- View their data
- Export their data (JSON format)
- Request account deletion

---

## 📊 Analytics & Monitoring (Future)

### Metrics to Track
- Daily active users (DAU)
- Puzzles solved per user per day
- Average session duration
- Training session completion rate
- Most popular themes
- API error rates
- Page load times

### Tools (Optional)
- Google Analytics or Plausible (privacy-focused)
- Sentry for error tracking
- PostgreSQL logs for performance monitoring

---

## 🚀 Go-to-Market Strategy

### Launch Plan
1. **Soft Launch:** Share with friends and course participants
2. **Beta Testing:** Gather feedback, fix bugs
3. **Public Launch:** Post on Reddit (r/chess, r/lichess), chess forums
4. **Demo Day:** Present on Przeprogramowani demo day (if selected)

### Marketing Channels
- Reddit communities
- Chess Discord servers
- Personal blog post
- LinkedIn post (for portfolio)

### Success Metrics
- 50+ registered users in first month
- 1000+ puzzles solved collectively
- Positive user feedback
- Certification achieved ✅

---

## ❓ Open Questions & Decisions Needed

### Technical Decisions
- [ ] **ORM Choice:** TypeORM vs Prisma? (Recommendation: Prisma for better DX)
- [ ] **Frontend Styling:** Ant Design (Refine default) vs Tailwind CSS?
- [ ] **AI Service:** OpenAI vs Anthropic Claude? (Decide in Iteration 3)
- [ ] **Deployment:** Docker vs direct Node.js on mikr.us?
- [ ] **Database Hosting:** Same server as app or separate instance?

### Product Decisions
- [x] **Guest Progress**: Guests have progress saved to localStorage with warning banner. This allows trial usage while incentivizing account creation for permanent storage.
- [ ] Should we limit free tier features for monetization later?
- [ ] Should we show global leaderboard or keep it private?
- [ ] Should we allow puzzle comments/discussions?

### Risk Mitigation
- [ ] What if Lichess API rate limits us?
- [ ] What if puzzle dataset is too large for free hosting?
- [ ] What if OAuth fails on production?
- [ ] What if AI costs exceed budget?

---

## 📝 Appendix

### Glossary
- **FEN:** Forsyth-Edwards Notation - standard notation for chess positions
- **UCI:** Universal Chess Interface - standard format for chess moves (e.g., e2e4)
- **Tactical Theme:** Common chess patterns (fork, pin, skewer, etc.)
- **Puzzle Rating:** Difficulty rating based on Lichess data (800-3000+)
- **Training Session:** Set of 100 puzzles with specific focus areas

### References
- Lichess Puzzle Database: https://database.lichess.org/#puzzles
- Lichess API Documentation: https://lichess.org/api
- OAuth 2.0 Specification: https://oauth.net/2/
- React Chessboard: https://www.npmjs.com/package/react-chessboard
- Chess.js: https://github.com/jhlywa/chess.js

---

**Document Status:** ✅ Complete
**Next Step:** Create Technical Specification
**Last Updated:** 2026-01-26
