# Recent Changes & Undocumented Features

**Last Updated:** 2026-01-28

This document tracks recent features, bug fixes, and improvements that are not yet fully documented in the main documentation files. Use this as a reference when continuing work in a new thread.

---

## ✅ Implemented Features (Ready for Production)

### 1. First-Visit Redirect to Login Page

**Status:** ✅ Implemented, Committed, Needs Deployment

**Description:** Automatically redirects new visitors to the login page on their first visit.

**Implementation:**
- **File:** `frontend/src/components/FirstVisitRedirect.tsx` (Created)
- **Integration:** Added to `frontend/src/App.tsx`

**How it works:**
- Uses localStorage flag `chess_trainer_has_visited` to track if user has visited before
- On first visit, redirects to `/login` page
- Flag is set after first redirect
- Only redirects if user is not authenticated and not already on login page

**Code Reference:**
```typescript
// frontend/src/components/FirstVisitRedirect.tsx
export function FirstVisitRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (location.pathname === '/login') return;

    const hasVisited = localStorage.getItem('chess_trainer_has_visited');

    if (!hasVisited && !user) {
      localStorage.setItem('chess_trainer_has_visited', 'true');
      navigate('/login');
    }
  }, [isLoading, user, location.pathname, navigate]);

  return null;
}
```

**To Document:**
- Add to README.md under "Features" section
- Add to GETTING_STARTED.md under "User Experience" section

---

### 2. Guest Stats Bug Fix

**Status:** ✅ Fixed, Committed, Needs Deployment

**Description:** Guest users were showing 0 stats (puzzles solved, accuracy, streak) despite having solved puzzles.

**Problem:**
- StatsPage.tsx was using duplicate localStorage code with wrong key `guestAttempts`
- Should have been using `chess_trainer_guest_attempts` (with prefix)
- Code was not using the centralized `statsApi.getUserStats()` that already handles both guests and authenticated users

**Solution:**
- Removed 87 lines of duplicate localStorage logic
- Simplified to use `statsApi.getUserStats()` which already handles:
  - Guest users → reads from localStorage with correct key
  - Authenticated users → fetches from API

**Files Changed:**
- `frontend/src/pages/StatsPage.tsx` - Simplified stats fetching logic

**Code Reference:**
```typescript
// Before: Had duplicate localStorage logic with wrong key
// After:
useEffect(() => {
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // statsApi.getUserStats() handles both guests (localStorage) and authenticated users (API)
      const userStats = await statsApi.getUserStats();
      setStats({
        totalAttempts: userStats.totalAttempts,
        totalSolved: userStats.totalSolved,
        successRate: userStats.successRate,
        averageTime: 0, // Not tracked yet
        currentStreak: userStats.currentStreak,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  fetchStats();
}, [user]);
```

**To Document:**
- Add to GUEST_MODE_IMPLEMENTATION.md under "Bug Fixes" section
- Mention in README.md changelog

---

### 3. Guest History Bug Fix

**Status:** ✅ Fixed, Ready for Commit

**Description:** Guest users were not seeing their puzzle history on the History page, and statistics on Dashboard showed 0 despite having solved puzzles.

