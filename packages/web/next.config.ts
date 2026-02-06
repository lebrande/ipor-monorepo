import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: '/vaults/:chainId/:address',
        destination: '/vaults/:chainId/:address/overview',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
