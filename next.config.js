/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  basePath: '/rental',
  async redirects() {
    return [
      { source: '/statements', destination: '/tenancy', permanent: true },
      { source: '/statements/:path*', destination: '/tenancy/:path*', permanent: true },
    ];
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.join(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
