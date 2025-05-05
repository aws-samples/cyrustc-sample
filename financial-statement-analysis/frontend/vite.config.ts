import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: mode !== 'production',
    minify: mode === 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom',
          ],
          cloudscape: ['@cloudscape-design/components', '@cloudscape-design/global-styles'],
        },
      },
    },
  },
  define: {
    __APP_ENV__: JSON.stringify(mode),
  },
  // Environment variables loading only in development mode
  envDir: mode === 'development' ? './' : undefined,
  envPrefix: 'VITE_',
}))
