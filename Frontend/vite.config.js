import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config with API proxy to FastAPI backend
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});

