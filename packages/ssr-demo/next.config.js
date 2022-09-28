/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // this redirect prevents people from navigating straight to the experiment outcomes
      {
        source: '/experiment-outcomes/:path*',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
