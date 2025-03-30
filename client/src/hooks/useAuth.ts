import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  isAuthenticated?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, email?: string, name?: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await apiRequest<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
          });

          if (response && response.success && response.user) {
            set({ user: response.user, isAuthenticated: true, isLoading: false });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      signup: async (username, password, email, name) => {
        set({ isLoading: true });
        try {
          const response = await apiRequest<AuthResponse>('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password, email, name }),
          });

          if (response && response.success && response.user) {
            set({ user: response.user, isAuthenticated: true, isLoading: false });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiRequest<AuthResponse>('/api/auth/logout', { 
            method: 'POST'
          });
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      checkAuthStatus: async () => {
        set({ isLoading: true });
        try {
          const response = await apiRequest<AuthResponse>('/api/auth/status');
          
          if (response && response.isAuthenticated && response.user) {
            set({ user: response.user, isAuthenticated: true, isLoading: false });
            return true;
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return false;
          }
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);