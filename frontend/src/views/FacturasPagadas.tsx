import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Space, 
  Typography, 
  Spin, 
  message, 
  Alert,
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Tag
} from 'antd';
import { 
  ReloadOutlined, 
  LogoutOutlined, 
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { telcoxFacturaService, handleAuthError } from '../services/telcoxApi';
import { useTelcoxAuthStore } from '../stores/telcoxAuthStore';
import localforage from 'localforage';
import config from '../config/env';
import type { TelcoxFacturaResponse } from '../services/telcoxApi';

const { Title, Text } = Typography;
const { confirm } = Modal;

export default function FacturasPagadas() {
  console.log('Componente FacturasPagadas renderizando...');
  
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [facturas, setFacturas] = useState<TelcoxFacturaResponse[]>([]);
  const [totalFacturas, setTotalFacturas] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dataLoading, setDataLoading] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Estados para paginación
  

  // Verificar autenticación de TelcoX
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStorage = await localforage.getItem(config.AUTH_STORAGE_KEY);
        if (authStorage) {
          const authData = authStorage as any;
          const token = authData.state?.user?.auth?.access_token || null;
          
          if (token) {
            setIsAuthenticated(true);
            setUser(authData.state.user);
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

  // Cargar facturas pagadas
  const fetchFacturasPagadas = async (retryCount: number = 0) => {
    try {
      setDataLoading(true);
      setShowRetryButton(false);
      setLastError(null);
      
      const response = await telcoxFacturaService.getFacturasPagadas(currentPage, pageSize);
      setFacturas(response.items);
      setTotalFacturas(response.total);
    } catch (error: any) {
      console.error('Error cargando facturas pagadas:', error);
      
      // Usar la nueva función para manejar errores de autenticación
      const shouldRedirect = await handleAuthError(error, retryCount);
      
      if (shouldRedirect) {
        message.error('Sesión expirada. Redirigiendo al login...');
        handleLogout();
        return;
      }
      
      // Si no es un error de autenticación o no requiere redirección
      if (error.response?.status === 401) {
        const errorMsg = 'Error de autenticación. Puedes intentar refrescar o cerrar sesión manualmente.';
        setLastError(errorMsg);
        setShowRetryButton(true);
        message.warning(errorMsg);
      } else {
        const errorMsg = 'Error al cargar las facturas pagadas';
        setLastError(errorMsg);
        setShowRetryButton(true);
        message.error(errorMsg);
      }
    } finally {
      setDataLoading(false);
    }
  };

  // Cargar datos cuando cambie la autenticación
  useEffect(() => {
    if (isAuthenticated) {
      fetchFacturasPagadas(0); // Reiniciar contador de reintentos
    }
  }, [isAuthenticated, currentPage, pageSize]);

  // Manejar logout
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

  // Manejar refresh
  const handleRefresh = () => {
    fetchFacturasPagadas(0); // Reiniciar contador de reintentos
  };

  // Manejar reintento manual
  const handleRetry = () => {
    setShowRetryButton(false);
    setLastError(null);
    fetchFacturasPagadas(0); // Reiniciar contador de reintentos
  };

  // Manejar cambio de página
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Columnas de la tabla
  const columns = [
    {
      title: 'Número de Factura',
      dataIndex: 'numero_factura',
      key: 'numero_factura',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Fecha de Emisión',
      dataIndex: 'fecha_emision',
      key: 'fecha_emision',
      render: (text: string) => formatDate(text)
    },
    {
      title: 'Fecha de Pago',
      dataIndex: 'fecha_pago',
      key: 'fecha_pago',
      render: (text: string | null) => text ? formatDate(text) : '-'
    },
    {
      title: 'Monto Total',
      dataIndex: 'monto_total',
      key: 'monto_total',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(amount)}
        </Text>
      )
    },
    {
      title: 'Método de Pago',
      dataIndex: 'metodo_pago',
      key: 'metodo_pago',
      render: (text: string) => text || '-'
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: string) => (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          {estado.toUpperCase()}
        </Tag>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Alert
          message="No autenticado"
          description="Debes iniciar sesión para ver las facturas pagadas."
          type="warning"
          showIcon
          action={
            <Button type="primary" onClick={() => navigate('/login')}>
              Ir al Login
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            Facturas Pagadas
          </Title>
          <Text type="secondary">
            Historial de todas las facturas que han sido pagadas
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={dataLoading}
            >
              Actualizar
            </Button>
            {showRetryButton && (
              <Button
                type="default"
                icon={<ExclamationCircleOutlined />}
                onClick={handleRetry}
                loading={dataLoading}
              >
                Reintentar
              </Button>
            )}
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Alerta de error */}
      {lastError && (
        <Alert
          message="Error detectado"
          description={lastError}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Space>
              <Button size="small" onClick={handleRetry}>
                Reintentar
              </Button>
              <Button size="small" onClick={() => setShowRetryButton(false)}>
                Ocultar
              </Button>
            </Space>
          }
        />
      )}

      {/* Estadísticas */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Facturas Pagadas"
              value={totalFacturas}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Monto Total Pagado"
              value={facturas.reduce((sum, factura) => sum + factura.monto_total, 0)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => formatCurrency(value as number)}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Promedio por Factura"
              value={facturas.length > 0 ? facturas.reduce((sum, factura) => sum + factura.monto_total, 0) / facturas.length : 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => formatCurrency(value as number)}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Facturas */}
      <Card title="Lista de Facturas Pagadas" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={facturas}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalFacturas,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} facturas`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={handleTableChange}
          loading={dataLoading}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Información adicional */}
      <Card title="Información" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary">
              <CalendarOutlined style={{ marginRight: '4px' }} />
              Las facturas se muestran ordenadas por fecha de emisión (más recientes primero)
            </Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">
              <CheckCircleOutlined style={{ marginRight: '4px' }} />
              Solo se muestran facturas con estado "pagada"
            </Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
