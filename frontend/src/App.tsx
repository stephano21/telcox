import React, { useEffect } from 'react';
import AppRoutes from './routes';
import { useThemeStore } from './stores/themeStore';
import { ConfigProvider, theme as antdTheme } from 'antd';

export default function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
  }, [theme]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <AppRoutes />
    </ConfigProvider>
  );
}