**Problem:**
- HistoryPage.tsx had the same issue as StatsPage (see #2 above)
- Used duplicate localStorage code with wrong key `guestAttempts`
- Should have been using `chess_trainer_guest_attempts` (with prefix)
- Code checked `if (user?.isGuest)` which incorrectly matched server-backed guests who have data in the database
- Code was not using the centralized `attemptsApi.getUserHistory()` that already handles both guests and authenticated users

**Solution:**
- Removed duplicate localStorage logic (lines 26-29 and GuestAttempt interface)
- Simplified to use `attemptsApi.getUserHistory()` which already handles:
  - Local-only guests (ID starts with `guest-`) → reads from localStorage with correct key `chess_trainer_guest_attempts`
  - Server-backed guests → fetches from API/database
  - Authenticated users → fetches from API/database

**Files Changed:**
- `frontend/src/pages/HistoryPage.tsx` - Simplified history fetching logic

**Code Reference:**
```typescript
// Before: Had duplicate localStorage logic with wrong key and wrong condition
if (user?.isGuest) {
  const guestAttempts = JSON.parse(localStorage.getItem('guestAttempts') || '[]');
  setAttempts(guestAttempts.reverse());
} else {
  const response = await attemptsApi.getUserHistory(1, 100);
  setAttempts(response.data);
}

// After: Unified API call
// attemptsApi.getUserHistory() handles both guests (localStorage) and authenticated users (API)
const response = await attemptsApi.getUserHistory(1, 100);
setAttempts(response.data);
```

**Impact:**
- Fixes Dashboard showing 0 statistics when History page has data
- Fixes History page not displaying puzzles for guest users
- Both local-only guests and server-backed guests now work correctly

**To Document:**
- Add to GUEST_MODE_IMPLEMENTATION.md under "Bug Fixes" section
- Mention in README.md changelog

---

### 4. Authentication & Route Protection Fixes

**Status:** ✅ Fixed, Ready for Commit

**Description:** After logout, users could still access protected routes, no login button was visible, and users weren't redirected to login page.

**Problems:**
1. **Logout navigation issue**: After logout, user was navigated to `/` (dashboard) instead of `/login`
2. **Missing login button**: Header only showed logout button when user existed, but no login button when logged out
3. **No route protection**: All routes (dashboard, puzzles, history, stats) were accessible even without authentication
4. **FirstVisitRedirect limitation**: Only redirected first-time visitors, not logged-out users returning to the site

**Solution:**
1. **Fixed logout redirect**: Changed Header's `handleLogout` to navigate to `/login` instead of `/`
2. **Added login button**: Header now shows "Login" button when user is not authenticated (though this is mostly for convenience since logged-out users are redirected to login)
3. **Created ProtectedRoute component**: New wrapper component that checks authentication and redirects to `/login` if user is null (no user or guest)
4. **Removed FirstVisitRedirect**: No longer needed since ProtectedRoute handles all unauthenticated access

**User Flow:**
- Unauthenticated users are redirected to `/login`
- On login page, users MUST choose one of:
  - Continue as Guest (creates local-only guest user)
  - Login with Lichess (OAuth)
  - Login with Google (OAuth)
- Only after making a choice can users access protected routes (dashboard, puzzles, history, stats)
- After logout, users return to `/login` to choose again

**Files Changed:**
- `frontend/src/components/layout/Header.tsx` - Fixed logout redirect and added login button
- `frontend/src/components/ProtectedRoute.tsx` (Created) - Route protection component
- `frontend/src/App.tsx` - Wrapped protected routes with ProtectedRoute, removed FirstVisitRedirect

**Code Reference:**
```typescript
// frontend/src/components/ProtectedRoute.tsx
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// frontend/src/App.tsx - Protected routes
<Route
  element={
    <ProtectedRoute>
      <Layout>
        <Outlet />
      </Layout>
    </ProtectedRoute>
  }
>
  {/* All protected routes here */}
</Route>

// frontend/src/components/layout/Header.tsx - Login button
{user ? (
  <div>
    <span>{user.displayName}</span>
    <button onClick={handleLogout}>Logout</button>
  </div>
) : (
  <Link to="/login">Login</Link>
)}
```

**Impact:**
- Users are properly redirected to login page after logout
- Login button is always visible when not authenticated
- Protected routes (dashboard, puzzles, history, stats) are no longer accessible without authentication
- Both local-only guests and authenticated users can access the app
- Unauthenticated users are automatically redirected to login when trying to access protected routes

**To Document:**
- Add to README.md under "Security" section
- Update GETTING_STARTED.md with authentication flow

---

### 5. Puzzle Themes & Openings Implementation

**Status:** ✅ Implemented, Committed, Needs Deployment

**Description:** Categories page was showing empty lists for puzzle themes and openings.

**Problem:**
- `puzzles.service.ts` had TODO stubs returning empty arrays
- `getThemes()` and `getOpenings()` were not implemented

**Solution:**
- Implemented PostgreSQL UNNEST queries to aggregate from array columns
- Themes extracted from `themes` array column
- Openings extracted from `opening_tags` array column
- Results sorted by count (descending) and name (ascending)

**Files Changed:**
- `backend/src/modules/puzzles/puzzles.service.ts:60-98` - Implemented both methods

**Code Reference:**
```typescript
// backend/src/modules/puzzles/puzzles.service.ts

async getThemes(): Promise<{ name: string; count: number }[]> {
  const result = await this.puzzleRepository.query(`
    SELECT
      theme as name,
      COUNT(*) as count
    FROM (
      SELECT UNNEST(themes) as theme
      FROM puzzles
    ) as themes_unnested
    GROUP BY theme
    ORDER BY count DESC, theme ASC
  `);

  return result.map((row) => ({
    name: row.name,
    count: parseInt(row.count, 10),
  }));
}

async getOpenings(): Promise<{ name: string; count: number }[]> {
  const result = await this.puzzleRepository.query(`
    SELECT
      opening as name,
      COUNT(*) as count
    FROM (
      SELECT UNNEST(opening_tags) as opening
      FROM puzzles
      WHERE opening_tags IS NOT NULL
      AND array_length(opening_tags, 1) > 0
    ) as openings_unnested
    GROUP BY opening
    ORDER BY count DESC, opening ASC
  `);

  return result.map((row) => ({
    name: row.name,
    count: parseInt(row.count, 10),
  }));
}
```

**Technical Notes:**
- Uses PostgreSQL `UNNEST()` function to expand array columns into rows
- Aggregates with `COUNT(*)` and `GROUP BY`
- Filters out NULL opening_tags
- Performance: Efficient for small-medium datasets, consider indexing for large datasets

**To Document:**
- Add to backend/README.md under "API Endpoints" → "Categories"
- Add to TECHNICAL_SPEC.md under "Database Queries"

---

### 6. Puzzle Import Script Improvements

**Status:** ✅ Updated, Committed, Pushed

**Description:** Improved puzzle import workflow for production server with better error handling.

**Changes Made:**

1. **Removed Non-Working Scripts:**
   - `upload-puzzles.sh` (deleted)
   - `download-and-import-puzzles.sh` (deleted)
   - `import-puzzles-remote.sh` (deleted)
   - Reason: Network connectivity issues ("Network unreachable" to srv37.mikr.us)

2. **Enhanced Working Script:**
   - `server-import-puzzles.sh` - Run directly on server after manual SSH
   - Added zstd tool detection with fallback to unzstd
   - Clear error message with installation instructions if zstd missing

3. **Updated Documentation:**
   - `PUZZLE_IMPORT_GUIDE.md` - Removed references to deleted scripts
   - Simplified to show only the working manual SSH method
   - Added troubleshooting for "zstd: command not found"
   - Updated database limits from 100MB to 200-300MB
   - Updated capacity estimates to ~250,000-600,000 puzzles

**Files Changed:**
- `server-import-puzzles.sh:57-84` - Added zstd detection logic
- `PUZZLE_IMPORT_GUIDE.md` - Complete rewrite, removed Methods 2 & 3

**Deployment Notes:**
- User must install zstd on server: `sudo apt-get install -y zstd`
- Script checks for tool availability before attempting decompression
- Database limit: 200-300MB = ~250,000-600,000 puzzles

**Already Documented:** ✅ PUZZLE_IMPORT_GUIDE.md

---

## 🚀 Deployment Status

### Ready for Deployment (Committed to Main)

The following changes are committed to `main` branch but **NOT YET DEPLOYED** to production:

1. ❌ First-visit redirect feature - REMOVED (replaced by ProtectedRoute)
2. ✅ Guest stats bug fix (StatsPage)
3. ⏳ Guest history bug fix (HistoryPage) - Ready to commit
4. ⏳ Authentication & route protection fixes - Ready to commit
5. ✅ Puzzle themes/openings implementation
6. ✅ Puzzle import script improvements

### How to Deploy

Run the deployment script from project root:

```bash
./deploy.sh
```

This will:
1. SSH into production server
2. Pull latest code from `main` branch
3. Install dependencies
4. Run database migrations (if any)
5. Build backend and frontend
6. Restart PM2 processes
7. Verify deployment health

**Production URLs:**
- Backend API: http://srv37.mikr.us:30191/api
- Frontend: http://srv37.mikr.us:40105
- Database: psql01.mikr.us:5432 (db_jan191)

---

## 📝 Documentation Gaps

### Missing from README.md

1. **First-visit redirect feature** - Not mentioned in features list
2. **Puzzle themes/openings** - Categories functionality not detailed
3. **Recent bug fixes** - Guest stats fix not mentioned

### Missing from GUEST_MODE_IMPLEMENTATION.md

1. **Production deployment status** - Needs update that Phase 1 is deployed
2. **Bug fixes** - Guest stats localStorage key fix
3. **Testing checklist** - What to test after deployment

### Missing from Backend README

1. **Puzzle categories endpoints** - `/api/puzzles/categories/themes` and `/api/puzzles/categories/openings`
2. **Array aggregation queries** - PostgreSQL UNNEST technique used

### Missing from TECHNICAL_SPEC.md

1. **Database query patterns** - UNNEST for array aggregation
2. **localStorage schema** - Guest data structure and keys used
3. **First-visit tracking** - localStorage flags for UX

---

## 🐛 Known Issues & Future Work

### Phase 2: Guest Data Migration (Not Implemented)

**Status:** ⏳ Planned, Not Started

When guest users log in with OAuth, their localStorage data should be migrated to the server. Currently, this is NOT implemented.

**What needs to be done:**
1. Backend endpoint: `POST /api/auth/migrate-guest-data`
2. Frontend: Detect guest data on OAuth login and trigger migration
3. Clear localStorage after successful migration
4. Show success message to user

**Reference:** See GUEST_MODE_IMPLEMENTATION.md → Phase 2 for detailed plan

### Puzzle Import on Production

**Status:** ⏳ Manual Step Required

Puzzles need to be imported on production server:

```bash
# SSH into server
ssh jan191@srv37.mikr.us
cd /var/www/chess-trainer

# Download import script
wget https://raw.githubusercontent.com/mateuszbyczkowski/chess-trainer/main/server-import-puzzles.sh
chmod +x server-import-puzzles.sh

# Install zstd if needed
sudo apt-get update && sudo apt-get install -y zstd

# Run import (recommended: start with 100,000 puzzles)
./server-import-puzzles.sh 100000
```

**Note:** Full database contains ~3 million puzzles, but production has 200-300MB limit (~250k-600k puzzles)

---

## 🔍 Testing Checklist

### Before Deploying to Production

- [ ] Run tests locally: `cd backend && npm test`
- [ ] Test first-visit redirect in incognito mode
- [ ] Test guest mode: solve puzzle, check stats, check history
- [ ] Test categories page shows themes and openings
- [ ] Test OAuth login (both Google and Lichess)
- [ ] Verify localStorage keys are correct

### After Deploying to Production

- [ ] Verify backend API is responding: http://srv37.mikr.us:30191/api
- [ ] Verify frontend loads: http://srv37.mikr.us:40105
- [ ] Test first-visit redirect on production
- [ ] Test guest mode on production
- [ ] Check categories page has data (themes, openings)
- [ ] Test OAuth logins work on production
- [ ] Check PM2 status: `ssh jan191@srv37.mikr.us "pm2 status"`
- [ ] Review logs for errors: `ssh jan191@srv37.mikr.us "pm2 logs --lines 50"`

---

## 📦 Files Modified in This Session

### Frontend Files
- ❌ `frontend/src/components/FirstVisitRedirect.tsx` (Removed - replaced by ProtectedRoute)
- ✅ `frontend/src/App.tsx` (Modified - removed FirstVisitRedirect, added ProtectedRoute wrapper)
- ✅ `frontend/src/pages/StatsPage.tsx` (Modified - fixed guest stats bug)
- ⏳ `frontend/src/pages/HistoryPage.tsx` (Modified - fixed guest history bug) - Ready to commit
- ⏳ `frontend/src/components/layout/Header.tsx` (Modified - fixed logout redirect, added login button) - Ready to commit
- ⏳ `frontend/src/components/ProtectedRoute.tsx` (Created - route protection component) - Ready to commit

### Backend Files
- ✅ `backend/src/modules/puzzles/puzzles.service.ts` (Modified - implemented getThemes and getOpenings)

### Scripts
- ✅ `server-import-puzzles.sh` (Modified - added zstd detection)
- ❌ `upload-puzzles.sh` (Deleted - network issues)
- ❌ `download-and-import-puzzles.sh` (Deleted - network issues)
- ❌ `import-puzzles-remote.sh` (Deleted - network issues)

### Documentation
- ✅ `PUZZLE_IMPORT_GUIDE.md` (Modified - simplified to single method)
- ✅ `RECENT_CHANGES.md` (Created - this file)

---

## 💡 Tips for Next Session

1. **Deploy the changes** - Run `./deploy.sh` to deploy all committed changes
2. **Import puzzles** - SSH into production and run import script with limit (100k recommended)
3. **Test production** - Verify all features work on live server
4. **Update documentation** - Add missing sections to README, GUEST_MODE_IMPLEMENTATION, etc.
5. **Consider Phase 2** - Implement guest data migration on OAuth login
6. **Monitor database size** - Check if approaching 200-300MB limit after puzzle import

---

## 📊 Git Status

**Branch:** main

**Untracked Files:**
- `lichess_db_puzzle.csv.zst` (local puzzle database download - DO NOT commit, too large)

**Modified Files (Not Staged):**
- None (all changes committed)

**Recent Commits:**
- `10bf5ec` - Clean up puzzle import scripts and improve zstd handling
- `1e72685` - [Previous commit]

**Remote Status:**
- All commits pushed to origin/main ✅

---

## 🎯 Immediate Action Items

1. **Deploy to production:**
   ```bash
   ./deploy.sh
   ```

2. **Import puzzles on production:**
   ```bash
   ssh jan191@srv37.mikr.us
   cd /var/www/chess-trainer
   wget https://raw.githubusercontent.com/mateuszbyczkowski/chess-trainer/main/server-import-puzzles.sh
   chmod +x server-import-puzzles.sh
   sudo apt-get install -y zstd
   ./server-import-puzzles.sh 100000
   ```

3. **Test in production:**
   - Visit http://srv37.mikr.us:40105
   - Test first-visit redirect (use incognito)
   - Test guest mode (solve puzzle, check stats)
   - Test categories page (themes, openings)
   - Test OAuth logins

4. **Update documentation:**
   - Add features to README.md
   - Update GUEST_MODE_IMPLEMENTATION.md with deployment status
   - Add API endpoints to backend/README.md

---

**End of Document**
