// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [
      // @ts-expect-error
      tailwindcss(),
    ],
  },
  adapter: node({
    mode: 'standalone',
  }),
  experimental: { session: true },
  redirects: {
    '/': '/vaults',
    '/vaults/[chainId]/[address]': '/vaults/[chainId]/[address]/overview',
  },
});
