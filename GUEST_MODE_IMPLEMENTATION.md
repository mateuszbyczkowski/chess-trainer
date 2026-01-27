# Guest Mode Implementation Plan

## Current State (After Deployment)

### ✅ What's Working
- Guest warning banner displays for guest users
- Logout button works and navigates to login page
- Backend generates UUIDs correctly for all users
- Puzzles can be loaded and solved

### ❌ Current Issues
1. **Guest users create database records** - defeats purpose of guest mode
2. **No data migration** - when guest logs in, their progress is lost
3. **No localStorage-only storage** - guest data goes to server

---

## Option 1: Full localStorage Guest Mode (Recommended)

### Overview
True guest mode with browser-only storage and data migration on login.

```
┌─────────────────┐
│  Guest User     │
│  (localStorage) │
└────────┬────────┘
         │
         ├─ Solve puzzles → Save to localStorage
         ├─ View stats → Calculate from localStorage
         └─ Login → Migrate data to server + create permanent account
                    └─ Transfer all attempts & stats
```

### Implementation Steps

#### Phase 1: LocalStorage-Only Guest Mode

**Frontend Changes:**

1. **Update AuthContext** (`frontend/src/contexts/AuthContext.tsx`):
```typescript
const login = async (type: 'guest' | 'lichess' | 'google') => {
  if (type === 'guest') {
    // Don't call backend - create local-only guest
    const guestNumber = Math.floor(Math.random() * 100000);
    const localGuest = {
      id: `guest-${Date.now()}`,
      displayName: `Guest_${guestNumber}`,
      isGuest: true,
    };

    localStorage.setItem('guestUser', JSON.stringify(localGuest));
    localStorage.setItem('user', JSON.stringify(localGuest));
    setUser(localGuest);
  } else {
    // OAuth flows remain unchanged
    ...
  }
};
```

2. **Create LocalStorageService** (`frontend/src/services/localStorage.ts`):
```typescript
interface GuestAttempt {
  puzzleId: string;
  solved: boolean;
  moves: string[];
  timeSpent: number;
  attemptedAt: string;
}

export const guestStorage = {
  getAttempts(): GuestAttempt[] {
    const data = localStorage.getItem('guestAttempts');
    return data ? JSON.parse(data) : [];
  },

  saveAttempt(attempt: GuestAttempt) {
    const attempts = this.getAttempts();
    attempts.push(attempt);
    localStorage.setItem('guestAttempts', JSON.stringify(attempts));
  },

  getStats() {
    const attempts = this.getAttempts();
    return {
      totalAttempts: attempts.length,
      totalSolved: attempts.filter(a => a.solved).length,
      successRate: attempts.length > 0
        ? (attempts.filter(a => a.solved).length / attempts.length) * 100
        : 0,
    };
  },

  clearAll() {
    localStorage.removeItem('guestAttempts');
    localStorage.removeItem('guestUser');
  },
};
```

3. **Update attemptsApi** (`frontend/src/services/api.ts`):
```typescript
export const attemptsApi = {
  submit: async (puzzleId, solved, timeSpent, movesMade) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // If guest, save to localStorage instead
    if (user.isGuest && user.id?.startsWith('guest-')) {
      const attempt = {
        puzzleId,
        solved,
        moves: movesMade.split(' '),
        timeSpent,
        attemptedAt: new Date().toISOString(),
      };
      guestStorage.saveAttempt(attempt);
      return attempt;
    }

    // Otherwise, save to backend
    const { data } = await apiClient.post('/attempts', {
      puzzleId, solved, timeSpent, movesMade
    });
    return data;
  },

  getUserHistory: async (page = 1, limit = 20) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // If guest, return from localStorage
    if (user.isGuest && user.id?.startsWith('guest-')) {
      const attempts = guestStorage.getAttempts();
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        data: attempts.slice(start, end),
        total: attempts.length,
        page,
        totalPages: Math.ceil(attempts.length / limit),
      };
    }

    // Otherwise, fetch from backend
    const { data } = await apiClient.get('/attempts/history', {
      params: { page, limit }
    });
    return data;
  },
};
```

