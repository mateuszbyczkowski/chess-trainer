import { Link } from 'react-router-dom';

export function Header() {
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

            <button className="btn-primary">
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
