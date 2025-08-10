import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Typography,
  Alert,
  Spin
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { telcoxAuthService } from '../services/telcoxApi';
import { config } from '../config/env';
import * as localforage from 'localforage';

const { Title, Text } = Typography;

export default function Consumo() {
  console.log('Componente Consumo renderizando...');
  
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar autenticación de TelcoX
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStorage = await localforage.getItem(config.AUTH_STORAGE_KEY);
        if (authStorage) {
          const authData = authStorage as any;
          const token = authData.state?.user?.auth?.access_token || null;
          
          if (token) {
            // Verificar si el token es válido haciendo una petición
            try {
              // Aquí podrías hacer una petición para verificar el token
              setIsAuthenticated(true);
              setUser(authData.state.user);
            } catch (error) {
              console.log('Token inválido, limpiando almacenamiento');
              await localforage.removeItem(config.AUTH_STORAGE_KEY);
              setIsAuthenticated(false);
              setUser(null);
            }
          } else {
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  console.log('Usuario actual:', user);
  console.log('¿Está autenticado?:', isAuthenticated);

  const handleLogout = async () => {
    try {
      await localforage.removeItem(config.AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Verificando autenticación...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('Usuario no autenticado, redirigiendo...');
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert
          message="No autenticado"
          description="Debes iniciar sesión para acceder a esta página."
          type="warning"
          showIcon
        />
        <Button 
          type="primary" 
          onClick={() => navigate('/login')}
          style={{ marginTop: 16 }}
        >
          Ir al Login
        </Button>
      </div>
    );
  }

  console.log('Renderizando contenido principal del componente');

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <DatabaseOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Módulo de Consumo - TelcoX
            </Title>
            <Text type="secondary">
              Bienvenido, {user.nombre || user.username} | Monitoreo en tiempo real
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Información básica */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>Información del Usuario</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Text strong>Usuario:</Text>
            <br />
            <Text>{user.email || 'N/A'}</Text>
          </Col>
          <Col xs={24} md={8}>
            <Text strong>Nombre:</Text>
            <br />
            <Text>{user.nombre || 'N/A'}</Text>
          </Col>
          <Col xs={24} md={8}>
            <Text strong>Plan:</Text>
            <br />
            <Text>{user.plan_actual || 'N/A'}</Text>
          </Col>
        </Row>
      </Card>

      {/* Mensaje de estado */}
      <Alert
        message="Componente funcionando"
        description="El componente se está renderizando correctamente. Los logs están en la consola del navegador."
        type="success"
        showIcon
      />
    </div>
  );
}
