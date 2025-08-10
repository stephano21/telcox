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
  Progress
} from 'antd';
import {
  DatabaseOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  StockOutlined
} from '@ant-design/icons';
import { insumoService, Insumo, CreateInsumoRequest } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchInsumos();
  }, []);

  const fetchInsumos = async () => {
    setLoading(true);
    try {
      const data = await insumoService.getAll();
      setInsumos(data);
    } catch (error) {
      message.error('Error al cargar los insumos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingInsumo(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    form.setFieldsValue(insumo);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await insumoService.delete(id);
      message.success('Insumo eliminado exitosamente');
      fetchInsumos();
    } catch (error) {
      message.error('Error al eliminar el insumo');
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (values: CreateInsumoRequest) => {
    try {
      if (editingInsumo) {
        await insumoService.update(editingInsumo.id!, values);
        message.success('Insumo actualizado exitosamente');
      } else {
        await insumoService.create(values);
        message.success('Insumo creado exitosamente');
      }
      setModalVisible(false);
      form.resetFields();
      fetchInsumos();
    } catch (error) {
      message.error('Error al guardar el insumo');
      console.error('Error:', error);
    }
  };

  const filteredInsumos = insumos.filter(insumo =>
    insumo.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    insumo.codigo.toLowerCase().includes(searchText.toLowerCase()) ||
    insumo.descripcion.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStockColor = (stock: number) => {
    if (stock <= 5) return 'red';
    if (stock <= 10) return 'orange';
    return 'green';
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 5) return 'Crítico';
    if (stock <= 10) return 'Bajo';
    return 'Normal';
  };

  const totalValue = insumos.reduce((sum, item) => sum + (item.stock * item.costo), 0);
  const lowStockCount = insumos.filter(item => item.stock <= 10).length;

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      render: (codigo: string) => (
        <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>
          {codigo}
        </Tag>
      ),
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre: string) => (
        <Space>
          <DatabaseOutlined style={{ color: '#1890ff' }} />
          <Text strong>{nombre}</Text>
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      render: (descripcion: string) => (
        <Tooltip title={descripcion}>
          <Text>{descripcion}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      width: 120,
      render: (stock: number) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Tag color={getStockColor(stock)}>
            <StockOutlined /> {stock}
          </Tag>
          <Progress
            percent={Math.min((stock / 20) * 100, 100)}
            size="small"
            strokeColor={getStockColor(stock)}
            showInfo={false}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getStockStatus(stock)}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Costo',
      dataIndex: 'costo',
      key: 'costo',
      width: 120,
      render: (costo: number) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <Text strong>${costo.toFixed(2)}</Text>
        </Space>
      ),
    },
    {
      title: 'Valor Total',
      key: 'valorTotal',
      width: 120,
      render: (_: any, record: Insumo) => (
        <Text strong style={{ color: '#722ed1' }}>
          ${(record.stock * record.costo).toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 150,
      render: (_: any, record: Insumo) => (
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
            title="¿Eliminar este insumo?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id!)}
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
            <DatabaseOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Gestión de Insumos
          </Title>
          <Text type="secondary">
            Administra el inventario de insumos del sistema
          </Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="Buscar insumos..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchInsumos}
              loading={loading}
            >
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Nuevo Insumo
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total de Insumos"
              value={insumos.length}
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Stock Total"
              value={insumos.reduce((sum, item) => sum + item.stock, 0)}
              prefix={<StockOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Stock Bajo (≤10)"
              value={lowStockCount}
              prefix={<StockOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Valor Total"
              value={totalValue}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Insumos */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredInsumos}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} insumos`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal para Crear/Editar */}
      <Modal
        title={editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
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
            codigo: '', 
            nombre: '', 
            descripcion: '', 
            stock: 0, 
            costo: 0 
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="codigo"
                label="Código del Insumo"
                rules={[
                  { required: true, message: 'Por favor ingresa el código' },
                  { min: 2, message: 'El código debe tener al menos 2 caracteres' },
                ]}
              >
                <Input
                  placeholder="Ej: INS001, FERT001"
                  size="large"
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre del Insumo"
                rules={[
                  { required: true, message: 'Por favor ingresa el nombre' },
                  { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                ]}
              >
                <Input
                  placeholder="Ej: Fertilizante NPK, Insecticida"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[
              { required: true, message: 'Por favor ingresa una descripción' },
              { min: 10, message: 'La descripción debe tener al menos 10 caracteres' },
            ]}
          >
            <TextArea
              placeholder="Describe las características y uso del insumo..."
              rows={3}
              showCount
              maxLength={300}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="Stock Inicial"
                rules={[
                  { required: true, message: 'Por favor ingresa el stock' },
                  { type: 'number', min: 0, message: 'El stock debe ser mayor o igual a 0' },
                ]}
              >
                <InputNumber
                  placeholder="0"
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="costo"
                label="Costo Unitario ($)"
                rules={[
                  { required: true, message: 'Por favor ingresa el costo' },
                  { type: 'number', min: 0, message: 'El costo debe ser mayor o igual a 0' },
                ]}
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  prefix="$"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingInsumo ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
