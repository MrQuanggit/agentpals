import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @agentpals/core ships TypeScript source from the workspace.
  transpilePackages: ['@agentpals/core'],
};

export default nextConfig;
