import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Avatar, Card, Form, Input, InputNumber, Button, message, Divider, Row, Col, Typography, Space, Modal, Progress } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined, CloseOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/api';
import type { UpdateProfileRequest, UserProfile, ChangePasswordRequest } from '../services/api';

const { Title, Text } = Typography;
const { Password } = Input;

// Función para evaluar la fortaleza de la contraseña
const evaluatePasswordStrength = (password: string): { score: number; level: string; color: string; feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  if (!password) {
    return { score: 0, level: 'Muy Débil', color: '#ff4d4f', feedback: [] };
  }

  // Longitud mínima
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Al menos 8 caracteres');
  }

  // Letras minúsculas
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Al menos una letra minúscula');
  }

  // Letras mayúsculas
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Al menos una letra mayúscula');
  }

  // Números
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Al menos un número');
  }

  // Caracteres especiales
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Al menos un carácter especial (!@#$%^&*)');
  }

  // Determinar nivel y color
  let level = '';
  let color = '';

  if (score <= 1) {
    level = 'Muy Débil';
    color = '#ff4d4f';
  } else if (score === 2) {
    level = 'Débil';
    color = '#faad14';
  } else if (score === 3) {
    level = 'Regular';
    color = '#faad14';
  } else if (score === 4) {
    level = 'Buena';
    color = '#52c41a';
  } else {
    level = 'Excelente';
    color = '#52c41a';
  }

  return { score, level, color, feedback };
};

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; level: string; color: string; feedback: string[] }>({
    score: 0,
    level: 'Muy Débil',
    color: '#ff4d4f',
    feedback: []
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const profile = await authService.getProfile();
      setProfileData(profile);
      
      // Pre-llenar el formulario con los datos actuales
      form.setFieldsValue({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        cedula: profile.cedula || '',
        salario: profile.salario || 0
      });
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      message.error('Error al cargar el perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  if (!user) {
    return <div>No hay información de usuario disponible.</div>;
  }

  if (profileLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div>Cargando perfil...</div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // Restaurar valores originales
    if (profileData) {
      form.setFieldsValue({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        cedula: profileData.cedula || '',
        salario: profileData.salario || 0
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const updatedProfile = await authService.updateProfile(values);
      setProfileData(updatedProfile);
      setEditing(false);
      message.success('Perfil actualizado correctamente');
      
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      const errorMessage = error.response?.data || 'Error al actualizar el perfil';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordModalVisible(true);
    passwordForm.resetFields();
    setPasswordStrength({ score: 0, level: 'Muy Débil', color: '#ff4d4f', feedback: [] });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    const strength = evaluatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handlePasswordSave = async () => {
    try {
      setPasswordLoading(true);
      const values = await passwordForm.validateFields();
      
      // Validación adicional de fortaleza de contraseña
      if (passwordStrength.score < 3) {
        message.error('La contraseña debe tener al menos un nivel de seguridad "Regular"');
        return;
      }
      
      await authService.changePassword(values);
      setPasswordModalVisible(false);
      message.success('Contraseña cambiada correctamente');
      
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      const errorMessage = error.response?.data || 'Error al cambiar la contraseña';
      message.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const isProfileComplete = profileData?.firstName && profileData?.lastName && profileData?.cedula;

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0 }}>
              {profileData?.firstName && profileData?.lastName 
                ? `${profileData.firstName} ${profileData.lastName}`
                : user.fullName || user.username
              }
            </Title>
            <Text type="secondary">{user.role}</Text>
          </div>
          <Space>
            {!editing && (
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={handleEdit}
              >
                {isProfileComplete ? 'Editar Perfil' : 'Completar Perfil'}
              </Button>
            )}
            <Button 
              icon={<LockOutlined />} 
              onClick={handleChangePassword}
            >
              Cambiar Contraseña
            </Button>
          </Space>
        </div>

        {!isProfileComplete && !editing && (
          <div style={{ 
            background: '#fff7e6', 
            border: '1px solid #ffd591', 
            borderRadius: '6px', 
            padding: '12px', 
            marginBottom: '24px' 
          }}>
            <Text type="warning">
              ⚠️ Tu perfil está incompleto. Completa tu información para una mejor experiencia.
            </Text>
          </div>
        )}

        <Row gutter={24}>
          <Col span={12}>
            <Title level={4}>Información de Cuenta</Title>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Usuario:</Text> {profileData?.userName || user.username}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Email:</Text> {profileData?.email || 'No especificado'}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Rol:</Text> {user.role}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Expira:</Text> {user.expiracion}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Ambiente:</Text> {user.env}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text strong>Hacienda:</Text> {profileData?.hacienda || user.hacienda || 'No especificada'}
            </div>
          </Col>

          <Col span={12}>
            <Title level={4}>Información Personal</Title>
            {editing ? (
              <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 16 }}
              >
                <Form.Item
                  name="firstName"
                  label="Nombre"
                  rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
                >
                  <Input placeholder="Tu nombre" />
                </Form.Item>

                <Form.Item
                  name="lastName"
                  label="Apellido"
                  rules={[{ required: true, message: 'Por favor ingresa tu apellido' }]}
                >
                  <Input placeholder="Tu apellido" />
                </Form.Item>

                <Form.Item
                  name="cedula"
                  label="Cédula"
                  rules={[{ required: true, message: 'Por favor ingresa tu cédula' }]}
                >
                  <Input placeholder="Tu número de cédula" />
                </Form.Item>

                <Form.Item
                  name="salario"
                  label="Salario"
                >
                  <InputNumber
                    placeholder="Tu salario"
                    min={0}
                    step={0.01}
                    style={{ width: '100%' }}
                    addonBefore="$"
                  />
                </Form.Item>

                <Space>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSave}
                    loading={loading}
                  >
                    Guardar
                  </Button>
                  <Button 
                    icon={<CloseOutlined />} 
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                </Space>
              </Form>
            ) : (
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Nombre:</Text> {profileData?.firstName || 'No especificado'}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Apellido:</Text> {profileData?.lastName || 'No especificado'}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Cédula:</Text> {profileData?.cedula || 'No especificada'}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Salario:</Text> {profileData?.salario ? `$${profileData.salario.toFixed(2)}` : 'No especificado'}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* Modal para cambiar contraseña */}
      <Modal
        title="Cambiar Contraseña"
        open={passwordModalVisible}
        onOk={handlePasswordSave}
        onCancel={() => setPasswordModalVisible(false)}
        confirmLoading={passwordLoading}
        okText="Cambiar Contraseña"
        cancelText="Cancelar"
      >
        <Form
          form={passwordForm}
          layout="vertical"
        >
          <Form.Item
            name="currentPassword"
            label="Contraseña Actual"
            rules={[{ required: true, message: 'Por favor ingresa tu contraseña actual' }]}
          >
            <Password placeholder="Tu contraseña actual" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Nueva Contraseña"
            rules={[
              { required: true, message: 'Por favor ingresa la nueva contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
            ]}
          >
            <Password 
              placeholder="Nueva contraseña" 
              onChange={handlePasswordChange}
              style={{ borderColor: passwordStrength.color }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmar Nueva Contraseña"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Por favor confirma la nueva contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Password placeholder="Confirma la nueva contraseña" />
          </Form.Item>

          <div style={{ marginTop: 10 }}>
            <Progress 
              percent={passwordStrength.score * 20} 
              showInfo={false} 
              strokeColor={passwordStrength.color} 
              style={{ marginBottom: 8 }}
            />
            <Text type="secondary" style={{ fontSize: '0.875em' }}>
              Nivel de Seguridad: {passwordStrength.level}
            </Text>
            <ul style={{ paddingLeft: '15px', marginTop: 5 }}>
              {passwordStrength.feedback.map((item, index) => (
                <li key={index} style={{ color: passwordStrength.color }}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        </Form>
      </Modal>
    </div>
  );
} 