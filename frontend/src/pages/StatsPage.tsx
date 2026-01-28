import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { statsApi } from '@services/api';

interface Stats {
  totalAttempts: number;
  totalSolved: number;
  accuracy: number;
  averageTimeSeconds: number;
  currentStreak: number;
}

export function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalAttempts: 0,
    totalSolved: 0,
    accuracy: 0,
    averageTimeSeconds: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          accuracy: userStats.accuracy,
          averageTimeSeconds: userStats.averageTimeSeconds,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8">Statistics</h1>
        <div className="card">
          <p className="text-center py-8 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-8">Statistics</h1>
        <div className="card">
          <p className="text-center py-8 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8">Statistics</h1>

      {user?.isGuest && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-1">Guest Mode - Temporary Statistics</h3>
              <p className="text-sm text-yellow-700">
                These statistics are stored locally and will be lost when you clear your browser data.{' '}
                <Link to="/login" className="underline font-medium hover:text-yellow-900">
                  Log in
                </Link>{' '}
                to save your progress permanently.
              </p>
            </div>
          </div>
        </div>
      )}

      {stats.totalAttempts === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No puzzle attempts yet. Start solving puzzles!</p>
            <Link to="/puzzles" className="btn-primary inline-block">
              Browse Puzzles
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <h3 className="text-gray-500 text-sm mb-2">Total Solved</h3>
              <p className="text-3xl font-bold">{stats.totalSolved}</p>
            </div>

            <div className="card">
              <h3 className="text-gray-500 text-sm mb-2">Overall Accuracy</h3>
              <p className="text-3xl font-bold">{stats.accuracy.toFixed(1)}%</p>
            </div>

            <div className="card">
              <h3 className="text-gray-500 text-sm mb-2">Avg Time</h3>
              <p className="text-3xl font-bold">{formatTime(stats.averageTimeSeconds)}</p>
            </div>

            <div className="card">
              <h3 className="text-gray-500 text-sm mb-2">Current Streak</h3>
              <p className="text-3xl font-bold">{stats.currentStreak} days</p>
            </div>
          </div>

          {/* Total Attempts */}
          <div className="card mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-500 text-sm mb-2">Total Attempts</h3>
                <p className="text-2xl font-bold">{stats.totalAttempts}</p>
              </div>
              <div className="text-right">
                <h3 className="text-gray-500 text-sm mb-2">Failed</h3>
                <p className="text-2xl font-bold text-red-600">
                  {stats.totalAttempts - stats.totalSolved}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="card mb-8">
            <h2 className="mb-6">Performance Over Time</h2>
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">Chart will appear here</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
