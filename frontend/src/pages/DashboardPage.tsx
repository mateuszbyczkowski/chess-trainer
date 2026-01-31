import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { statsApi, puzzlesApi, UserStats, Puzzle } from '@services/api';
import { useAuth } from '@contexts/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [dailyPuzzle, setDailyPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch stats and daily puzzle in parallel
        const [statsData, puzzleData] = await Promise.all([
          statsApi.getUserStats(),
          puzzlesApi.getDaily().catch(() => null), // Don't fail if no daily puzzle
        ]);

        setStats(statsData);
        setDailyPuzzle(puzzleData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load statistics');
        // Set default stats on error
        setStats({
          totalAttempts: 0,
          totalSolved: 0,
          accuracy: 0,
          averageTimeSeconds: 0,
          currentStreak: 0,
          longestStreak: 0,
          solvedToday: 0,
          solvedThisWeek: 0,
          solvedThisMonth: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1>Dashboard</h1>
        {user && (
          <p className="text-gray-600">
            Welcome, <span className="font-semibold">{user.displayName}</span>!
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-gray-500 mb-2">Puzzles Solved</h3>
          {isLoading ? (
            <p className="text-3xl font-bold text-gray-400">...</p>
          ) : (
            <p className="text-3xl font-bold">{stats?.totalSolved || 0}</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-gray-500 mb-2">Accuracy</h3>
          {isLoading ? (
            <p className="text-3xl font-bold text-gray-400">...</p>
          ) : (
            <p className="text-3xl font-bold">
              {stats?.accuracy ? `${Math.round(stats.accuracy)}%` : '0%'}
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="text-gray-500 mb-2">Current Streak</h3>
          {isLoading ? (
            <p className="text-3xl font-bold text-gray-400">...</p>
          ) : (
            <p className="text-3xl font-bold">
              {stats?.currentStreak || 0} {stats?.currentStreak === 1 ? 'day' : 'days'}
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="text-gray-500 mb-2">Your Rating</h3>
          {user?.lichessRating ? (
            <div>
              <p className="text-3xl font-bold">{user.lichessRating}</p>
              <p className="text-xs text-gray-500 mt-1">
                {user.ratingSource === 'lichess' ? 'Lichess synced' : 'Manually set'}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-2xl font-bold text-gray-400">Not set</p>
              <Link to="/profile" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                Set rating →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="mb-4">Puzzle of the Day</h2>
          <div className="mb-4">
            {dailyPuzzle ? (
              <Chessboard
                position={dailyPuzzle.fen}
                boardWidth={Math.min(400, window.innerWidth - 100)}
                arePiecesDraggable={false}
                customBoardStyle={{
                  borderRadius: '4px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                }}
              />
            ) : (
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">
                  {isLoading ? 'Loading...' : 'No daily puzzle available'}
                </p>
              </div>
            )}
          </div>
          {dailyPuzzle && (
            <div className="mb-4 text-sm text-gray-600">
              <p>Rating: {dailyPuzzle.rating} • Themes: {dailyPuzzle.themes.slice(0, 2).join(', ')}</p>
            </div>
          )}
          <Link to="/puzzles/daily" className="btn-primary w-full block text-center">
            Solve Daily Puzzle
          </Link>
        </div>

        <div className="card">
          <h2 className="mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/puzzles/random" className="btn-primary w-full block text-center">
              Random Puzzle
            </Link>
            <Link to="/puzzles" className="btn-secondary w-full block text-center">
              Browse by Category
            </Link>
            <Link to="/stats" className="btn-secondary w-full block text-center">
              View Statistics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
