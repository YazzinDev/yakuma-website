import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  ssr: {
    noExternal: ['react-router-dom', 'react-i18next', 'react-helmet-async'],
  },
});
