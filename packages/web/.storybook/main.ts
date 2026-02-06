import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

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
    NEXT_PUBLIC_RPC_URL_MAINNET: process.env.NEXT_PUBLIC_RPC_URL_MAINNET,
    NEXT_PUBLIC_RPC_URL_ARBITRUM: process.env.NEXT_PUBLIC_RPC_URL_ARBITRUM,
    NEXT_PUBLIC_RPC_URL_BASE: process.env.NEXT_PUBLIC_RPC_URL_BASE,
  }),
  viteFinal: async (config) => {
    return {
      ...config,
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
