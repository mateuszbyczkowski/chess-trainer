import { Link } from 'react-router-dom';

const MOCK_THEMES = [
  { id: 'fork', name: 'Fork', count: 234, accuracy: 68 },
  { id: 'pin', name: 'Pin', count: 189, accuracy: 72 },
  { id: 'discoveredAttack', name: 'Discovered Attack', count: 98, accuracy: 59 },
  { id: 'sacrifice', name: 'Sacrifice', count: 156, accuracy: 63 },
  { id: 'mate', name: 'Checkmate', count: 145, accuracy: 65 },
  { id: 'endgame', name: 'Endgame', count: 120, accuracy: 71 },
];

const MOCK_OPENINGS = [
  { name: 'Sicilian Defense', count: 456 },
  { name: 'Ruy Lopez', count: 392 },
  { name: 'French Defense', count: 287 },
  { name: 'Italian Game', count: 245 },
];

export function CategoriesPage() {
  return (
    <div>
      <h1 className="mb-8">Puzzle Categories</h1>

      <div className="mb-12">
        <h2 className="mb-6">Browse by Theme</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_THEMES.map((theme) => (
            <Link
              key={theme.id}
              to={`/puzzles/theme/${theme.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <h3 className="mb-2">{theme.name}</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{theme.count} puzzles</span>
                {theme.accuracy && <span>{theme.accuracy}% accuracy</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-6">Browse by Opening</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_OPENINGS.map((opening) => (
            <Link
              key={opening.name}
              to={`/puzzles/opening/${opening.name.toLowerCase()}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <h3 className="mb-2">{opening.name}</h3>
              <p className="text-sm text-gray-600">{opening.count} puzzles</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
