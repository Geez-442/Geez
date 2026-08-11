/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // API_PROXY_URL is set at build time (Docker) so the web server can proxy to the API container.
    // For local dev, fall back to localhost:3001/api.
    const apiUrl = process.env.API_PROXY_URL || 'http://localhost:3001/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
