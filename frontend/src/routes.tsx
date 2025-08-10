import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppLayout from './views/Layout';
import Dashboard from './views/Dashboard';
import Profile from './views/Profile';
// import Home from './views/Home';
import AdminUsers from './views/AdminUsers';

// Componentes de ejemplo
type LazyComponent = React.LazyExoticComponent<React.ComponentType<any>>;
// const Login: LazyComponent = React.lazy(() => import('./views/Login'));
const Consumo: LazyComponent = React.lazy(() => import('./views/Consumo'));
const FacturasPagadas: LazyComponent = React.lazy(() => import('./views/FacturasPagadas'));
const TelcoxLogin: LazyComponent = React.lazy(() => import('./views/TelcoxLogin'));

// Ruta privada para el sistema principal
function PrivateRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setLastPrivateRoute = useAuthStore((state) => state.setLastPrivateRoute);
  const location = useLocation();

  React.useEffect(() => {
    if (isAuthenticated) {
      setLastPrivateRoute(location.pathname);
    }
  }, [isAuthenticated, location.pathname, setLastPrivateRoute]);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

// Ruta privada para TelcoX
function TelcoxPrivateRoute() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    const checkTelcoxAuth = async () => {
      try {
        const { config } = await import('./config/env');
        const localforage = await import('localforage');
        
        const authStorage = await localforage.default.getItem(config.AUTH_STORAGE_KEY);
        if (authStorage) {
          const authData = authStorage as any;
          const token = authData.state?.user?.auth?.access_token || null;
          setIsAuthenticated(!!token);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error verificando autenticación TelcoX:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkTelcoxAuth();
  }, []);

  if (loading) {
    return <div>Cargando módulo TelcoX...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/telcox/login" replace state={{ from: location }} />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<div>Cargando...</div>}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/telcox/login" element={<TelcoxLogin />} />

          {/* Rutas privadas con layout para el sistema principal */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>

          {/* Rutas privadas para TelcoX (sin layout del sistema principal) */}
          <Route element={<TelcoxPrivateRoute />}>
            <Route path="/consumo" element={<Consumo />} />
            <Route path="/facturas-pagadas" element={<FacturasPagadas />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/telcox/login" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
} 