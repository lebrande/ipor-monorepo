import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Handle redirects (migrated from astro.config.mjs)
  async redirects() {
    return [
      {
        source: '/',
        destination: '/vaults',
        permanent: true,
      },
      {
        source: '/vaults/:chainId/:address',
        destination: '/vaults/:chainId/:address/overview',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
