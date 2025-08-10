import axios from 'axios';
import * as localforage from 'localforage';

// Configuración base de axios
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para obtener el token del localforage
const getAuthToken = async (): Promise<string | null> => {
  try {
    const authStorage = await localforage.getItem('auth-storage');
    if (authStorage) {
      const authData = authStorage as any;
      const token = authData.state?.user?.auth?.access_Token || null;
      return token;
    }
  } catch (error) {
  }
  return null;
};

// Interceptor para agregar el token automáticamente a todas las peticiones
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No se agregó token al header');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo manejar 401 si no estamos en login
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      console.log('Token expirado o inválido');
      localforage.removeItem('auth-storage');
      // No redirigir automáticamente para evitar ciclos
    }
    return Promise.reject(error);
  }
);

// Tipos para la API
export interface LoginRequest {
  username: string;
  password: string;
}

export interface ConfirmEmailRequest {
  userId: string;
  code: string;
}

export interface LoginResponse {
  auth: {
    access_Token: string;
    refresh_Token: string;
  };
  username: string;
  fullName: string;
  role: string;
  expiracion: string;
  env: string;
  hacienda: string;
}

// Tipos para el perfil de usuario
export interface UserProfile {
  email: string;
  userName: string;
  hacienda: string;
  firstName: string;
  lastName: string;
  cedula: string;
  salario: number | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  cedula: string;
  salario: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Tipos para Plagas
export interface Plaga {
  id?: number;
  nombre: string;
  descripcion: string;
}

export interface CreatePlagaRequest {
  id?: number;
  nombre: string;
  descripcion: string;
}

// Servicios de autenticación
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/Profile');
    return response.data;
  },

  updateProfile: async (profile: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put<UserProfile>('/auth/profile', profile);
    return response.data;
  },

  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    await api.put('/auth/change-password', passwordData);
  },

  confirmEmail: async (data: ConfirmEmailRequest): Promise<void> => {
    await api.get('/auth/ConfirmEmail', { params: data });
  },
};

// Servicios de Plagas
export const plagaService = {
  // Obtener todas las plagas
  getAll: async (): Promise<Plaga[]> => {
    const response = await api.get<Plaga[]>('/plaga');
    return response.data;
  },

  // Crear una nueva plaga
  create: async (plaga: CreatePlagaRequest): Promise<Plaga> => {
    const response = await api.post<Plaga>('/plaga', plaga);
    return response.data;
  },

  // Actualizar una plaga
  update: async (id: number, plaga: CreatePlagaRequest): Promise<Plaga> => {
    const response = await api.put<Plaga>('/plaga', { id, ...plaga });
    return response.data;
  },

  // Eliminar una plaga
  delete: async (id: number): Promise<void> => {
    await api.delete(`/plaga/${id}`);
  },
};

// Tipos para Insumos
export interface Insumo {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  stock: number;
  costo: number;
}

export interface CreateInsumoRequest {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  stock: number;
  costo: number;
}

// Servicios de Insumos
export const insumoService = {
  // Obtener todos los insumos
  getAll: async (): Promise<Insumo[]> => {
    const response = await api.get<Insumo[]>('/insumo');
    return response.data;
  },

  // Crear un nuevo insumo
  create: async (insumo: CreateInsumoRequest): Promise<Insumo> => {
    const response = await api.post<Insumo>('/insumo', insumo);
    return response.data;
  },

  // Actualizar un insumo
  update: async (id: number, insumo: CreateInsumoRequest): Promise<Insumo> => {
    const response = await api.put<Insumo>('/insumo', { id, ...insumo });
    return response.data;
  },

  // Eliminar un insumo
  delete: async (id: number): Promise<void> => {
    await api.delete(`/insumo/${id}`);
  },
};

// Tipos para Equipo
export interface Equipo {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  stock: number;
  costo: number;
}

export interface CreateEquipoRequest {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  stock: number;
  costo: number;
}

