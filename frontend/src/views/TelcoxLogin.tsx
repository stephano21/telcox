import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, DatabaseOutlined } from '@ant-design/icons';
import { telcoxService } from '../services/telcoxApi';
import { config } from '../config/env';
import * as localforage from 'localforage';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

export default function TelcoxLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Intentando login con:', values.email);
      
      const response = await telcoxService.login({
        email: values.email,
        password: values.password
      });

      console.log('Login exitoso:', response);

      // Guardar en localforage
      const authData = {
        state: {
          user: {
            auth: {
              access_token: response.access_token,
              token_type: response.token_type,
              expires_in: response.expires_in
            },
            ...response.user
          }
        }
      };

      await localforage.setItem(config.AUTH_STORAGE_KEY, authData);
      
      console.log('Autenticación guardada en localforage');
      
      // Redirigir al módulo de consumo
      navigate('/consumo');
      
    } catch (error: any) {
      console.error('Error en login:', error);
      
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Error desconocido durante el login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <DatabaseOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <Title level={2} style={{ margin: 0 }}>
            TelcoX - Login
          </Title>
          <Text type="secondary">
            Accede a tu módulo de consumo
          </Text>
        </div>

        {error && (
          <Alert
            message="Error de autenticación"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          name="telcox-login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Por favor ingresa tu email' },
              { type: 'email', message: 'Por favor ingresa un email válido' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="tu@email.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              { required: true, message: 'Por favor ingresa tu contraseña' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Tu contraseña"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%' }}
              size="large"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary">
            Usuario de prueba: test@telcox.com / 123456
          </Text>
        </div>
      </Card>
    </div>
  );
}
