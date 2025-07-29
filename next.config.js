/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/draft/topdog',
        destination: '/',
        permanent: false,
      },
      {
        source: '/draft/bigdog',
        destination: '/',
        permanent: false,
      },
      {
        source: '/draft/bottomdog',
        destination: '/',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig 