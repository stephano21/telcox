import axios from 'axios';
import * as localforage from 'localforage';

// Configuración base de axios para Telcox
const telcoxApi = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener el token del localforage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const authStorage = await localforage.getItem('telcox-auth-storage');
    if (authStorage) {
      const authData = authStorage as any;
      // Buscar el token en la estructura correcta según TelcoxLogin.tsx
      const token = authData.state?.user?.auth?.access_token || null;
      return token;
    }
  } catch (error) {
    console.error('Error obteniendo token:', error);
  }
  return null;
};

// Interceptor para agregar el token automáticamente a todas las peticiones
telcoxApi.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token agregado al header:', token.substring(0, 20) + '...');
    } else {
      console.log('No se agregó token al header - Token no encontrado');
      // Debug: mostrar la estructura del almacenamiento
      try {
        const authStorage = await localforage.getItem('telcox-auth-storage');
        console.log('Estructura del almacenamiento:', authStorage);
      } catch (error) {
        console.error('Error accediendo al almacenamiento:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Función de utilidad para manejar errores de autenticación
export const handleAuthError = async (error: any, retryCount: number = 0): Promise<boolean> => {
  if (error.response?.status === 401) {
    console.log(`Error 401 detectado - Intento ${retryCount + 1}`);
    
    // Si es el primer error 401, solo loguear
    if (retryCount === 0) {
      console.warn('Primer error 401 detectado. El token puede estar expirado.');
      return false; // No reintentar automáticamente
    }
    
    // Si es el segundo error 401, sugerir logout
    if (retryCount === 1) {
      console.warn('Segundo error 401 consecutivo. Se recomienda cerrar sesión.');
      return false; // No reintentar automáticamente
    }
    
    // Si es el tercer error 401, forzar logout
    if (retryCount >= 2) {
      console.error('Múltiples errores 401 consecutivos. Forzando logout por seguridad.');
      await localforage.removeItem('telcox-auth-storage');
      return true; // Indicar que se debe redirigir al login
    }
  }
  
  return false; // No es un error de autenticación o no requiere acción
};

// Interceptor para manejar errores de respuesta
telcoxApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo manejar 401 si no estamos en login
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      console.log('Token expirado o inválido - Error 401 detectado');
      
      // En lugar de eliminar inmediatamente el token, solo loguear el error
      // El usuario puede decidir si quiere hacer logout manualmente
      console.warn('Se detectó un error 401. El token puede estar expirado o ser inválido.');
      console.warn('El usuario debe decidir si quiere cerrar sesión manualmente.');
      
      // No eliminar automáticamente el token para evitar logout arbitrario
      // localforage.removeItem('telcox-auth-storage');
    }
    return Promise.reject(error);
  }
);

// Tipos para la API de Telcox
export interface TelcoxUser {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  plan_actual: string;
  estado_cuenta: string;
  created_at: string;
  updated_at: string | null;
}

export interface TelcoxUserCreate {
  nombre: string;
  email: string;
  telefono: string;
  plan_actual: string;
  password: string;
}

export interface TelcoxUserUpdate {
  nombre?: string;
  email?: string;
  telefono?: string;
  plan_actual?: string;
  estado_cuenta?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface TelcoxLoginRequest {
  email: string;
  password: string;
}

export interface TelcoxLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: TelcoxUser;
}

// Tipos adicionales para Consumo
export interface TelcoxSaldoResponse {
  saldo_actual: number;
  saldo_disponible: number;
  saldo_reservado: number;
  moneda: string;
  ultima_actualizacion: string;
}

export interface TelcoxConsumoResponse {
  id: string;
  servicio: string;
  descripcion: string;
  monto: number;
  fecha: string;
  tipo_consumo: string;
  estado: string;
  cantidad: number;
  unidad: string;
  costo_total: number;
}

export interface TelcoxDashboardResumen {
  total_consumos: number;
  total_monto: number;
  consumos_hoy: number;
  monto_hoy: number;
  consumos_mes: number;
  monto_mes: number;
  consumo_mes_actual: number;
  facturas_pendientes: number;
  cliente: {
    nombre: string;
    plan_actual: string;
    estado_cuenta: string;
  };
}

export interface TelcoxConsumoGrafico {
  fecha: string;
  monto: number;
  cantidad: number;
  datos: number;
  minutos: number;
}

