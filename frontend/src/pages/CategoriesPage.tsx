import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { puzzlesApi } from '@services/api';

interface Theme {
  name: string;
  count: number;
}

interface Opening {
  name: string;
  count: number;
}

export function CategoriesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [themesData, openingsData] = await Promise.all([
          puzzlesApi.getThemes(),
          puzzlesApi.getOpenings(),
        ]);
        setThemes(themesData);
        setOpenings(openingsData);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError('Failed to load puzzle categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Helper function to format theme names (convert camelCase to Title Case)
  const formatThemeName = (theme: string): string => {
    return theme
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Helper function to format opening names (replace underscores with spaces)
  const formatOpeningName = (opening: string): string => {
    return opening.replace(/_/g, ' ');
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8">Puzzle Categories</h1>
        <div className="card">
          <p className="text-center py-8 text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-8">Puzzle Categories</h1>
        <div className="card">
          <p className="text-center py-8 text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8">Puzzle Categories</h1>

      <div className="mb-12">
        <h2 className="mb-6">Browse by Theme</h2>
        {themes.length === 0 ? (
          <div className="card">
            <p className="text-center py-8 text-gray-500">No themes available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map((theme) => (
              <Link
                key={theme.name}
                to={`/puzzles/theme/${theme.name}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="mb-2">{formatThemeName(theme.name)}</h3>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{theme.count} puzzles</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-6">Browse by Opening</h2>
        {openings.length === 0 ? (
          <div className="card">
            <p className="text-center py-8 text-gray-500">No openings available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openings.map((opening) => (
              <Link
                key={opening.name}
                to={`/puzzles/opening/${opening.name.toLowerCase()}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="mb-2">{formatOpeningName(opening.name)}</h3>
                <p className="text-sm text-gray-600">{opening.count} puzzles</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
