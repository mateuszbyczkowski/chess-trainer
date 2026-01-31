import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@services/api';
import { useAuth } from '@/contexts/AuthContext';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { setAuthenticatedUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get token from URL query parameter
        const token = searchParams.get('token');
        const refreshToken = searchParams.get('refreshToken');

        if (!token) {
          setError('No authentication token received');
          return;
        }

        // Store tokens in localStorage
        localStorage.setItem('accessToken', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // Fetch user information
        const user = await authApi.getCurrentUser();

        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(user));

        // Update AuthContext state
        setAuthenticatedUser(user);

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Authentication failed. Please try again.');

        // Redirect to login after error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuthenticatedUser]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card max-w-md">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Completing authentication...</h2>
          <p className="text-gray-600">Please wait while we log you in.</p>
        </div>
      </div>
    </div>
  );
}