// Servicios de Telcox
export const telcoxService = {
  // Login
  login: async (credentials: TelcoxLoginRequest): Promise<TelcoxLoginResponse> => {
    const response = await telcoxApi.post<TelcoxLoginResponse>('/auth/login', credentials);
    return response.data;
  },

  // Obtener usuarios paginados
  getUsers: async (
    page: number = 1,
    size: number = 20,
    search?: string,
    estado?: string
  ): Promise<PaginatedResponse<TelcoxUser>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (estado) params.append('estado', estado);

    const response = await telcoxApi.get<PaginatedResponse<TelcoxUser>>(`/admin/users?${params.toString()}`);
    return response.data;
  },

  // Obtener un usuario específico
  getUser: async (userId: string): Promise<TelcoxUser> => {
    const response = await telcoxApi.get<TelcoxUser>(`/admin/users/${userId}`);
    return response.data;
  },

  // Crear un nuevo usuario
  createUser: async (userData: TelcoxUserCreate): Promise<TelcoxUser> => {
    const response = await telcoxApi.post<TelcoxUser>('/admin/users', userData);
    return response.data;
  },

  // Actualizar un usuario
  updateUser: async (userId: string, userData: TelcoxUserUpdate): Promise<TelcoxUser> => {
    const response = await telcoxApi.put<TelcoxUser>(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // Eliminar un usuario
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await telcoxApi.delete<{ message: string }>(`/admin/users/${userId}`);
    return response.data;
  },

  // Obtener planes disponibles
  getPlans: async (): Promise<any[]> => {
    const response = await telcoxApi.get<any[]>('/planes');
    return response.data;
  },
};

// Servicios adicionales para Consumo
export const telcoxSaldoService = {
  getUserSaldo: async (): Promise<TelcoxSaldoResponse> => {
    const response = await telcoxApi.get<TelcoxSaldoResponse>('/user/saldo');
    return response.data;
  },
};

export const telcoxConsumoService = {
  getUserConsumos: async (
    page: number = 1,
    size: number = 20,
    servicio?: string,
    fecha_inicio?: string,
    fecha_fin?: string
  ): Promise<PaginatedResponse<TelcoxConsumoResponse>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (servicio && servicio !== 'todos') params.append('servicio', servicio);
    if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) params.append('fecha_fin', fecha_fin);

    const response = await telcoxApi.get<PaginatedResponse<TelcoxConsumoResponse>>(`/user/consumos?${params.toString()}`);
    return response.data;
  },

  getConsumoResumen: async (): Promise<TelcoxDashboardResumen> => {
    const response = await telcoxApi.get<TelcoxDashboardResumen>('/user/consumos/resumen');
    return response.data;
  },

  getConsumoGrafico: async (
    fecha_inicio?: string,
    fecha_fin?: string
  ): Promise<TelcoxConsumoGrafico[]> => {
    const params = new URLSearchParams();
    if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) params.append('fecha_fin', fecha_fin);

    const response = await telcoxApi.get<TelcoxConsumoGrafico[]>(`/user/consumos/grafico?${params.toString()}`);
    return response.data;
  },
};

export const telcoxDashboardService = {
  getDashboardData: async (): Promise<{
    resumen: TelcoxDashboardResumen;
    graficos: TelcoxConsumoGrafico[];
  }> => {
    const [resumen, graficos] = await Promise.all([
      telcoxConsumoService.getConsumoResumen(),
      telcoxConsumoService.getConsumoGrafico()
    ]);
    
    return { resumen, graficos };
  },
};

// Servicios adicionales para Facturas
export interface TelcoxFacturaResponse {
  id: string;
  numero_factura: string;
  monto_total: number;
  monto_subtotal: number;
  impuestos: number;
  descuentos: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: string;
  metodo_pago: string;
  fecha_pago: string | null;
  cliente_id: string;
  created_at: string;
  updated_at: string | null;
}

export const telcoxFacturaService = {
  getUserFacturas: async (
    page: number = 1,
    size: number = 20,
    estado?: string
  ): Promise<PaginatedResponse<TelcoxFacturaResponse>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (estado) params.append('estado', estado);

    const response = await telcoxApi.get<PaginatedResponse<TelcoxFacturaResponse>>(`/facturas?${params.toString()}`);
    return response.data;
  },

  getFacturasPagadas: async (
    page: number = 1,
    size: number = 20
  ): Promise<PaginatedResponse<TelcoxFacturaResponse>> => {
    return telcoxFacturaService.getUserFacturas(page, size, 'pagada');
  },
};

export default telcoxApi;
