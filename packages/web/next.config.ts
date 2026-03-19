import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ipor/fusion-supabase-ponder', '@ipor/fusion-mastra'],
  outputFileTracingRoot: path.resolve(import.meta.dirname, '../../'),
};

export default nextConfig;
