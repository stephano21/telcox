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
  DatePicker,
  Progress
} from 'antd';
import {
  FieldTimeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  AreaChartOutlined,
  CalendarOutlined,
  PlantOutlined
} from '@ant-design/icons';
import { loteService, Lote, CreateLoteRequest } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function Lotes() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLote, setEditingLote] = useState<Lote | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchLotes();
  }, []);

  const fetchLotes = async () => {
    setLoading(true);
    try {
      const data = await loteService.getAll();
      setLotes(data);
    } catch (error) {
      message.error('Error al cargar los lotes');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLote(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (lote: Lote) => {
    setEditingLote(lote);
    const formData = {
      ...lote,
      fechaSiembra: lote.fechaSiembra ? dayjs(lote.fechaSiembra) : undefined,
      fechaCosecha: lote.fechaCosecha ? dayjs(lote.fechaCosecha) : undefined,
    };
    form.setFieldsValue(formData);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await loteService.delete(id);
      message.success('Lote eliminado exitosamente');
      fetchLotes();
    } catch (error) {
      message.error('Error al eliminar el lote');
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const loteData: CreateLoteRequest = {
        ...values,
        fechaSiembra: values.fechaSiembra ? values.fechaSiembra.format('YYYY-MM-DD') : undefined,
        fechaCosecha: values.fechaCosecha ? values.fechaCosecha.format('YYYY-MM-DD') : undefined,
      };

      if (editingLote) {
        await loteService.update(editingLote.id!, loteData);
        message.success('Lote actualizado exitosamente');
      } else {
        await loteService.create(loteData);
        message.success('Lote creado exitosamente');
      }
      setModalVisible(false);
      form.resetFields();
      fetchLotes();
    } catch (error) {
      message.error('Error al guardar el lote');
      console.error('Error:', error);
    }
  };

  const filteredLotes = lotes.filter(lote =>
    lote.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    lote.codigo.toLowerCase().includes(searchText.toLowerCase()) ||
    lote.cultivo.toLowerCase().includes(searchText.toLowerCase()) ||
    lote.ubicacion.toLowerCase().includes(searchText.toLowerCase())
  );

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'green';
      case 'INACTIVO': return 'red';
      case 'EN_COSECHA': return 'orange';
      case 'EN_PREPARACION': return 'blue';
      default: return 'default';
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return 'Activo';
      case 'INACTIVO': return 'Inactivo';
      case 'EN_COSECHA': return 'En Cosecha';
      case 'EN_PREPARACION': return 'En Preparación';
      default: return estado;
    }
  };

  const totalArea = lotes.reduce((sum, item) => sum + item.area, 0);
  const activeLotes = lotes.filter(item => item.estado === 'ACTIVO').length;
  const harvestLotes = lotes.filter(item => item.estado === 'EN_COSECHA').length;

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
          <FieldTimeOutlined style={{ color: '#52c41a' }} />
          <Text strong>{nombre}</Text>
        </Space>
      ),
    },
    {
      title: 'Cultivo',
      dataIndex: 'cultivo',
      key: 'cultivo',
      width: 120,
      render: (cultivo: string) => (
        <Space>
          <PlantOutlined style={{ color: '#722ed1' }} />
          <Text>{cultivo}</Text>
        </Space>
      ),
    },
    {
      title: 'Área (ha)',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (area: number) => (
        <Space>
          <AreaChartOutlined style={{ color: '#1890ff' }} />
          <Text strong>{area}</Text>
        </Space>
      ),
    },
    {
      title: 'Ubicación',
      dataIndex: 'ubicacion',
      key: 'ubicacion',
      width: 150,
      render: (ubicacion: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#fa8c16' }} />
          <Text>{ubicacion}</Text>
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 120,
      render: (estado: string) => (
        <Tag color={getEstadoColor(estado)}>
          {getEstadoText(estado)}
        </Tag>
      ),
    },
    {
      title: 'Fecha Siembra',
      dataIndex: 'fechaSiembra',
      key: 'fechaSiembra',
      width: 120,
      render: (fecha: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          <Text>{fecha ? dayjs(fecha).format('DD/MM/YYYY') : 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Rendimiento',
      dataIndex: 'rendimiento',
      key: 'rendimiento',
      width: 120,
      render: (rendimiento: number) => (
        <Text strong style={{ color: rendimiento ? '#52c41a' : '#d9d9d9' }}>
          {rendimiento ? `${rendimiento} t/ha` : 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 150,
      render: (_: any, record: Lote) => (
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
            title="¿Eliminar este lote?"
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
            <FieldTimeOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            Gestión de Lotes
          </Title>
          <Text type="secondary">
            Administra los lotes de cultivo del sistema
          </Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="Buscar lotes..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchLotes}
              loading={loading}
            >
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Nuevo Lote
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total de Lotes"
              value={lotes.length}
              prefix={<FieldTimeOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Área Total"
              value={totalArea}
              precision={2}
              prefix={<AreaChartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              suffix="ha"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Lotes Activos"
              value={activeLotes}
              prefix={<PlantOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="En Cosecha"
              value={harvestLotes}
              prefix={<FieldTimeOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Lotes */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredLotes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} lotes`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>

      {/* Modal para Crear/Editar */}
      <Modal
        title={editingLote ? 'Editar Lote' : 'Nuevo Lote'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ 
            codigo: '', 
            nombre: '', 
            descripcion: '', 
            area: 0,
            ubicacion: '',
            estado: 'ACTIVO',
            cultivo: '',
            rendimiento: undefined
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="codigo"
                label="Código del Lote"
                rules={[
                  { required: true, message: 'Por favor ingresa el código' },
                  { min: 2, message: 'El código debe tener al menos 2 caracteres' },
                ]}
              >
                <Input
                  placeholder="Ej: LOTE001, CAMPO001"
                  size="large"
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre del Lote"
                rules={[
                  { required: true, message: 'Por favor ingresa el nombre' },
                  { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                ]}
              >
                <Input
                  placeholder="Ej: Lote Norte, Campo Sur"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cultivo"
                label="Cultivo Principal"
                rules={[
                  { required: true, message: 'Por favor ingresa el cultivo' },
                  { min: 2, message: 'El cultivo debe tener al menos 2 caracteres' },
                ]}
              >
                <Input
                  placeholder="Ej: Maíz, Frijol, Sorgo"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="area"
                label="Área (hectáreas)"
                rules={[
                  { required: true, message: 'Por favor ingresa el área' },
                  { type: 'number', min: 0.1, message: 'El área debe ser mayor a 0' },
                ]}
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ width: '100%' }}
                  min={0.1}
                  precision={2}
                  step={0.1}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ubicacion"
                label="Ubicación"
                rules={[
                  { required: true, message: 'Por favor ingresa la ubicación' },
                  { min: 3, message: 'La ubicación debe tener al menos 3 caracteres' },
                ]}
              >
                <Input
                  placeholder="Ej: Zona Norte, Sector Este"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="estado"
                label="Estado del Lote"
                rules={[
                  { required: true, message: 'Por favor selecciona el estado' },
                ]}
              >
                <Select size="large" placeholder="Selecciona el estado">
                  <Option value="ACTIVO">Activo</Option>
                  <Option value="INACTIVO">Inactivo</Option>
                  <Option value="EN_COSECHA">En Cosecha</Option>
                  <Option value="EN_PREPARACION">En Preparación</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fechaSiembra"
                label="Fecha de Siembra"
              >
                <DatePicker
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="Selecciona la fecha"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fechaCosecha"
                label="Fecha de Cosecha"
              >
                <DatePicker
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="Selecciona la fecha"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="rendimiento"
                label="Rendimiento (t/ha)"
              >
                <InputNumber
                  placeholder="0.00"
                  size="large"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  step={0.1}
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
              placeholder="Describe las características del lote, tipo de suelo, condiciones, etc..."
              rows={3}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingLote ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
