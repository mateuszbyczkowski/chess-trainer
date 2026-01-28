import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">♟️</span>
            <span className="text-xl font-bold text-gray-900">Chess Trainer</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
              Dashboard
            </Link>
            <Link to="/puzzles" className="text-gray-700 hover:text-primary-600">
              Puzzles
            </Link>
            <Link to="/history" className="text-gray-700 hover:text-primary-600">
              History
            </Link>
            <Link to="/stats" className="text-gray-700 hover:text-primary-600">
              Stats
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {user.displayName}
                </span>
                <button onClick={handleLogout} className="btn-primary">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
