import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { attemptsApi, PuzzleAttempt } from '@services/api';

interface GuestAttempt {
  puzzleId: string;
  solved: boolean;
  timeSpent: number;
  movesMade: string;
  timestamp: string;
}

export function HistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<(PuzzleAttempt | GuestAttempt)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (user?.isGuest) {
          // Load from localStorage for guest users
          const guestAttempts = JSON.parse(localStorage.getItem('guestAttempts') || '[]');
          setAttempts(guestAttempts.reverse()); // Most recent first
        } else {
          // Fetch from API for authenticated users
          const response = await attemptsApi.getUserHistory(1, 100);
          setAttempts(response.data);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
        setError('Failed to load puzzle history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8">Puzzle History</h1>
        <div className="card">
          <p className="text-center py-8 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-8">Puzzle History</h1>
        <div className="card">
          <p className="text-center py-8 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8">Puzzle History</h1>

      {user?.isGuest && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-1">Guest Mode - Temporary History</h3>
              <p className="text-sm text-yellow-700">
                This history is stored locally and will be lost when you clear your browser data.{' '}
                <Link to="/login" className="underline font-medium hover:text-yellow-900">
                  Log in
                </Link>{' '}
                to save your progress permanently.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {attempts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No puzzle attempts yet. Start solving puzzles!</p>
            <Link to="/puzzles" className="btn-primary inline-block">
              Browse Puzzles
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Puzzle</th>
                  <th className="text-left py-3 px-4">Result</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Moves</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt, index) => {
                  const isGuestAttempt = 'timestamp' in attempt;
                  const date = isGuestAttempt ? attempt.timestamp : (attempt as PuzzleAttempt).createdAt;

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(date)}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">
                        {attempt.puzzleId.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4">
                        {attempt.solved ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Solved
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                            ✗ Failed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{formatTime(attempt.timeSpent)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {attempt.movesMade.split(' ').length} moves
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/puzzles/solve/${attempt.puzzleId}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Retry →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
