import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const server = `http://127.0.0.1:${process.env.AGENTPALS_PORT ?? 4777}`;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    // In dev the UI runs on Vite; API + WebSocket go to the AgentPals server.
    proxy: {
      '/api': server,
      '/ws': { target: server, ws: true },
    },
  },
});
