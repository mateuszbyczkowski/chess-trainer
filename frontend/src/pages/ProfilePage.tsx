import { useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { usersApi } from '@services/api';
import { guestStorage } from '@services/guestStorage';
import axios from 'axios';

export function ProfilePage() {
  const { user, setAuthenticatedUser } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [manualRating, setManualRating] = useState<string>('');
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState(false);

  const handleSyncRating = async () => {
    setIsSyncing(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const updatedUser = await usersApi.syncLichessRating();

      // Update local user in localStorage and context
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAuthenticatedUser(updatedUser);

      setSyncSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setSyncError(error.response?.data?.message || 'Failed to sync rating');
      } else {
        setSyncError('Failed to sync rating');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveManualRating = async () => {
    setIsSavingManual(true);
    setManualError(null);
    setManualSuccess(false);

    const rating = parseInt(manualRating, 10);

    // Client-side validation
    if (isNaN(rating) || rating < 600 || rating > 3000) {
      setManualError('Rating must be a number between 600 and 3000');
      setIsSavingManual(false);
      return;
    }

    try {
      if (user?.isGuest) {
        // For guest users, update rating in localStorage
        const updatedUser = guestStorage.updateGuestRating(rating);
        setAuthenticatedUser(updatedUser);
      } else {
        // For authenticated Google users, update via API
        const updatedUser = await usersApi.updateManualRating(rating);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setAuthenticatedUser(updatedUser);
      }

      setManualSuccess(true);
      setManualRating(''); // Clear input

      // Auto-hide success message after 3 seconds
      setTimeout(() => setManualSuccess(false), 3000);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setManualError(error.response?.data?.message || 'Failed to save rating');
      } else {
        setManualError('Failed to save rating');
      }
    } finally {
      setIsSavingManual(false);
    }
  };

  const formatLastSynced = (date: string | null) => {
    if (!date) return 'Never';

    const syncDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return syncDate.toLocaleDateString();
  };

  const needsSync = (syncedAt: string | null) => {
    if (!syncedAt) return true;

    const syncDate = new Date(syncedAt);
    const now = new Date();
    const diffMs = now.getTime() - syncDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays >= 7; // Recommend sync if 7+ days old
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8">Profile & Settings</h1>

      {/* Account Information */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Display Name:</span>
            <span className="font-medium">{user.displayName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Account Type:</span>
            <span className="font-medium">
              {user.isGuest ? 'Guest' : user.lichessId ? 'Lichess' : 'Google'}
            </span>
          </div>
        </div>
      </div>

      {/* Lichess Integration */}
      {user.lichessId && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Lichess Integration</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Lichess Username:</span>
              <span className="font-medium">{user.lichessUsername}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Current Rating:</span>
              <span className="font-medium">
                {user.lichessRating ? user.lichessRating : 'Not synced'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Synced:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatLastSynced(user.lichessRatingSyncedAt || null)}
                </span>
                {needsSync(user.lichessRatingSyncedAt || null) && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                    Sync recommended
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={handleSyncRating}
                disabled={isSyncing}
                className={`btn-primary w-full ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSyncing ? 'Syncing...' : 'Sync Rating Now'}
              </button>

              {syncSuccess && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                  ✓ Rating synced successfully!
                </div>
              )}

              {syncError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                  {syncError}
                </div>
              )}

              <p className="mt-3 text-sm text-gray-600">
                Your Lichess rating helps us recommend puzzles at the right difficulty level (±300 rating points).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Rating for Google Users and Guests */}
      {!user.lichessId && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Chess Rating</h2>

          <div className="space-y-4">
            {user.lichessRating && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Rating:</span>
                <span className="font-medium">
                  {user.lichessRating}
                  {user.ratingSource === 'manual' && (
                    <span className="ml-2 text-xs text-gray-500">(manually set)</span>
                  )}
                </span>
              </div>
            )}

            <div>
              <label htmlFor="manualRating" className="block text-sm font-medium text-gray-700 mb-2">
                Set Your Chess Rating (600-3000)
              </label>
              <input
                id="manualRating"
                type="number"
                min="600"
                max="3000"
                value={manualRating}
                onChange={(e) => setManualRating(e.target.value)}
                placeholder={user.lichessRating?.toString() || "e.g., 1500"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSaveManualRating}
              disabled={isSavingManual || !manualRating}
              className={`btn-primary w-full ${(isSavingManual || !manualRating) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSavingManual ? 'Saving...' : 'Save Rating'}
            </button>

            {manualSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
                ✓ Rating saved successfully!
              </div>
            )}

            {manualError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                {manualError}
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700">
                <strong>Why set a rating?</strong>
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Your rating helps us recommend puzzles at the right difficulty level (±300 rating points).
                If you don&apos;t know your rating, try taking a few puzzles first, then come back and set it based on how you performed.
              </p>
            </div>

            {user.isGuest && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-700">
                  <strong>Note for Guest Users:</strong>
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Your rating is stored locally in your browser. To save your rating permanently and sync across devices,
                  create an account with <a href="/login" className="text-blue-600 hover:underline">Lichess or Google</a>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
