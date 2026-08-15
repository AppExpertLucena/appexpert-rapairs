/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    isrMemoryCacheSize: 0,
  },
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 2,
  },
  // Force rebuild: 2026-08-15 14:20
  env: {
    BUILD_TIMESTAMP: new Date().toISOString(),
  },
};

module.exports = nextConfig;
