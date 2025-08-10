import React, { useState, useEffect } from 'react';
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
  Tooltip
} from 'antd';
import {
  BugOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { plagaService, Plaga, CreatePlagaRequest } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Plagas() {
  const [plagas, setPlagas] = useState<Plaga[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlaga, setEditingPlaga] = useState<Plaga | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchPlagas();
  }, []);

  const fetchPlagas = async () => {
    setLoading(true);
    try {
      const data = await plagaService.getAll();
      setPlagas(data);
    } catch (error) {
      message.error('Error al cargar las plagas');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlaga(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (plaga: Plaga) => {
    setEditingPlaga(plaga);
    form.setFieldsValue(plaga);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await plagaService.delete(id);
      message.success('Plaga eliminada exitosamente');
      fetchPlagas();
    } catch (error) {
      message.error('Error al eliminar la plaga');
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (values: CreatePlagaRequest) => {
    try {
      if (editingPlaga) {
        await plagaService.update(editingPlaga.id!, values);
        message.success('Plaga actualizada exitosamente');
      } else {
        await plagaService.create(values);
        message.success('Plaga creada exitosamente');
      }
      setModalVisible(false);
      form.resetFields();
      fetchPlagas();
    } catch (error) {
      message.error('Error al guardar la plaga');
      console.error('Error:', error);
    }
  };

  const filteredPlagas = plagas.filter(plaga =>
    plaga.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    plaga.descripcion.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (nombre: string) => (
        <Space>
          <BugOutlined style={{ color: '#ff4d4f' }} />
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
      title: 'Acciones',
      key: 'actions',
      width: 150,
      render: (_: any, record: Plaga) => (
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
            title="¿Eliminar esta plaga?"
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
            <BugOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
            Gestión de Plagas
          </Title>
          <Text type="secondary">
            Administra el catálogo de plagas del sistema
          </Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="Buscar plagas..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchPlagas}
              loading={loading}
            >
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Nueva Plaga
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total de Plagas"
              value={plagas.length}
              prefix={<BugOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Plagas Filtradas"
              value={filteredPlagas.length}
              prefix={<SearchOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Plagas */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredPlagas}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} plagas`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal para Crear/Editar */}
      <Modal
        title={editingPlaga ? 'Editar Plaga' : 'Nueva Plaga'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ nombre: '', descripcion: '' }}
        >
          <Form.Item
            name="nombre"
            label="Nombre de la Plaga"
            rules={[
              { required: true, message: 'Por favor ingresa el nombre de la plaga' },
              { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
            ]}
          >
            <Input
              placeholder="Ej: Mosca blanca, Pulgón, etc."
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[
              { required: true, message: 'Por favor ingresa una descripción' },
              { min: 10, message: 'La descripción debe tener al menos 10 caracteres' },
            ]}
          >
            <TextArea
              placeholder="Describe las características, síntomas y daños de la plaga..."
              rows={4}
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
                {editingPlaga ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
