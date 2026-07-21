import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3020,
    proxy: {
      '/api-fx': {
        target: 'https://open.er-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-fx/, '')
      }
    }
  },
  preview: {
    port: 3020,
    host: true,
    allowedHosts: true
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue/') || id.includes('node_modules/vue-router/')) {
            return 'vendor-vue'
          }
          if (id.includes('node_modules/chart.js/') || id.includes('node_modules/vue-chartjs/')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/xlsx/')) {
            return 'vendor-xlsx'
          }
        }
      }
    }
  }
})
