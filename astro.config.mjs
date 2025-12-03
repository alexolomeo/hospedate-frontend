// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import icon from 'astro-icon';

import aws from "astro-sst";

import react from '@astrojs/react';

import svgr from 'vite-plugin-svgr';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), svgr()],
    build: {
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            firebase: [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage',
              'firebase/messaging',
              'firebase/analytics',
            ],
            'ui-components': ['framer-motion', 'react-toastify'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
  },
  integrations: [icon(), react()],
  output: 'server',
  ssr: true,
  adapter: aws(),
  server: {
    // Desactiva el prefetch innecesario para SSR AWS
    prefetch: false,
  },	
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