#### Phase 2: Data Migration on Login

**Backend Changes:**

1. **Add Migration Endpoint** (`backend/src/modules/auth/auth.controller.ts`):
```typescript
@Post('migrate-guest-data')
@UseGuards(AuthGuard('jwt'))
async migrateGuestData(@Req() req: Request, @Body() body: { attempts: any[] }) {
  const user = req.user as User;

  // Validate user is not a guest
  if (user.isGuest) {
    throw new BadRequestException('Cannot migrate to guest account');
  }

  // Save guest attempts to this user's account
  await this.authService.migrateGuestAttempts(user.id, body.attempts);

  return { success: true, migrated: body.attempts.length };
}
```

2. **Add Migration Service** (`backend/src/modules/auth/auth.service.ts`):
```typescript
async migrateGuestAttempts(userId: string, guestAttempts: any[]) {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  // Convert guest attempts to database format
  for (const attempt of guestAttempts) {
    const puzzle = await this.puzzleRepository.findOne({
      where: { id: attempt.puzzleId }
    });

    if (puzzle) {
      await this.attemptRepository.save({
        id: uuidv4(),
        userId: user.id,
        puzzleId: puzzle.id,
        solved: attempt.solved,
        moves: attempt.moves,
        timeSpentSeconds: attempt.timeSpent,
        attemptedAt: new Date(attempt.attemptedAt),
      });
    }
  }
}
```

**Frontend Changes:**

3. **Update Login Flow** (`frontend/src/contexts/AuthContext.tsx`):
```typescript
const login = async (type: 'guest' | 'lichess' | 'google') => {
  if (type === 'guest') {
    // Create local guest (no backend call)
    ...
  } else {
    // Check if there's guest data to migrate
    const guestAttempts = guestStorage.getAttempts();

    // Perform OAuth login
    if (type === 'lichess') {
      await authApi.lichessLogin();
    } else if (type === 'google') {
      await authApi.googleLogin();
    }

    // After OAuth completes and tokens are set:
    if (guestAttempts.length > 0) {
      try {
        await authApi.migrateGuestData(guestAttempts);
        guestStorage.clearAll();

        // Show success message
        alert(`Successfully migrated ${guestAttempts.length} puzzle attempts!`);
      } catch (error) {
        console.error('Failed to migrate guest data:', error);
      }
    }
  }
};
```

---

## Deployment Plan

### 1. Deploy Frontend Changes
```bash
cd /var/www/chess-trainer
git pull origin main
cd frontend
npm run build
pm2 restart chess-trainer-frontend
```

### 2. Deploy Backend Changes
```bash
cd /var/www/chess-trainer
git pull origin main
cd backend
npm run build
pm2 restart chess-trainer-api
```

### 3. Test Flow
1. **Test Guest Mode:**
   - Click "Continue as Guest"
   - Solve 2-3 puzzles
   - Check localStorage has `guestAttempts`
   - Check backend logs - should have NO new user creation

2. **Test Migration:**
   - While logged in as guest, click "Login with Lichess"
   - Complete OAuth flow
   - Check that attempts are migrated
   - Check localStorage is cleared
   - Verify history shows migrated attempts

---

## Benefits

✅ **No database pollution** - Guest users don't create database records
✅ **Fast guest signup** - No API call needed
✅ **Data migration** - Users don't lose progress when they log in
✅ **Clear UX** - Warning banner explains temporary storage
✅ **Privacy-friendly** - Guest data stays local until user chooses to save

---

## Next Steps

1. ✅ Deploy current changes (warning banner)
2. ⏳ Implement localStorage-only guest mode (Phase 1)
3. ⏳ Implement data migration (Phase 2)
4. ⏳ Test full flow end-to-end
5. ⏳ Update documentation

---

**Status:** Ready for Phase 1 implementation
**Last Updated:** 2026-01-27
