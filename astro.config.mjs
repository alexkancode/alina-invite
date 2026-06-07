// @ts-check
import { defineConfig } from 'astro/config';
import 'dotenv/config';

import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['pg']
    }
  },

  output: 'server',
  adapter: node({ mode: 'standalone' }),

  // Disable security restrictions for development/testing
  security: {
    checkOrigin: false
  },

  // Configure server for Railway deployment
  server: {
    host: '0.0.0.0',
    port: 4321
  }
});
