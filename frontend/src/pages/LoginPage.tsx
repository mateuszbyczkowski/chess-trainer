import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleLogin = async (type: 'guest' | 'lichess' | 'google') => {
    setIsLoading(true);
    setError(null);

    try {
      await login(type);
      if (type === 'guest') {
        navigate('/dashboard');
      }
      // For OAuth logins, user will be redirected to the provider
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-chess-light chess-pattern">
      <div className="card max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">♟️</div>
          <h1 className="mb-2">Chess Trainer</h1>
          <p className="text-primary-600 font-medium">Master Every Move</p>
        </div>
        <p className="text-gray-600 text-center mb-8">
          Practice chess puzzles and track your progress
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-600 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            className="btn-primary w-full py-3 text-base flex items-center justify-center space-x-2"
            onClick={() => handleLogin('lichess')}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Loading...' : 'Login with Lichess'}</span>
          </button>

          <button
            className="btn-secondary w-full py-3 text-base flex items-center justify-center space-x-2"
            onClick={() => handleLogin('google')}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Loading...' : 'Login with Google'}</span>
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue without account</span>
            </div>
          </div>

          <button
            className="w-full py-3 text-base border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            onClick={() => handleLogin('guest')}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Continue as Guest'}
          </button>
        </div>
      </div>
    </div>
  );
}
