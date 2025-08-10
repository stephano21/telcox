import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Select,
  Switch,
  Divider,
  Alert
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
  DollarOutlined,
  KeyOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { adminService, UserListItem, Role, RegisterUserRequest } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
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

  const handleEdit = (user: UserListItem) => {
    setEditingUser(user);
    form.setFieldsValue({
      userName: user.userName,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      cedula: user.cedula,
      salario: user.salario
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adminService.deleteUser(id);
      message.success('Usuario eliminado exitosamente');
      fetchData();
    } catch (error) {
      message.error('Error al eliminar el usuario');
      console.error('Error:', error);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminService.toggleUserStatus(userId, isActive);
      message.success(`Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`);
      fetchData();
    } catch (error) {
      message.error('Error al cambiar el estado del usuario');
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // Para editar, solo actualizamos el perfil por ahora
        message.info('La edición de usuarios se implementará próximamente');
        setModalVisible(false);
        return;
      }

      // Crear nuevo usuario
      const userData: RegisterUserRequest = {
        userName: values.userName,
        email: values.email,
        role: values.role,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          cedula: values.cedula,
          salario: values.salario
        },
        password: values.password
      };

      await adminService.registerUser(userData);
      message.success('Usuario creado exitosamente');
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
      user.userName.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
      user.cedula.includes(searchText);
    
    const matchesRole = !selectedRole || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const getEstadoColor = (estado: string) => {
    return estado === 'ACTIVO' ? 'green' : 'red';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'MANAGER': return 'orange';
      case 'USER': return 'blue';
      default: return 'default';
    }
  };

  const activeUsers = users.filter(user => user.estado === 'ACTIVO').length;
  const inactiveUsers = users.filter(user => user.estado === 'INACTIVO').length;
  const adminUsers = users.filter(user => user.role === 'ADMIN').length;

  const columns = [
    {
      title: 'Usuario',
      key: 'user',
      width: 200,
      render: (_: any, record: UserListItem) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <Text strong>{record.userName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.firstName} {record.lastName}
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
      title: 'Cédula',
      dataIndex: 'cedula',
      key: 'cedula',
      width: 120,
      render: (cedula: string) => (
        <Space>
          <IdcardOutlined style={{ color: '#52c41a' }} />
          <Text style={{ fontFamily: 'monospace' }}>{cedula}</Text>
        </Space>
      ),
    },
    {
      title: 'Salario',
      dataIndex: 'salario',
      key: 'salario',
      width: 120,
      render: (salario: number | null) => (
        <Space>
          <DollarOutlined style={{ color: '#722ed1' }} />
          <Text strong>{salario ? `$${salario.toFixed(2)}` : 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          <CrownOutlined /> {role}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 120,
      render: (estado: string, record: UserListItem) => (
        <Space>
          <Tag color={getEstadoColor(estado)}>
            {estado}
          </Tag>
          <Switch
            checked={estado === 'ACTIVO'}
            onChange={(checked) => handleToggleStatus(record.id, checked)}
            size="small"
          />
        </Space>
      ),
    },
    {
      title: 'Hacienda',
      dataIndex: 'hacienda',
      key: 'hacienda',
      width: 120,
      render: (hacienda: string) => (
        <Tag color="geekblue">{hacienda}</Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 150,
      render: (_: any, record: UserListItem) => (
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
              placeholder="Filtrar por rol"
              value={selectedRole}
              onChange={setSelectedRole}
              style={{ width: 150 }}
              allowClear
            >
              {roles.map(role => (
                <Option key={role.id} value={role.role}>{role.role}</Option>
              ))}
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
              title="Administradores"
              value={adminUsers}
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

      {/* Modal para Crear Usuario */}
      <Modal
        title="Nuevo Usuario"
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
            userName: '', 
            email: '', 
            role: 'USER',
            firstName: '', 
            lastName: '', 
            cedula: '', 
            salario: undefined,
            password: ''
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="userName"
                label="Nombre de Usuario"
                rules={[
                  { required: true, message: 'Por favor ingresa el nombre de usuario' },
                  { min: 3, message: 'El nombre de usuario debe tener al menos 3 caracteres' },
                ]}
              >
                <Input
                  placeholder="Ej: juan.perez"
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
                name="firstName"
                label="Nombre"
                rules={[
                  { required: true, message: 'Por favor ingresa el nombre' },
                  { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                ]}
              >
                <Input
                  placeholder="Juan"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Apellido"
                rules={[
                  { required: true, message: 'Por favor ingresa el apellido' },
                  { min: 2, message: 'El apellido debe tener al menos 2 caracteres' },
                ]}
              >
                <Input
                  placeholder="Pérez"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cedula"
                label="Cédula"
                rules={[
                  { required: true, message: 'Por favor ingresa la cédula' },
                  { min: 10, message: 'La cédula debe tener al menos 10 dígitos' },
                ]}
              >
                <Input
                  placeholder="1234567890"
                  size="large"
                  prefix={<IdcardOutlined />}
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="salario"
                label="Salario ($)"
                rules={[
                  { required: true, message: 'Por favor ingresa el salario' },
                  { type: 'number', min: 0, message: 'El salario debe ser mayor o igual a 0' },
                ]}
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  prefix={<DollarOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Rol"
                rules={[
                  { required: true, message: 'Por favor selecciona el rol' },
                ]}
              >
                <Select size="large" placeholder="Selecciona el rol">
                  {roles.map(role => (
                    <Option key={role.id} value={role.role}>{role.role}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
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
          </Row>

          <Divider />

          <Alert
            message="Información Importante"
            description="La contraseña se enviará por email al usuario. Asegúrate de que el email sea correcto."
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
                Crear Usuario
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
