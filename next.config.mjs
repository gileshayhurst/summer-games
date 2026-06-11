/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: '/pong', destination: '/g/summer-games/pong', permanent: true },
      { source: '/beer-die', destination: '/g/summer-games/beer-die', permanent: true },
      { source: '/hearts', destination: '/g/summer-games/hearts', permanent: true },
      { source: '/admin', destination: '/g/summer-games/admin', permanent: true },
      { source: '/log', destination: '/g/summer-games/log', permanent: true },
      { source: '/players', destination: '/g/summer-games/players', permanent: true },
      { source: '/players/:name', destination: '/g/summer-games/players/:name', permanent: true },
    ]
  },
};

export default nextConfig;
