import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { telcoxService, type TelcoxLoginRequest, type TelcoxLoginResponse, type TelcoxUser } from '../services/telcoxApi';
import { config } from '../config/env';

interface TelcoxAuthState {
  // Estado de autenticación
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Datos del usuario
  user: TelcoxUser | null;
  token: string | null;
  
  // Acciones
  login: (credentials: TelcoxLoginRequest) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => void;
}

export const useTelcoxAuthStore = create<TelcoxAuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      token: null,

      // Login
      login: async (credentials: TelcoxLoginRequest): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const response: TelcoxLoginResponse = await telcoxService.login(credentials);
          
          set({
            isAuthenticated: true,
            user: response.user,
            token: response.access_token,
            isLoading: false,
            error: null,
          });
          
          return true;
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Error en el inicio de sesión';
          set({
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          return false;
        }
      },

      // Logout
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
        });
      },

      // Limpiar error
      clearError: () => {
        set({ error: null });
      },

      // Verificar autenticación
      checkAuth: () => {
        const { token, user } = get();
        if (token && user) {
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false });
        }
      },
    }),
    {
      name: config.AUTH_STORAGE_KEY,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);

export default useTelcoxAuthStore;
