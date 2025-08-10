import { useState, useEffect } from 'react';
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
  Spin,
  Table,
  Select,
  DatePicker,
  message
} from 'antd';
import {
  LogoutOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  DollarOutlined,
  WifiOutlined,
  PhoneOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { telcoxSaldoService, telcoxConsumoService, handleAuthError } from '../services/telcoxApi';
import type {
  TelcoxSaldoResponse,
  TelcoxConsumoResponse,
  TelcoxDashboardResumen,
  TelcoxConsumoGrafico
} from '../services/telcoxApi';
import { config } from '../config/env';
import * as localforage from 'localforage';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function Consumo() {
  console.log('Componente Consumo renderizando...');
  
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const navigate = useNavigate();

  // Estados para los datos
  const [saldo, setSaldo] = useState<TelcoxSaldoResponse | null>(null);
  const [consumos, setConsumos] = useState<TelcoxConsumoResponse[]>([]);
  const [resumen, setResumen] = useState<TelcoxDashboardResumen | null>(null);
  const [graficos, setGraficos] = useState<TelcoxConsumoGrafico[]>([]);
  
  // Estados para filtros y paginación
  const [filtroServicio, setFiltroServicio] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<[string, string] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalConsumos, setTotalConsumos] = useState(0);

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

  // Cargar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData(0); // Reiniciar contador de reintentos
    }
  }, [isAuthenticated, user]);

  // Recargar consumos cuando cambien los filtros
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchConsumos(0); // Reiniciar contador de reintentos
    }
  }, [filtroServicio, filtroFecha, currentPage, pageSize]);

  const fetchSaldo = async (retryCount: number = 0) => {
    try {
      const response = await telcoxSaldoService.getUserSaldo();
      setSaldo(response);
      console.log('Saldo obtenido:', response);
    } catch (error: any) {
      console.error('Error obteniendo saldo:', error);
      
      // Usar la nueva función para manejar errores de autenticación
      const shouldRedirect = await handleAuthError(error, retryCount);
      
      if (shouldRedirect) {
        message.error('Sesión expirada. Redirigiendo al login...');
        handleLogout();
        return;
      }
      
      // Si no es un error de autenticación o no requiere redirección
      if (error.response?.status === 401) {
        message.warning('Error de autenticación al obtener saldo. Puedes intentar refrescar o cerrar sesión manualmente.');
      } else {
        message.error('Error al obtener el saldo de la cuenta');
      }
    }
  };

  const fetchConsumos = async (retryCount: number = 0) => {
    try {
      setDataLoading(true);
      
      let fechaInicio = '';
      let fechaFin = '';
      
      if (filtroFecha) {
        fechaInicio = filtroFecha[0];
        fechaFin = filtroFecha[1];
      }

      const response = await telcoxConsumoService.getUserConsumos(
        currentPage,
        pageSize,
        filtroServicio === 'todos' ? undefined : filtroServicio,
        fechaInicio || undefined,
        fechaFin || undefined
      );

      setConsumos(response.items || []);
      setTotalConsumos(response.total || 0);
      console.log('Consumos obtenidos:', response);
    } catch (error: any) {
      console.error('Error obteniendo consumos:', error);
      
      // Usar la nueva función para manejar errores de autenticación
      const shouldRedirect = await handleAuthError(error, retryCount);
      
      if (shouldRedirect) {
        message.error('Sesión expirada. Redirigiendo al login...');
        handleLogout();
        return;
      }
      
      // Si no es un error de autenticación o no requiere redirección
      if (error.response?.status === 401) {
        message.warning('Error de autenticación al obtener consumos. Puedes intentar refrescar o cerrar sesión manualmente.');
      } else {
        message.error('Error al obtener el historial de consumo');
      }
    } finally {
      setDataLoading(false);
    }
  };

  const fetchResumen = async (retryCount: number = 0) => {
    try {
      const response = await telcoxConsumoService.getConsumoResumen();
      setResumen(response);
      console.log('Resumen obtenido:', response);
    } catch (error: any) {
      console.error('Error obteniendo resumen:', error);
      
      // Usar la nueva función para manejar errores de autenticación
      const shouldRedirect = await handleAuthError(error, retryCount);
      
      if (shouldRedirect) {
        message.error('Sesión expirada. Redirigiendo al login...');
        handleLogout();
        return;
      }
      
      // Si no es un error de autenticación o no requiere redirección
      if (error.response?.status === 401) {
        message.warning('Error de autenticación al obtener resumen. Puedes intentar refrescar o cerrar sesión manualmente.');
      } else {
        message.error('Error al obtener el resumen del dashboard');
      }
    }
  };

  const fetchGraficos = async (retryCount: number = 0) => {
    try {
      const response = await telcoxConsumoService.getConsumoGrafico();
      setGraficos(response);
      console.log('Gráficos obtenidos:', response);
    } catch (error: any) {
      console.error('Error obteniendo gráficos:', error);
      
      // Usar la nueva función para manejar errores de autenticación
      const shouldRedirect = await handleAuthError(error, retryCount);
      
      if (shouldRedirect) {
        message.error('Sesión expirada. Redirigiendo al login...');
        handleLogout();
        return;
      }
      
      // Si no es un error de autenticación o no requiere redirección
      if (error.response?.status === 401) {
        message.warning('Error de autenticación al obtener gráficos. Puedes intentar refrescar o cerrar sesión manualmente.');
      } else {
        message.error('Error al obtener los gráficos de consumo');
      }
    }
  };

  const fetchData = async (retryCount: number = 0) => {
    try {
      setDataLoading(true);
      await Promise.all([
        fetchSaldo(retryCount),
        fetchConsumos(retryCount),
        fetchResumen(retryCount),
        fetchGraficos(retryCount)
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await localforage.removeItem(config.AUTH_STORAGE_KEY);
      setIsAuthenticated(false);
      setUser(null);
      navigate('/telcox/login');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const handleRefresh = () => {
    fetchData(0); // Reiniciar contador de reintentos
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const getEstadoCuentaColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo': return '#52c41a';
      case 'suspendido': return '#faad14';
      case 'cancelado': return '#ff4d4f';
      default: return '#8c8c8c';
    }
  };

  const getEstadoCuentaText = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'activo': return 'Activo';
      case 'suspendido': return 'Suspendido';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  // Columnas para la tabla de consumos
  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha: string) => new Date(fecha).toLocaleDateString('es-ES')
    },
    {
      title: 'Servicio',
      dataIndex: 'servicio',
      key: 'servicio',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo_consumo',
      key: 'tipo_consumo',
    },
    {
      title: 'Cantidad',
      dataIndex: 'cantidad',
      key: 'cantidad',
      render: (cantidad: number, record: TelcoxConsumoResponse) => 
        `${cantidad} ${record.unidad}`
    },
    {
      title: 'Costo Total',
      dataIndex: 'costo_total',
      key: 'costo_total',
      render: (costo: number) => `$${costo.toFixed(2)}`
    }
  ];

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
          onClick={() => navigate('/telcox/login')}
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
                type="default"
                icon={<FileTextOutlined />}
                onClick={() => navigate('/facturas-pagadas')}
              >
                Ver Facturas Pagadas
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={dataLoading}
              >
                Actualizar
              </Button>
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

      {/* Estadísticas principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Saldo Actual"
              value={saldo?.saldo_actual || 0}
              prefix={<DollarOutlined />}
              suffix="$"
              valueStyle={{ color: saldo?.saldo_actual && saldo.saldo_actual > 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Consumo Mes Actual"
              value={resumen?.consumo_mes_actual || 0}
              prefix={<WifiOutlined />}
              suffix="GB"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Minutos Usados"
              value={resumen?.consumo_mes_actual || 0}
              prefix={<PhoneOutlined />}
              suffix="min"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Facturas Pendientes"
              value={resumen?.facturas_pendientes || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: resumen?.facturas_pendientes && resumen.facturas_pendientes > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Text strong>Servicio:</Text>
            <Select
              value={filtroServicio}
              onChange={setFiltroServicio}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="todos">Todos los servicios</Select.Option>
              <Select.Option value="datos">Datos</Select.Option>
              <Select.Option value="minutos">Minutos</Select.Option>
              <Select.Option value="sms">SMS</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>Rango de fechas:</Text>
            <RangePicker
              onChange={(dates) => {
                if (dates) {
                  setFiltroFecha([
                    dates[0]?.toISOString().split('T')[0] || '',
                    dates[1]?.toISOString().split('T')[0] || ''
                  ]);
                } else {
                  setFiltroFecha(null);
                }
              }}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Button
              type="primary"
              onClick={() => {
                setFiltroServicio('todos');
                setFiltroFecha(null);
                setCurrentPage(1);
              }}
              style={{ marginTop: 32 }}
            >
              Limpiar Filtros
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Gráficos */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Consumo Diario - Datos" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={graficos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="datos" stroke="#1890ff" name="Datos (GB)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Consumo Diario - Minutos" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={graficos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="minutos" fill="#722ed1" name="Minutos" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Información del Plan */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>Información del Plan</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Text strong>Cliente:</Text>
            <br />
            <Text>{resumen?.cliente?.nombre || 'N/A'}</Text>
          </Col>
          <Col xs={24} md={8}>
            <Text strong>Plan Actual:</Text>
            <br />
            <Text>{resumen?.cliente?.plan_actual || 'N/A'}</Text>
          </Col>
          <Col xs={24} md={8}>
            <Text strong>Estado de Cuenta:</Text>
            <br />
            <Text style={{ color: getEstadoCuentaColor(resumen?.cliente?.estado_cuenta || '') }}>
              {getEstadoCuentaText(resumen?.cliente?.estado_cuenta || '')}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Tabla de Consumos */}
      <Card title="Historial de Consumo" style={{ marginBottom: 24 }}>
        <Table
          columns={columns}
          dataSource={consumos}
          rowKey="id"
          loading={dataLoading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalConsumos,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} registros`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}