// Servicios de Equipo
export const equipoService = {
  // Obtener todo el equipo
  getAll: async (): Promise<Equipo[]> => {
    const response = await api.get<Equipo[]>('/equipo');
    return response.data;
  },

  // Crear un nuevo equipo
  create: async (equipo: CreateEquipoRequest): Promise<Equipo> => {
    const response = await api.post<Equipo>('/equipo', equipo);
    return response.data;
  },

  // Actualizar un equipo
  update: async (id: number, equipo: CreateEquipoRequest): Promise<Equipo> => {
    const response = await api.put<Equipo>('/equipo', { id, ...equipo });
    return response.data;
  },

  // Eliminar un equipo
  delete: async (id: number): Promise<void> => {
    await api.delete(`/equipo/${id}`);
  },
};

// Tipos para Lotes
export interface Lote {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  area: number;
  ubicacion: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'EN_COSECHA' | 'EN_PREPARACION';
  fechaSiembra?: string;
  fechaCosecha?: string;
  cultivo: string;
  rendimiento?: number;
}

export interface CreateLoteRequest {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  area: number;
  ubicacion: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'EN_COSECHA' | 'EN_PREPARACION';
  fechaSiembra?: string;
  fechaCosecha?: string;
  cultivo: string;
  rendimiento?: number;
}

// Servicios de Lotes
export const loteService = {
  // Obtener todos los lotes
  getAll: async (): Promise<Lote[]> => {
    const response = await api.get<Lote[]>('/lote');
    return response.data;
  },

  // Crear un nuevo lote
  create: async (lote: CreateLoteRequest): Promise<Lote> => {
    const response = await api.post<Lote>('/lote', lote);
    return response.data;
  },

  // Actualizar un lote
  update: async (id: number, lote: CreateLoteRequest): Promise<Lote> => {
    const response = await api.put<Lote>('/lote', { id, ...lote });
    return response.data;
  },

  // Eliminar un lote
  delete: async (id: number): Promise<void> => {
    await api.delete(`/lote/${id}`);
  },
};

// Tipos para registro de usuarios
export interface RegisterUserRequest {
  userName: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    cedula: string;
    salario: number | null;
  };
  password: string;
}

export interface RegisterUserResponse {
  id: string;
  userName: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    cedula: string;
    salario: number | null;
  };
}

// Tipos para listar usuarios
export interface UserListItem {
  id: string;
  userName: string;
  email: string;
  role: string;
  estado: string;
  hacienda: string;
  firstName: string;
  lastName: string;
  cedula: string;
  salario: number | null;
}

// Tipos para roles
export interface Role {
  id: string;
  role: string;
}

export interface CreateRoleRequest {
  role: string;
}

// Servicios de administración
export const adminService = {
  // Registrar un nuevo usuario
  registerUser: async (userData: RegisterUserRequest): Promise<RegisterUserResponse> => {
    const response = await api.post<RegisterUserResponse>('/auth/register', userData);
    return response.data;
  },

  // Verificar si una cédula ya existe
  checkCedulaExists: async (cedula: string): Promise<boolean> => {
    try {
      await api.get(`/auth/check-cedula/${cedula}`);
      return true; // Si no hay error, la cédula existe
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false; // Cédula no existe
      }
      throw error; // Otro tipo de error
    }
  },

  // Obtener todos los usuarios
  getAllUsers: async (): Promise<UserListItem[]> => {
    const response = await api.get<UserListItem[]>('/auth/users');
    return response.data;
  },

  // Activar/Desactivar usuario
  toggleUserStatus: async (userId: string, isActive: boolean): Promise<void> => {
    const estado = isActive ? 'ACTIVO' : 'INACTIVO';
    await api.put(`/auth/users/${userId}/status`, { estado });
  },

  // Eliminar usuario
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/auth/users/${userId}`);
  },

  // Obtener todos los roles
  getAllRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/auth/roles');
    return response.data;
  },

  // Crear un nuevo rol
  createRole: async (roleData: CreateRoleRequest): Promise<Role> => {
    const response = await api.post<Role>('/auth/roles', roleData);
    return response.data;
  },

  // Eliminar un rol
  deleteRole: async (roleId: string): Promise<void> => {
    await api.delete(`/auth/roles/${roleId}`);
  },
};

export default api; 