import React, { useState } from 'react';
import { Layout, Menu, Button, Switch, Dropdown, Tooltip, Avatar, Modal } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  DashboardOutlined,
  LogoutOutlined,
  BulbOutlined,
  UserOutlined,
  UnorderedListOutlined,
  BugOutlined,
  InboxOutlined,
  FieldTimeOutlined,
  ToolOutlined,
  UserAddOutlined,
  SettingOutlined,
  TeamOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const showLogoutConfirm = () => {
    Modal.confirm({
      title: '¿Cerrar sesión?',
      content: '¿Estás seguro de que deseas cerrar tu sesión?',
      okText: 'Sí, cerrar sesión',
      cancelText: 'Cancelar',
      okType: 'danger',
      onOk: logout,
    });
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => navigate('/perfil')}>
        Perfil
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={showLogoutConfirm}>
        Cerrar sesión
      </Menu.Item>
    </Menu>
  );

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Inicio',
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/consumo',
      icon: <DatabaseOutlined />,
      label: 'Consumo TelcoX',
    },
    {
      key: 'catalogos',
      icon: <UnorderedListOutlined />,
      label: 'Catálogos',
      children: [
        {
          icon: <BugOutlined />,
          key: '/catalogos/plagas',
          label: 'Plagas',
        },
        {
          icon: <InboxOutlined />,
          key: '/catalogos/insumos',
          label: 'Insumos',
        },
        {
          icon: <FieldTimeOutlined />,
          key: '/catalogos/lotes',
          label: 'Lotes',
        },
        {
          icon: <ToolOutlined />,
          key: '/catalogos/equipo',
          label: 'Equipo',
        },
      ],
    },
    {
      key: 'administracion',
      icon: <SettingOutlined />,
      label: 'Administración',
      children: [
        {
          key: '/admin/users',
          icon: <TeamOutlined />,
          label: 'Gestión de Usuarios',
        },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#001529',
        }}
      >
        <div style={{ height: 32, margin: 16, color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
          {collapsed ? 'SGC' : 'SGC Web'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#001529',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { color: '#fff' },
            })}
            <span style={{ fontWeight: 'bold', color: '#fff' }}>{user?.fullName || user?.username || 'Usuario'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={toggleTheme}
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: '#fff',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 16,
                transition: 'background 0.2s',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {theme === 'light' ? <BulbOutlined style={{ color: '#fff' }} /> : <span style={{ fontSize: 18, color: '#fff' }}>🌙</span>}
              <span style={{ fontWeight: 600 }}>{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
            </button>
            <Dropdown overlay={userMenu} placement="bottomRight" trigger={["click"]}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#fff' }}>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                <span style={{ fontWeight: 600 }}>{user?.fullName || user?.username || 'Usuario'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: theme === 'dark' ? '#18191a' : '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
} 