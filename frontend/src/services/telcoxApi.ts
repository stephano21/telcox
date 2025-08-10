import axios from 'axios';
import localforage from 'localforage';
import { config } from '../config/env';

// Configuración base de axios para Telcox
const telcoxApi = axios.create({
  baseURL: config.TELCOX_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener el token del localforage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const authStorage = await localforage.getItem(config.AUTH_STORAGE_KEY);
    if (authStorage) {
      const authData = authStorage as any;
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
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
telcoxApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      console.log('Token expirado o inválido');
      localforage.removeItem(config.AUTH_STORAGE_KEY);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// TIPOS DE DATOS PARA TELCOX
// ============================================================================

// Tipos para autenticación
export interface TelcoxLoginRequest {
  email: string;
  password: string;
}

export interface TelcoxLoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: TelcoxClienteResponse;
}

export interface TelcoxRegisterRequest {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
}

// Tipos para Cliente
export interface TelcoxClienteResponse {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  plan_actual: string;
  estado_cuenta: string;
  created_at: string;
  updated_at: string | null;
}

// Tipos para Plan
export interface TelcoxPlanResponse {
  id: string;
  nombre: string;
  descripcion: string;
  precio_mensual: number;
  datos_incluidos: number;
  minutos_incluidos: number;
  sms_incluidos: number;
  velocidad_maxima: number;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
}

// Tipos para Consumo
export interface TelcoxConsumoResponse {
  id: string;
  servicio: string;
  cantidad: number;
  unidad: string;
  fecha: string;
  cliente_id: string;
  tipo_consumo: string;
  costo_unitario: number;
  costo_total: number;
  created_at: string;
  updated_at: string | null;
}

// Tipos para Factura
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

// Tipos para Saldo
export interface TelcoxSaldoResponse {
  id: string;
  cliente_id: string;
  saldo_actual: number;
  limite_credito: number;
  saldo_disponible: number;
  moneda: string;
  fecha_ultima_actualizacion: string;
  created_at: string;
  updated_at: string | null;
}

// Tipos para Dashboard
export interface TelcoxDashboardResumen {
  cliente: TelcoxClienteResponse;
  saldo: TelcoxSaldoResponse;
  consumo_mes_actual: number;
  consumo_mes_anterior: number;
  facturas_pendientes: number;
  facturas_vencidas: number;
  total_facturas: number;
}

export interface TelcoxConsumoGrafico {
  fecha: string;
  datos: number;
  minutos: number;
  sms: number;
  costo: number;
}

export interface TelcoxDashboardGraficos {
  consumo_diario: TelcoxConsumoGrafico[];
  consumo_mensual: TelcoxConsumoGrafico[];
  facturacion_mensual: any[];
}

// Tipos para paginación
export interface TelcoxPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ============================================================================
// SERVICIOS DE AUTENTICACIÓN
// ============================================================================

export const telcoxAuthService = {
  // Login de usuario
  login: async (credentials: TelcoxLoginRequest): Promise<TelcoxLoginResponse> => {
    const response = await telcoxApi.post<TelcoxLoginResponse>('/auth/login', credentials);
    return response.data;
  },

  // Registro de usuario
  register: async (userData: TelcoxRegisterRequest): Promise<TelcoxClienteResponse> => {
    const response = await telcoxApi.post<TelcoxClienteResponse>('/auth/register', userData);
    return response.data;
  },
};

// ============================================================================
// SERVICIOS DE PLANES
// ============================================================================

export const telcoxPlanService = {
  // Obtener todos los planes
  getAll: async (): Promise<TelcoxPlanResponse[]> => {
    const response = await telcoxApi.get<TelcoxPlanResponse[]>('/planes');
    return response.data;
  },
};

// ============================================================================
// SERVICIOS DE CONSUMOS
// ============================================================================

export const telcoxConsumoService = {
  // Obtener consumos del usuario
  getUserConsumos: async (
    page: number = 1,
    size: number = 20,
    servicio?: string,
    fecha_inicio?: string,
    fecha_fin?: string
  ): Promise<TelcoxPaginatedResponse<TelcoxConsumoResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (servicio) params.append('servicio', servicio);
    if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
    if (fecha_fin) params.append('fecha_fin', fecha_fin);
    
    const response = await telcoxApi.get<TelcoxPaginatedResponse<TelcoxConsumoResponse>>(`/consumos?${params}`);
    return response.data;
  },

  // Crear nuevo consumo
  create: async (consumoData: any): Promise<TelcoxConsumoResponse> => {
    const response = await telcoxApi.post<TelcoxConsumoResponse>('/consumos', consumoData);
    return response.data;
  },
};

// ============================================================================
// SERVICIOS DE FACTURAS
// ============================================================================

export const telcoxFacturaService = {
  // Obtener facturas del usuario
  getUserFacturas: async (
    page: number = 1,
    size: number = 20,
    estado?: string
  ): Promise<TelcoxPaginatedResponse<TelcoxFacturaResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (estado) params.append('estado', estado);
    
    const response = await telcoxApi.get<TelcoxPaginatedResponse<TelcoxFacturaResponse>>(`/facturas?${params}`);
    return response.data;
  },
};

// ============================================================================
// SERVICIOS DE SALDO
// ============================================================================

export const telcoxSaldoService = {
  // Obtener saldo del usuario
  getUserSaldo: async (): Promise<TelcoxSaldoResponse> => {
    const response = await telcoxApi.get<TelcoxSaldoResponse>('/saldo');
    return response.data;
  },
};

// ============================================================================
// SERVICIOS DE DASHBOARD
// ============================================================================

export const telcoxDashboardService = {
  // Obtener resumen del dashboard
  getResumen: async (): Promise<TelcoxDashboardResumen> => {
    const response = await telcoxApi.get<TelcoxDashboardResumen>('/dashboard/resumen');
    return response.data;
  },

  // Obtener gráficos del dashboard
  getGraficos: async (dias: number = 7, meses: number = 6): Promise<TelcoxDashboardGraficos> => {
    const params = new URLSearchParams({
      dias: dias.toString(),
      meses: meses.toString(),
    });
    
    const response = await telcoxApi.get<TelcoxDashboardGraficos>(`/dashboard/graficos?${params}`);
    return response.data;
  },
};

// ============================================================================
// SERVICIOS GENERALES
// ============================================================================

export const telcoxGeneralService = {
  // Verificar salud de la API
  healthCheck: async (): Promise<any> => {
    const response = await telcoxApi.get('/health');
    return response.data;
  },

  // Obtener información de la API
  getApiInfo: async (): Promise<any> => {
    const response = await telcoxApi.get('/');
    return response.data;
  },
};

export default telcoxApi;
