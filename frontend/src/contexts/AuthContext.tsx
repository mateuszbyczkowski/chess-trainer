import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '@services/api';
import { guestStorage } from '@services/guestStorage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (type: 'guest' | 'lichess' | 'google') => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticatedUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);

          // Check if it's a local guest or authenticated user
          if (guestStorage.isLocalGuest(parsedUser)) {
            // Local guest - no token needed
            setUser(parsedUser);
          } else {
            // Authenticated user - check for token
            const token = localStorage.getItem('accessToken');
            if (token) {
              setUser(parsedUser);
            } else {
              // Token missing for authenticated user
              localStorage.removeItem('user');
            }
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (type: 'guest' | 'lichess' | 'google') => {
    try {
      if (type === 'guest') {
        // Create local-only guest (no backend call)
        const localGuest = guestStorage.createGuestUser();
        localStorage.setItem('user', JSON.stringify(localGuest));
        setUser(localGuest);
      } else if (type === 'lichess') {
        await authApi.lichessLogin();
      } else if (type === 'google') {
        await authApi.googleLogin();
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // If local guest, just clear localStorage
      if (user && guestStorage.isLocalGuest(user)) {
        guestStorage.clearAll();
        localStorage.removeItem('user');
        setUser(null);
      } else {
        // For authenticated users, call backend
        await authApi.logout();
        setUser(null);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const setAuthenticatedUser = (user: User) => {
    setUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        setAuthenticatedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
