import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { message, Input, Button } from 'antd';
import { authService } from '../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const lastPrivateRoute = useAuthStore((state) => state.lastPrivateRoute);
  const clearLastPrivateRoute = useAuthStore((state) => state.clearLastPrivateRoute);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || lastPrivateRoute || '/dashboard';
      clearLastPrivateRoute();
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, lastPrivateRoute, navigate, location.state, clearLastPrivateRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(null);
    if (!username.trim() || !password.trim()) {
      message.warning('Por favor, completa ambos campos.');
      return;
    }
    setLoading(true);
    try {
      const userData = await authService.login({ username, password });
      login(userData); // Guarda todo el contexto de autenticación
      message.success('¡Inicio de sesión exitoso!');
      // La navegación se maneja en el useEffect
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <img src="/vite.png" alt="Logo" style={{ width: 64, height: 64 }} />
        </div>
        <h2 style={{ textAlign: 'center' }}>Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <Input
            size="large"
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginBottom: 16 }}
            disabled={loading}
          />
          <Input.Password
            size="large"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: 16 }}
            disabled={loading}
          />
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large"
            style={{ width: '100%' }} 
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
} 