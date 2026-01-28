/**
 * Migrate old guest data from legacy localStorage keys to new prefixed keys
 *
 * Old keys (without prefix):
 * - 'guestAttempts' -> 'chess_trainer_guest_attempts'
 * - 'user' (if guest) -> 'chess_trainer_guest_user'
 */

export function migrateGuestData() {
  try {
    // Check if migration already done
    const migrationDone = localStorage.getItem('chess_trainer_migration_done');
    if (migrationDone === 'true') {
      console.log('Guest data migration already completed');
      return;
    }

    let migrated = false;

    // Migrate guest attempts from 'guestAttempts' to 'chess_trainer_guest_attempts'
    const oldAttempts = localStorage.getItem('guestAttempts');
    const newAttempts = localStorage.getItem('chess_trainer_guest_attempts');

    if (oldAttempts && !newAttempts) {
      console.log('Migrating guest attempts from old key to new key...');
      localStorage.setItem('chess_trainer_guest_attempts', oldAttempts);
      localStorage.removeItem('guestAttempts');
      migrated = true;
      console.log('Guest attempts migrated successfully');
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

    // Mark migration as done
    localStorage.setItem('chess_trainer_migration_done', 'true');

    if (migrated) {
      console.log('Guest data migration completed. Please refresh the page.');
      // Optionally trigger a page reload
      window.location.reload();
    } else {
      console.log('No guest data found to migrate');
    }
  } catch (error) {
    console.error('Guest data migration failed:', error);
  }
}
