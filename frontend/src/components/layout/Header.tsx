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
    <header className="bg-white shadow-md border-b-2 border-primary-400">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="text-3xl transform group-hover:scale-110 transition-transform">♟️</div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-chess-dark">Chess Trainer</span>
              <span className="text-xs text-primary-600 font-medium">Master Every Move</span>
            </div>
          </Link>

          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="header-nav-link">
              Dashboard
            </Link>
            <Link to="/puzzles" className="header-nav-link">
              Puzzles
            </Link>
            <Link to="/history" className="header-nav-link">
              History
            </Link>
            <Link to="/stats" className="header-nav-link">
              Stats
            </Link>

            {user ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l-2 border-gray-200">
                <div className="flex items-center space-x-2 bg-primary-50 px-3 py-1.5 rounded-full">
                  <span className="text-sm font-medium text-chess-dark">
                    {user.displayName}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn-primary text-sm">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary ml-4">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
