import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/espn/site': {
        target: 'https://site.api.espn.com/apis/site/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn\/site/, '')
      },
      '/api/espn/v2': {
        target: 'https://site.api.espn.com/apis/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn\/v2/, '')
      },
      '/api/espn/core': {
        target: 'https://sports.core.api.espn.com/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn\/core/, '')
      },
      '/api/espn/web': {
        target: 'https://site.web.api.espn.com/apis/site/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/espn\/web/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
