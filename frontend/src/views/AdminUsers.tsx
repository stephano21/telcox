import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,

  message,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,

  Select,
  Switch,
  Divider,
  Alert,
  Avatar
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,

  KeyOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { telcoxService } from '../services/telcoxApi';
import type { TelcoxUser, TelcoxUserCreate, TelcoxUserUpdate } from '../services/telcoxApi';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminUsers() {
  const [users, setUsers] = useState<TelcoxUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<TelcoxUser | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await telcoxService.getUsers();
      setUsers(usersData.items);
    } catch (error) {
      message.error('Error al cargar los datos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: TelcoxUser) => {
    setEditingUser(user);
    form.setFieldsValue({
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono,
      plan_actual: user.plan_actual,
      estado_cuenta: user.estado_cuenta
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await telcoxService.deleteUser(id);
      message.success('Usuario eliminado exitosamente');
      fetchData();
    } catch (error) {
      message.error('Error al eliminar el usuario');
      console.error('Error:', error);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const newEstado = isActive ? 'activo' : 'suspendido';
      await telcoxService.updateUser(userId, { estado_cuenta: newEstado });
      message.success(`Usuario ${isActive ? 'activado' : 'suspendido'} exitosamente`);
      fetchData();
    } catch (error) {
      message.error('Error al cambiar el estado del usuario');
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // Actualizar usuario existente
        const updateData: TelcoxUserUpdate = {
          nombre: values.nombre,
          email: values.email,
          telefono: values.telefono,
          plan_actual: values.plan_actual,
          estado_cuenta: values.estado_cuenta
        };

        await telcoxService.updateUser(editingUser.id, updateData);
        message.success('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        const userData: TelcoxUserCreate = {
          nombre: values.nombre,
          email: values.email,
          telefono: values.telefono,
          plan_actual: values.plan_actual,
          password: values.password
        };

        await telcoxService.createUser(userData);
        message.success('Usuario creado exitosamente');
      }
      
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el usuario';
      message.error(errorMessage);
      console.error('Error:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.telefono.includes(searchText);
    
    const matchesEstado = !selectedEstado || user.estado_cuenta === selectedEstado;
    
    return matchesSearch && matchesEstado;
  });

  const getEstadoColor = (estado: string) => {
    return estado === 'activo' ? 'green' : 'red';
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium': return 'red';
      case 'ilimitado': return 'orange';
      case 'familiar': return 'blue';
      default: return 'default';
    }
  };

  const activeUsers = users.filter(user => user.estado_cuenta === 'activo').length;
  const inactiveUsers = users.filter(user => user.estado_cuenta === 'suspendido').length;
  const premiumUsers = users.filter(user => user.plan_actual === 'premium').length;

  const columns = [
    {
      title: 'Usuario',
      key: 'user',
      width: 200,
      render: (_: any, record: TelcoxUser) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <Text strong>{record.nombre}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.telefono}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => (
        <Space>
          <MailOutlined style={{ color: '#1890ff' }} />
          <Text>{email}</Text>
        </Space>
      ),
    },
    {
      title: 'Teléfono',
      dataIndex: 'telefono',
      key: 'telefono',
      width: 120,
      render: (telefono: string) => (
        <Space>
          <IdcardOutlined style={{ color: '#52c41a' }} />
          <Text style={{ fontFamily: 'monospace' }}>{telefono}</Text>
        </Space>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan_actual',
      key: 'plan_actual',
      width: 120,
      render: (plan: string) => (
        <Tag color={getPlanColor(plan)}>
          <CrownOutlined /> {plan}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado_cuenta',
      key: 'estado_cuenta',
      width: 120,
      render: (estado: string, record: TelcoxUser) => (
        <Space>
          <Tag color={getEstadoColor(estado)}>
            {estado}
          </Tag>
          <Switch
            checked={estado === 'activo'}
            onChange={(checked) => handleToggleStatus(record.id, checked)}
            size="small"
          />
        </Space>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 150,
      render: (_: any, record: TelcoxUser) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar este usuario?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okType="danger"
          >
            <Button
              type="primary"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Gestión de Usuarios
          </Title>
          <Text type="secondary">
            Administra los usuarios del sistema
          </Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="Buscar usuarios..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Filtrar por estado"
              value={selectedEstado}
              onChange={setSelectedEstado}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="activo">Activo</Option>
              <Option value="suspendido">Suspendido</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Nuevo Usuario
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total de Usuarios"
              value={users.length}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Usuarios Activos"
              value={activeUsers}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Usuarios Inactivos"
              value={inactiveUsers}
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Usuarios Premium"
              value={premiumUsers}
              prefix={<CrownOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Usuarios */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} usuarios`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Modal para Crear/Editar Usuario */}
      <Modal
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ 
            nombre: '', 
            email: '', 
            telefono: '',
            plan_actual: 'familiar',
            estado_cuenta: 'activo',
            password: ''
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre Completo"
                rules={[
                  { required: true, message: 'Por favor ingresa el nombre completo' },
                  { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                ]}
              >
                <Input
                  placeholder="Juan Pérez"
                  size="large"
                  prefix={<UserOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Por favor ingresa el email' },
                  { type: 'email', message: 'Por favor ingresa un email válido' },
                ]}
              >
                <Input
                  placeholder="juan.perez@email.com"
                  size="large"
                  prefix={<MailOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="telefono"
                label="Teléfono"
                rules={[
                  { required: true, message: 'Por favor ingresa el teléfono' },
                  { min: 10, message: 'El teléfono debe tener al menos 10 dígitos' },
                ]}
              >
                <Input
                  placeholder="0987654321"
                  size="large"
                  prefix={<IdcardOutlined />}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="plan_actual"
                label="Plan"
                rules={[
                  { required: true, message: 'Por favor selecciona el plan' },
                ]}
              >
                <Select size="large" placeholder="Selecciona el plan">
                  <Option value="familiar">Familiar</Option>
                  <Option value="ilimitado">Ilimitado</Option>
                  <Option value="premium">Premium</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Contraseña"
                  rules={[
                    { required: true, message: 'Por favor ingresa la contraseña' },
                    { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
                  ]}
                >
                  <Input.Password
                    placeholder="••••••••"
                    size="large"
                    prefix={<KeyOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="estado_cuenta"
                  label="Estado de la Cuenta"
                  rules={[
                    { required: true, message: 'Por favor selecciona el estado' },
                  ]}
                >
                  <Select size="large" placeholder="Selecciona el estado">
                    <Option value="activo">Activo</Option>
                    <Option value="suspendido">Suspendido</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="estado_cuenta"
                  label="Estado de la Cuenta"
                  rules={[
                    { required: true, message: 'Por favor selecciona el estado' },
                  ]}
                >
                  <Select size="large" placeholder="Selecciona el estado">
                    <Option value="activo">Activo</Option>
                    <Option value="suspendido">Suspendido</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider />

          <Alert
            message="Información Importante"
            description={editingUser 
              ? "Los cambios se aplicarán inmediatamente al usuario."
              : "La contraseña se enviará por email al usuario. Asegúrate de que el email sea correcto."
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Actualizar Usuario' : 'Crear Usuario'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
