import axios, { AxiosInstance, AxiosError } from 'axios';
import { guestStorage } from './guestStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3009/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  displayName: string;
  lichessId?: string | null;
  googleId?: string | null;
  isGuest: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Puzzle {
  id: string;
  lichessPuzzleId: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
  openingTags: string[];
  popularity: number;
  gameUrl?: string | null;
}

export interface PuzzleAttempt {
  id: string;
  userId: string;
  puzzleId: string;
  solved: boolean;
  timeSpentSeconds: number;
  moves: string[];
  attemptedAt: string;
}

export interface UserStats {
  totalAttempts: number;
  totalSolved: number;
  accuracy: number;
  averageTimeSeconds: number;
  currentStreak: number;
  longestStreak: number;
  solvedToday: number;
  solvedThisWeek: number;
  solvedThisMonth: number;
}

// Auth API
export const authApi = {
  guestLogin: async (): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/guest');
    return data;
  },

  lichessLogin: async (): Promise<void> => {
    window.location.href = `${API_URL}/auth/lichess`;
  },

  googleLogin: async (): Promise<void> => {
    window.location.href = `${API_URL}/auth/google`;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },
};

// Puzzles API
export const puzzlesApi = {
  getRandom: async (options?: {
    minRating?: number;
    maxRating?: number;
    themes?: string[];
  }): Promise<Puzzle> => {
    const { data } = await apiClient.get<Puzzle>('/puzzles/random', {
      params: options,
    });
    return data;
  },

  getById: async (id: string): Promise<Puzzle> => {
    const { data } = await apiClient.get<Puzzle>(`/puzzles/${id}`);
    return data;
  },

  getDaily: async (): Promise<Puzzle> => {
    const { data } = await apiClient.get<Puzzle>('/puzzles/daily');
    return data;
  },

  getThemes: async (): Promise<{ name: string; count: number }[]> => {
    const { data } = await apiClient.get('/puzzles/categories/themes');
    return data;
  },

  getOpenings: async (): Promise<{ name: string; count: number }[]> => {
    const { data } = await apiClient.get('/puzzles/categories/openings');
    return data;
  },
};

// Attempts API
export const attemptsApi = {
  submit: async (
    puzzleId: string,
    solved: boolean,
    timeSpent: number,
    movesMade: string
  ): Promise<PuzzleAttempt> => {
    // Check if current user is a local guest
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user && guestStorage.isLocalGuest(user)) {
      // Save to localStorage for local guests
      const guestAttempt = guestStorage.saveAttempt({
        puzzleId,
        solved,
        moves: movesMade.split(' '),
        timeSpent,
      });

      // Convert to PuzzleAttempt format
      return {
        id: guestAttempt.id,
        userId: user.id,
        puzzleId: guestAttempt.puzzleId,
        solved: guestAttempt.solved,
        timeSpentSeconds: guestAttempt.timeSpent,
        moves: guestAttempt.moves,
        attemptedAt: guestAttempt.attemptedAt,
      };
    }

    // For authenticated users, save to backend
    const { data } = await apiClient.post<PuzzleAttempt>('/attempts', {
      puzzleId,
      solved,
      timeSpent,
      movesMade,
    });
    return data;
  },

  getUserHistory: async (
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: PuzzleAttempt[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    // Check if current user is a local guest
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user && guestStorage.isLocalGuest(user)) {
      // Get from localStorage for local guests
      const guestAttempts = guestStorage.getAttempts();

      // Sort by date (newest first)
      const sorted = [...guestAttempts].sort(
        (a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
      );

      // Paginate
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedAttempts = sorted.slice(start, end);

      // Convert to PuzzleAttempt format
      const data: PuzzleAttempt[] = paginatedAttempts.map((attempt) => ({
        id: attempt.id,
        userId: user.id,
        puzzleId: attempt.puzzleId,
        solved: attempt.solved,
        timeSpentSeconds: attempt.timeSpent,
        moves: attempt.moves,
        attemptedAt: attempt.attemptedAt,
      }));

      return {
        data,
        total: guestAttempts.length,
        page,
        totalPages: Math.ceil(guestAttempts.length / limit),
      };
    }

    // For authenticated users, fetch from backend
    const { data } = await apiClient.get('/attempts/history', {
      params: { page, limit },
    });
    return data;
  },
};

// Stats API
export const statsApi = {
  getUserStats: async (): Promise<UserStats> => {
    // Check if current user is a local guest
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user && guestStorage.isLocalGuest(user)) {
      // Get stats from localStorage for local guests
      const stats = guestStorage.getStats();
      return {
        totalAttempts: stats.totalAttempts,
        totalSolved: stats.totalSolved,
        accuracy: stats.successRate,
        averageTimeSeconds: stats.averageTimeSeconds,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        solvedToday: stats.solvedToday,
        solvedThisWeek: stats.solvedThisWeek,
        solvedThisMonth: stats.solvedThisMonth,
      };
    }

    // For authenticated users, fetch from backend
    const { data } = await apiClient.get('/stats/overview');
    // Map backend response to frontend interface
    return {
      totalAttempts: data.totalAttempts || 0,
      totalSolved: data.totalSolved || 0,
      accuracy: data.accuracy || 0,
      averageTimeSeconds: data.averageTimeSeconds || 0,
      currentStreak: data.currentStreak || 0,
      longestStreak: data.longestStreak || 0,
      solvedToday: data.solvedToday || 0,
      solvedThisWeek: data.solvedThisWeek || 0,
      solvedThisMonth: data.solvedThisMonth || 0,
    };
  },

  getThemeStats: async (): Promise<
    { theme: string; attempted: number; solved: number; successRate: number }[]
  > => {
    // Check if current user is a local guest
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user && guestStorage.isLocalGuest(user)) {
      // Return empty array for local guests (theme stats not tracked in localStorage)
      return [];
    }

    // For authenticated users, fetch from backend
    const { data } = await apiClient.get('/stats/by-theme');
    return data;
  },

  getRatingProgress: async (): Promise<
    { date: string; averageRating: number }[]
  > => {
    // Check if current user is a local guest
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (user && guestStorage.isLocalGuest(user)) {
      // Return empty array for local guests (rating progress not tracked in localStorage)
      return [];
    }

    // For authenticated users, fetch from backend
    const { data } = await apiClient.get('/stats/rating-progress');
    return data;
  },
};

export default apiClient;
