import type { StorybookConfig } from '@storybook/react-vite';
import { loadEnv } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (config) => {
    // Load all env vars (including non-VITE_ prefixed) from .env files
    const env = loadEnv('', path.resolve(__dirname, '..'), '');

    return {
      ...config,
      server: {
        ...config.server,
        proxy: {
          '/api': 'http://localhost:3000',
        },
      },
      define: {
        ...config.define,
        'import.meta.env.NEXT_PUBLIC_RPC_URL_MAINNET': JSON.stringify(env.NEXT_PUBLIC_RPC_URL_MAINNET ?? ''),
        'import.meta.env.NEXT_PUBLIC_RPC_URL_ARBITRUM': JSON.stringify(env.NEXT_PUBLIC_RPC_URL_ARBITRUM ?? ''),
        'import.meta.env.NEXT_PUBLIC_RPC_URL_BASE': JSON.stringify(env.NEXT_PUBLIC_RPC_URL_BASE ?? ''),
        'import.meta.env.ALPHA_CONFIG_TEST_PRIVATE_KEY': JSON.stringify(env.ALPHA_CONFIG_TEST_PRIVATE_KEY ?? ''),
        // Polyfill process.env for modules that use Next.js conventions (e.g., wagmi-provider.tsx)
        'process.env.NEXT_PUBLIC_RPC_URL_MAINNET': JSON.stringify(env.NEXT_PUBLIC_RPC_URL_MAINNET ?? ''),
        'process.env.NEXT_PUBLIC_RPC_URL_ARBITRUM': JSON.stringify(env.NEXT_PUBLIC_RPC_URL_ARBITRUM ?? ''),
        'process.env.NEXT_PUBLIC_RPC_URL_BASE': JSON.stringify(env.NEXT_PUBLIC_RPC_URL_BASE ?? ''),
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': path.resolve(__dirname, '../src'),
        },
      },
    };
  },
};

export default config;
