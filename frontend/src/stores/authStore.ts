import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import localforage from 'localforage';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  lastPrivateRoute: string | null;
  login: (user: any) => void;
  logout: () => void;
  setLastPrivateRoute: (route: string) => void;
  clearLastPrivateRoute: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      lastPrivateRoute: null,
      login: (user: any) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, lastPrivateRoute: null }),
      setLastPrivateRoute: (route: string) => set({ lastPrivateRoute: route }),
      clearLastPrivateRoute: () => set({ lastPrivateRoute: null }),
    }),
    {
      name: 'auth-storage',
      storage: localforage as any,
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, lastPrivateRoute: state.lastPrivateRoute }),
    }
  )
); 