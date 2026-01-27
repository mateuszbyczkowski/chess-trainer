# Chess Trainer Frontend

React + Refine frontend for the Chess Trainer application.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ LTS
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/      # React components
│   ├── auth/       # Authentication components
│   ├── chess/      # Chess board components
│   ├── puzzles/    # Puzzle-related components
│   ├── stats/      # Statistics components
│   ├── training/   # Training session components
│   ├── history/    # History components
│   └── layout/     # Layout components (Header, etc.)
├── pages/          # Page components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── PuzzleSolvePage.tsx
│   ├── CategoriesPage.tsx
│   ├── HistoryPage.tsx
│   └── StatsPage.tsx
├── hooks/          # Custom React hooks
├── services/       # API service functions
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── styles/         # CSS files (Tailwind)
└── App.tsx         # Main app component
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests with Vitest |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |

## 🎨 Technologies

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Refine** - React framework for CRUD applications
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **react-chessboard** - Chess board UI
- **chess.js** - Chess game logic
- **TypeScript** - Type safety

## 🧩 Key Components

### Chess Board
The puzzle solving interface uses `react-chessboard` for the visual board and `chess.js` for game logic and move validation.

```tsx
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
```

### Refine Data Provider
Refine handles API calls, state management, and caching via React Query.

```tsx
import dataProvider from '@refinedev/simple-rest';
const API_URL = 'http://localhost:3000/api';
```

## 🎨 Styling with Tailwind

We use Tailwind CSS for styling. Custom classes are defined in `src/styles/index.css`:

- `.btn`, `.btn-primary`, `.btn-secondary` - Button styles
- `.card` - Card container
- `.input` - Form input

### Color Palette

- **Primary:** Blue shades (chess-themed)
- **Chess Board:** Light `#f0d9b5` and Dark `#b58863`
- **Background:** Gray shades

## 📱 Pages

### Login Page (`/login`)
- Lichess OAuth login
- Google OAuth login
- Guest mode

### Dashboard (`/dashboard`)
- Overview statistics
- Puzzle of the Day
- Quick actions

### Puzzle Solve (`/puzzles/solve/:id`)
- Interactive chess board
- Move validation
- Puzzle info sidebar

### Categories (`/puzzles`)
- Browse by theme
- Browse by opening

### History (`/history`)
- List of past attempts
- Filtering options
- Retry puzzles

### Statistics (`/stats`)
- Overall stats
- Performance charts
- Theme-based analytics

## 🔌 API Integration

API calls are handled by Refine's data provider. Custom API functions can be added in `src/services/`:

```tsx
// Example: src/services/puzzleService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const puzzleService = {
  getRandomPuzzle: async () => {
    const { data } = await axios.get(`${API_URL}/puzzles/random`);
    return data;
  },
};
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests with coverage
npm run test -- --coverage
```

## 🐛 Troubleshooting

### Port 5173 Already in Use
```bash
# Change port in vite.config.ts
server: {
  port: 3001,
}
```

### API Connection Issues
- Ensure backend is running on `http://localhost:3000`
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors

### Hot Reload Not Working
- Restart dev server: `npm run dev`
- Clear Vite cache: `rm -rf node_modules/.vite`

## 🚀 Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

The build output will be in `dist/` directory.

---

**Last Updated:** 2026-01-26
