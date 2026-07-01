import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      external: ['@chainsafe/xdelta3-node'],
    },
  },
});
