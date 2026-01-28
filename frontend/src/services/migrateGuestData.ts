/**
 * Migrate old guest data from legacy localStorage keys to new prefixed keys
 *
 * Old keys (without prefix):
 * - 'guestAttempts' -> 'chess_trainer_guest_attempts'
 * - 'user' (if guest) -> 'chess_trainer_guest_user'
 *
 * Migration v2: Transform data structure (movesMade string -> moves array)
 */

const MIGRATION_VERSION = 2;

export function migrateGuestData() {
  try {
    // Check migration version
    const currentVersion = parseInt(localStorage.getItem('chess_trainer_migration_version') || '0', 10);

    if (currentVersion >= MIGRATION_VERSION) {
      console.log(`Guest data migration already up to date (v${currentVersion})`);
      return;
    }

    console.log(`Running guest data migration v${currentVersion} -> v${MIGRATION_VERSION}`);
    let migrated = false;

    // Migrate and transform guest attempts
    const oldAttempts = localStorage.getItem('guestAttempts');
    let newAttempts = localStorage.getItem('chess_trainer_guest_attempts');

    // Determine which source to use
    let sourceData = null;
    let sourceKey = '';

    if (oldAttempts && !newAttempts) {
      // Case 1: Old key exists, new key doesn't - migrate from old
      sourceData = oldAttempts;
      sourceKey = 'guestAttempts';
      console.log('Migrating guest attempts from old key to new key...');
    } else if (newAttempts && currentVersion < 2) {
      // Case 2: New key exists but data needs transformation (v1 -> v2)
      sourceData = newAttempts;
      sourceKey = 'chess_trainer_guest_attempts';
      console.log('Transforming existing guest attempts data structure...');
    }

    if (sourceData) {
      try {
        const parsedAttempts = JSON.parse(sourceData);

        // Transform data structure to ensure correct format
        const transformedAttempts = parsedAttempts.map((attempt: any) => {
          // Old structure might have movesMade as string, new expects moves as array
          let moves = attempt.moves;

          // If moves doesn't exist but movesMade does, transform it
          if (!moves && attempt.movesMade) {
            moves = typeof attempt.movesMade === 'string'
              ? attempt.movesMade.split(' ').filter((m: string) => m.length > 0)
              : attempt.movesMade;
          }

          // If moves is still undefined, default to empty array
          if (!moves) {
            moves = [];
          }

          // Ensure moves is an array
          if (!Array.isArray(moves)) {
            moves = [moves];
          }

          return {
            id: attempt.id || `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            puzzleId: attempt.puzzleId,
            solved: attempt.solved ?? false,
            moves: moves,
            timeSpent: attempt.timeSpent || attempt.timeSpentSeconds || 0,
            attemptedAt: attempt.attemptedAt || attempt.timestamp || new Date().toISOString(),
          };
        });

        localStorage.setItem('chess_trainer_guest_attempts', JSON.stringify(transformedAttempts));

        // Remove old key only if we migrated from it
        if (sourceKey === 'guestAttempts') {
          localStorage.removeItem('guestAttempts');
        }

        migrated = true;
        console.log(`Guest attempts migrated successfully (${transformedAttempts.length} attempts)`);
      } catch (error) {
        console.error('Failed to parse and transform guest attempts:', error);
        // If transformation fails, keep old data but mark as migrated to prevent loops
        migrated = true;
        console.log('Guest attempts migration encountered an error, skipping transformation');
      }
    }

    // Check if user in 'user' key is a guest and migrate to 'chess_trainer_guest_user'
    const oldUser = localStorage.getItem('user');
    const newUser = localStorage.getItem('chess_trainer_guest_user');

    if (oldUser && !newUser) {
      try {
        const parsedUser = JSON.parse(oldUser);
        // Only migrate if it's a local guest (ID starts with 'guest-')
        if (parsedUser?.isGuest === true && parsedUser?.id?.startsWith('guest-')) {
          console.log('Migrating guest user from old key to new key...');
          localStorage.setItem('chess_trainer_guest_user', oldUser);
          // Keep 'user' key as it's used by AuthContext
          migrated = true;
          console.log('Guest user migrated successfully');
        }
      } catch (error) {
        console.error('Failed to parse user data during migration:', error);
      }
    }

    // Mark migration version
    localStorage.setItem('chess_trainer_migration_version', MIGRATION_VERSION.toString());
    localStorage.setItem('chess_trainer_migration_done', 'true'); // Keep for backward compatibility

    if (migrated) {
      console.log(`Guest data migration to v${MIGRATION_VERSION} completed. Reloading page...`);
      // Trigger page reload to apply migrated data
      setTimeout(() => window.location.reload(), 100);
    } else {
      console.log('No guest data migration needed');
    }
  } catch (error) {
    console.error('Guest data migration failed:', error);
  }
}
