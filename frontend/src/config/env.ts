// Configuración de variables de entorno para Telcox
export const config = {
  // API de Telcox
  TELCOX_API_URL: import.meta.env.VITE_TELCOX_API_URL || 'http://localhost:8000',
  
  // Configuración de la aplicación
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Telcox Consumo',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Configuración de autenticación
  AUTH_STORAGE_KEY: 'telcox-auth-storage',
  
  // Configuración de paginación por defecto
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export default config;
