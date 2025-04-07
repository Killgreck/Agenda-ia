import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  birthdate?: string | null;
  timezone?: string | null;
  profilePicture?: string | null;
  darkMode?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  calendarIntegration?: string | null;
  language?: string | null;
  lastLogin?: string | null;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  isAuthenticated?: boolean;
}

interface UpdateProfileData {
  email?: string;
  phoneNumber?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  company?: string;
  jobTitle?: string;
  bio?: string;
  birthdate?: string;
  timezone?: string;
  profilePicture?: string;
  darkMode?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  calendarIntegration?: string;
  language?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, email?: string, name?: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
  updateProfile: (data: UpdateProfileData) => Promise<boolean>;
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
      
      updateProfile: async (data: UpdateProfileData) => {
        set({ isLoading: true });
        try {
          const response = await apiRequest<AuthResponse>('/api/user/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
          });

          if (response && response.success && response.user) {
            set({ user: response.user, isLoading: false });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('Profile update error:', error);
          set({ isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      storage: createJSONStorage(() => {
        return {
          getItem: (name) => {
            try {
              const value = localStorage.getItem(name);
              return value ? JSON.parse(value) : null;
            } catch (error) {
              console.error('Error reading from localStorage:', error);
              return null;
            }
          },
          setItem: (name, value) => {
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              console.error('Error writing to localStorage:', error);
              // Silently fail but log the error
            }
          },
          removeItem: (name) => {
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.error('Error removing from localStorage:', error);
              // Silently fail but log the error
            }
          }
        };
      })
    }
  )
);