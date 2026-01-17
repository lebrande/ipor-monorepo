import type { StorybookConfig } from '@storybook/react-vite';
import { loadEnv } from 'vite';
import path from 'path';

// Load environment variables
const env = loadEnv('', process.cwd(), '');

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
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
  env: (config) => ({
    ...config,
    PUBLIC_API_URL: env.PUBLIC_API_URL,
    PUBLIC_VITE_RPC_URL_MAINNET: env.PUBLIC_VITE_RPC_URL_MAINNET,
    PUBLIC_VITE_RPC_URL_ARBITRUM: env.PUBLIC_VITE_RPC_URL_ARBITRUM,
    PUBLIC_VITE_RPC_URL_BASE: env.PUBLIC_VITE_RPC_URL_BASE,
  }),
  viteFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
      };
    }

    return config;
  },
};

export default config;
