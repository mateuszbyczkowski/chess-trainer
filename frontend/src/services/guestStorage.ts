/**
 * LocalStorage service for guest user data
 * Stores puzzle attempts and stats for users who haven't logged in
 */

export interface GuestAttempt {
  id: string;
  puzzleId: string;
  solved: boolean;
  moves: string[];
  timeSpent: number;
  attemptedAt: string;
}

export interface GuestUser {
  id: string;
  displayName: string;
  isGuest: true;
}

interface RawGuestAttempt {
  id: string;
  puzzleId: string;
  solved: boolean;
  moves: unknown;
  timeSpent: number;
  attemptedAt: string;
}

export const STORAGE_KEYS = {
  ATTEMPTS: 'chess_trainer_guest_attempts',
  USER: 'chess_trainer_guest_user',
  WARNING_DISMISSED: 'guestWarningDismissed',
} as const;

export const guestStorage = {
  /**
   * Create a new guest user (localStorage only)
   */
  createGuestUser(): GuestUser {
    const guestNumber = Math.floor(Math.random() * 100000);
    const user: GuestUser = {
      id: `guest-${Date.now()}`,
      displayName: `Guest_${guestNumber}`,
      isGuest: true,
    };

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },

  /**
   * Get current guest user
   */
  getGuestUser(): GuestUser | null {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) return null;

    try {
      const user = JSON.parse(data);
      // Verify it's a guest user
      if (user.isGuest && user.id?.startsWith('guest-')) {
        return user;
      }
    } catch (error) {
      console.error('Failed to parse guest user:', error);
    }

    return null;
  },

  /**
   * Check if current user is a localStorage-only guest
   */
  isLocalGuest(user: { isGuest?: boolean; id?: string } | null | undefined): boolean {
    return user?.isGuest === true && (user?.id?.startsWith('guest-') ?? false);
  },

  /**
   * Get all guest puzzle attempts
   */
  getAttempts(): GuestAttempt[] {
    const data = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!data) return [];

    try {
      const attempts = JSON.parse(data);
      // Normalize attempts to ensure moves is always an array
      return attempts.map((attempt: RawGuestAttempt): GuestAttempt => ({
        ...attempt,
        moves: Array.isArray(attempt.moves) ? attempt.moves : [],
      }));
    } catch (error) {
      console.error('Failed to parse guest attempts:', error);
      return [];
    }
  },

  /**
   * Save a puzzle attempt
   */
  saveAttempt(attempt: Omit<GuestAttempt, 'id' | 'attemptedAt'>): GuestAttempt {
    const attempts = this.getAttempts();

    // Ensure moves is an array
    const moves = Array.isArray(attempt.moves) ? attempt.moves : [];

    const newAttempt: GuestAttempt = {
      id: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...attempt,
      moves,
      attemptedAt: new Date().toISOString(),
    };

    console.log('[guestStorage] Saving attempt:', {
      puzzleId: newAttempt.puzzleId,
      solved: newAttempt.solved,
      timeSpent: newAttempt.timeSpent,
      movesCount: newAttempt.moves.length,
      moves: newAttempt.moves,
    });

    attempts.push(newAttempt);
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

    return newAttempt;
  },

  /**
   * Get guest statistics
   */
  getStats() {
    const attempts = this.getAttempts();

    // Debug logging
    console.log('[guestStorage] Getting stats for', attempts.length, 'attempts');
    if (attempts.length > 0) {
      console.log('[guestStorage] Sample attempt:', attempts[0]);
      const timesSpent = attempts.map(a => a.timeSpent);
      console.log('[guestStorage] Time spent values:', timesSpent);
    }

    const totalAttempts = attempts.length;
    const totalSolved = attempts.filter(a => a.solved).length;
    const successRate = totalAttempts > 0 ? (totalSolved / totalAttempts) * 100 : 0;

    // Calculate current streak
    let currentStreak = 0;
    const sortedAttempts = [...attempts].sort((a, b) =>
      new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
    );

    for (const attempt of sortedAttempts) {
      if (attempt.solved) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;

    for (const attempt of attempts) {
      if (attempt.solved) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate date-based stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let solvedToday = 0;
    let solvedThisWeek = 0;
    let solvedThisMonth = 0;
    let totalTimeSpent = 0;

    for (const attempt of attempts) {
      if (attempt.solved) {
        const attemptDate = new Date(attempt.attemptedAt);
        if (attemptDate >= today) {
          solvedToday++;
        }
        if (attemptDate >= weekAgo) {
          solvedThisWeek++;
        }
        if (attemptDate >= monthAgo) {
          solvedThisMonth++;
        }
      }
      // Ensure timeSpent is a valid number
      const timeSpent = Number(attempt.timeSpent) || 0;
      totalTimeSpent += timeSpent;
    }

    const averageTimeSeconds = totalAttempts > 0 ? Math.round(totalTimeSpent / totalAttempts) : 0;

    console.log('[guestStorage] Stats calculated:', {
      totalAttempts,
      totalTimeSpent,
      averageTimeSeconds,
    });

    return {
      totalAttempts,
      totalSolved,
      successRate,
      currentStreak,
      longestStreak,
      solvedToday,
      solvedThisWeek,
      solvedThisMonth,
      averageTimeSeconds,
    };
  },

  /**
   * Get attempts for a specific puzzle
   */
  getPuzzleAttempts(puzzleId: string): GuestAttempt[] {
    return this.getAttempts().filter(a => a.puzzleId === puzzleId);
  },

  /**
   * Clear all guest data
   */
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.WARNING_DISMISSED);
  },

  /**
   * Get data for migration when user logs in
   */
  getDataForMigration() {
    return {
      attempts: this.getAttempts(),
      stats: this.getStats(),
    };
  },

  /**
   * Check if guest warning has been dismissed
   */
  isWarningDismissed(): boolean {
    return localStorage.getItem(STORAGE_KEYS.WARNING_DISMISSED) === 'true';
  },

  /**
   * Mark guest warning as dismissed
   */
  dismissWarning(): void {
    localStorage.setItem(STORAGE_KEYS.WARNING_DISMISSED, 'true');
  },
};
