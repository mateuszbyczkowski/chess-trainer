import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { statsApi } from '@services/api';

interface GuestAttempt {
  puzzleId: string;
  solved: boolean;
  timeSpent: number;
  movesMade: string;
  timestamp: string;
}

interface Stats {
  totalAttempts: number;
  totalSolved: number;
  successRate: number;
  averageTime: number;
  currentStreak: number;
}

export function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalAttempts: 0,
    totalSolved: 0,
    successRate: 0,
    averageTime: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (user?.isGuest) {
          // Calculate from localStorage for guest users
          const guestAttempts: GuestAttempt[] = JSON.parse(
            localStorage.getItem('guestAttempts') || '[]'
          );

          const totalAttempts = guestAttempts.length;
          const totalSolved = guestAttempts.filter((a) => a.solved).length;
          const successRate = totalAttempts > 0 ? (totalSolved / totalAttempts) * 100 : 0;

          // Calculate average time
          const averageTime =
            totalAttempts > 0
              ? guestAttempts.reduce((sum, a) => sum + a.timeSpent, 0) / totalAttempts
              : 0;

          // Calculate current streak (consecutive days with solved puzzles)
          const currentStreak = calculateStreak(guestAttempts);

          setStats({
            totalAttempts,
            totalSolved,
            successRate,
            averageTime: Math.round(averageTime),
            currentStreak,
          });
        } else {
          // Fetch from API for authenticated users
          const userStats = await statsApi.getUserStats();
          setStats({
            totalAttempts: userStats.totalAttempts,
            totalSolved: userStats.totalSolved,
            successRate: userStats.successRate,
            averageTime: 0, // Backend doesn't provide this yet
            currentStreak: userStats.currentStreak,
          });
        }
      } catch (err) {
        console.error('Failed to load stats:', err);
        setError('Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const calculateStreak = (attempts: GuestAttempt[]): number => {
    if (attempts.length === 0) return 0;

    // Sort by date descending
    const sorted = [...attempts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Get dates with solved puzzles
    const solvedDates = sorted
      .filter((a) => a.solved)
      .map((a) => new Date(a.timestamp).toDateString());

    if (solvedDates.length === 0) return 0;

    // Check if most recent date is today or yesterday
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (solvedDates[0] !== today && solvedDates[0] !== yesterday) {
      return 0; // Streak is broken
    }

    // Count consecutive days
    let streak = 1;
    let currentDate = new Date(solvedDates[0]);

    for (let i = 1; i < solvedDates.length; i++) {
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);

      if (solvedDates[i] === prevDate.toDateString()) {
        streak++;
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return streak;
  };

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
              <p className="text-3xl font-bold">{stats.successRate.toFixed(1)}%</p>
            </div>

            <div className="card">
              <h3 className="text-gray-500 text-sm mb-2">Avg Time</h3>
              <p className="text-3xl font-bold">{formatTime(stats.averageTime)}</p>
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
