import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card max-w-md w-full">
        <h1 className="text-center mb-8">♟️ Chess Trainer</h1>
        <p className="text-gray-600 text-center mb-8">
          Practice chess puzzles and track your progress
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            className="btn-primary w-full"
            onClick={() => handleLogin('lichess')}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Login with Lichess'}
          </button>

          <button
            className="btn-secondary w-full"
            onClick={() => handleLogin('google')}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Login with Google'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <button
            className="btn-secondary w-full"
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
