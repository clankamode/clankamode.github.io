import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  server: {
    port: 3000,
  },
});
