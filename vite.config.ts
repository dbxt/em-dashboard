import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Bind to all interfaces so the dashboard is reachable from other devices on the LAN.
const network = { host: '0.0.0.0', port: 5173, strictPort: true };

export default defineConfig({
  plugins: [react()],
  server: { ...network, allowedHosts: ['em-dashboard.projects.davidwaynebaxter.net'] },
  preview: { ...network, port: 4173 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
