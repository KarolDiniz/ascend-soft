import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    host: true,
    port: 5173,
  },
});
