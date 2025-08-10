import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, Space, Typography, Divider, List, Avatar, Tag } from 'antd';
import { 
  BugOutlined, 
  ToolOutlined, 
  DatabaseOutlined, 
  UserOutlined, 
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { plagaService, insumoService, equipoService, loteService } from '../services/api';

const { Title, Text } = Typography;

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [plagas, setPlagas] = useState<Plaga[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plagasData, insumosData, equiposData, lotesData] = await Promise.all([
          plagaService.getAll(),
          insumoService.getAll(),
          equipoService.getAll(),
          loteService.getAll()
        ]);
        setPlagas(plagasData);
        setInsumos(insumosData);
        setEquipos(equiposData);
        setLotes(lotesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    // La navegación se maneja en el Layout
  };

  if (!user) {
    return <div>No hay información de usuario disponible.</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header del Dashboard */}
      <div style={{ marginBottom: 32 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              Bienvenido, {user.fullName || user.username}!
            </Title>
            <Text type="secondary">
              Rol: {user.role} | Hacienda: {user.hacienda} | Ambiente: {user.env}
            </Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Col>
        </Row>
      </div>

      {/* Estadísticas principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Plagas Registradas"
              value={plagas.length}
              prefix={<BugOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Insumos Disponibles"
              value={insumos.length}
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Equipos Activos"
              value={equipos.length}
              prefix={<ToolOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Stock Total"
              value={insumos.reduce((sum, item) => sum + item.stock, 0) + equipos.reduce((sum, item) => sum + item.stock, 0)}
              prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Lotes Activos"
              value={lotes.filter(item => item.estado === 'ACTIVO').length}
              prefix={<FieldTimeOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Sección de Plagas */}
      <Card 
        title={
          <Space>
            <BugOutlined style={{ color: '#ff4d4f' }} />
            Gestión de Plagas
                    <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/catalogos/plagas')}
        >
          Nueva Plaga
        </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <List
          loading={loading}
          dataSource={plagas.slice(0, 5)}
          renderItem={(plaga) => (
            <List.Item
              actions={[
                <Button key="edit" type="link" icon={<EditOutlined />} size="small">
                  Editar
                </Button>,
                <Button key="delete" type="link" danger icon={<DeleteOutlined />} size="small">
                  Eliminar
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<BugOutlined />} style={{ backgroundColor: '#ff4d4f' }} />}
                title={plaga.nombre}
                description={plaga.descripcion}
              />
            </List.Item>
          )}
        />
        {plagas.length > 5 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" onClick={() => navigate('/catalogos/plagas')}>
              Ver todas las plagas ({plagas.length})
            </Button>
          </div>
        )}
      </Card>

      {/* Sección de Insumos */}
      <Card 
        title={
          <Space>
            <DatabaseOutlined style={{ color: '#1890ff' }} />
            Gestión de Insumos
                    <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/catalogos/insumos')}
        >
          Nuevo Insumo
        </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <List
          loading={loading}
          dataSource={insumos.slice(0, 5)}
          renderItem={(insumo) => (
            <List.Item
              actions={[
                <Button key="edit" type="link" icon={<EditOutlined />} size="small">
                  Editar
                </Button>,
                <Button key="delete" type="link" danger icon={<DeleteOutlined />} size="small">
                  Eliminar
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<DatabaseOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                title={
                  <Space>
                    {insumo.nombre}
                    <Tag color={insumo.stock > 10 ? 'green' : insumo.stock > 5 ? 'orange' : 'red'}>
                      Stock: {insumo.stock}
                    </Tag>
                  </Space>
                }
                description={`${insumo.descripcion} - Código: ${insumo.codigo} - Costo: $${insumo.costo}`}
              />
            </List.Item>
          )}
        />
        {insumos.length > 5 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" onClick={() => navigate('/catalogos/insumos')}>
              Ver todos los insumos ({insumos.length})
            </Button>
          </div>
        )}
      </Card>

      {/* Sección de Equipos */}
      <Card 
        title={
          <Space>
            <ToolOutlined style={{ color: '#52c41a' }} />
            Gestión de Equipos
                    <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/catalogos/equipo')}
        >
          Nuevo Equipo
        </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <List
          loading={loading}
          dataSource={equipos.slice(0, 5)}
          renderItem={(equipo) => (
            <List.Item
              actions={[
                <Button key="edit" type="link" icon={<EditOutlined />} size="small">
                  Editar
                </Button>,
                <Button key="delete" type="link" danger icon={<DeleteOutlined />} size="small">
                  Eliminar
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<ToolOutlined />} style={{ backgroundColor: '#52c41a' }} />}
                title={
                  <Space>
                    {equipo.nombre}
                    <Tag color={equipo.stock > 10 ? 'green' : equipo.stock > 5 ? 'orange' : 'red'}>
                      Stock: {equipo.stock}
                    </Tag>
                  </Space>
                }
                description={`${equipo.descripcion} - Código: ${equipo.codigo} - Costo: $${equipo.costo}`}
              />
            </List.Item>
          )}
        />
        {equipos.length > 5 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" onClick={() => navigate('/catalogos/equipo')}>
              Ver todos los equipos ({equipos.length})
            </Button>
          </div>
        )}
      </Card>

      {/* Sección de Lotes */}
      <Card 
        title={
          <Space>
            <FieldTimeOutlined style={{ color: '#52c41a' }} />
            Gestión de Lotes
            <Button 
              type="primary" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/catalogos/lotes')}
            >
              Nuevo Lote
            </Button>
          </Space>
        }
      >
        <List
          loading={loading}
          dataSource={lotes.slice(0, 5)}
          renderItem={(lote) => (
            <List.Item
              actions={[
                <Button key="edit" type="link" icon={<EditOutlined />} size="small">
                  Editar
                </Button>,
                <Button key="delete" type="link" danger icon={<DeleteOutlined />} size="small">
                  Eliminar
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FieldTimeOutlined />} style={{ backgroundColor: '#52c41a' }} />}
                title={
                  <Space>
                    {lote.nombre}
                    <Tag color={lote.estado === 'ACTIVO' ? 'green' : lote.estado === 'EN_COSECHA' ? 'orange' : lote.estado === 'EN_PREPARACION' ? 'blue' : 'red'}>
                      {lote.estado === 'ACTIVO' ? 'Activo' : lote.estado === 'EN_COSECHA' ? 'En Cosecha' : lote.estado === 'EN_PREPARACION' ? 'En Preparación' : 'Inactivo'}
                    </Tag>
                  </Space>
                }
                description={`${lote.cultivo} - Área: ${lote.area} ha - Ubicación: ${lote.ubicacion}`}
              />
            </List.Item>
          )}
        />
        {lotes.length > 5 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button type="link" onClick={() => navigate('/catalogos/lotes')}>
              Ver todos los lotes ({lotes.length})
            </Button>
          </div>
        )}
      </Card>

      {/* Información del usuario */}
      <Divider />
      <Card size="small" style={{ backgroundColor: '#fafafa' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>Token de acceso:</Text>
            <div style={{ 
              wordBreak: 'break-all', 
              fontFamily: 'monospace', 
              fontSize: '12px',
              backgroundColor: '#fff',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
              marginTop: '4px',
              display: 'block'
            }}>
              {user.auth?.access_Token}
            </div>
          </Col>
          <Col span={12}>
            <Text strong>Expiración:</Text>
            <div style={{ marginTop: '4px' }}>
              {user.expiracion}
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
} 