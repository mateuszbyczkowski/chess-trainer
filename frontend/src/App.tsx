import { Refine } from '@refinedev/core';
import routerBindings, {
  NavigateToResource,
  UnsavedChangesNotifier,
} from '@refinedev/react-router-v6';
import dataProvider from '@refinedev/simple-rest';
import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom';

// Pages
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { PuzzleSolvePage } from '@pages/PuzzleSolvePage';
import { CategoriesPage } from '@pages/CategoriesPage';
import { HistoryPage } from '@pages/HistoryPage';
import { StatsPage } from '@pages/StatsPage';

// Components
import { Layout } from '@components/layout/Layout';
import { AuthProvider } from '@contexts/AuthContext';
import { ProtectedRoute } from '@components/ProtectedRoute';
import { migrateGuestData } from '@services/migrateGuestData';

// Run guest data migration on app load
migrateGuestData();

// Auth provider for Refine
const authProvider = {
  login: async () => {
    // Login is handled by AuthContext and LoginPage
    return { success: true };
  },
  logout: async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return { success: true, redirectTo: '/login' };
  },
  check: async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      return { authenticated: true };
    }
    return { authenticated: false, redirectTo: '/login' };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id,
        name: user.displayName,
        avatar: null,
      };
    }
    return null;
  },
  onError: async (error: Error) => {
    if ((error as { response?: { status?: number } })?.response?.status === 401) {
      return { logout: true };
    }
    return { error };
  },
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009/api';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Refine
          dataProvider={dataProvider(API_URL)}
          authProvider={authProvider}
          routerProvider={routerBindings}
          resources={[
            {
              name: 'dashboard',
              list: '/dashboard',
            },
            {
              name: 'puzzles',
              list: '/puzzles',
            },
            {
              name: 'history',
              list: '/history',
            },
            {
              name: 'stats',
              list: '/stats',
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <Outlet />
                  </Layout>
                </ProtectedRoute>
              }
            >
              <Route index element={<NavigateToResource resource="dashboard" />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/puzzles">
                <Route index element={<CategoriesPage />} />
                <Route path="solve/:id" element={<PuzzleSolvePage />} />
                <Route path="daily" element={<PuzzleSolvePage />} />
                <Route path="random" element={<PuzzleSolvePage />} />
                <Route path="theme/:theme" element={<PuzzleSolvePage />} />
                <Route path="opening/:opening" element={<PuzzleSolvePage />} />
              </Route>
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/stats" element={<StatsPage />} />
            </Route>
          </Routes>

          <UnsavedChangesNotifier />
        </Refine>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
