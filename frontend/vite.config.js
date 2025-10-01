import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDevelopment = command === 'serve';

  return {
    plugins: [
      react({
        // Usa o runtime clássico apenas em desenvolvimento para evitar o aviso do 'jsx'
        jsxRuntime: isDevelopment ? 'classic' : 'automatic',
      }),
    ],
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist'
    }
  };
});
