import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['@chainsafe/xdelta3-node'],
    },
  },
});
