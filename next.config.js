const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    { urlPattern: /^https:\/\/.*\.(?:png|jpg|svg|woff2)$/, handler: 'CacheFirst' },
    { urlPattern: /^https:\/\/dcp\.care\/.*$/, handler: 'NetworkFirst' },
    { urlPattern: /^https:\/\/[a-z0-9.-]*supabase\.(co|net)\/.*$/, handler: 'NetworkOnly' },
    { urlPattern: /^https:\/\/(api|checkout)\.stripe\.com\/.*$/, handler: 'NetworkOnly' }
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // iOS: plik bez rozszerzenia MUSI mieć application/json
        source: '/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=600' },
        ],
      },
      {
        // Android App Links
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=600' },
        ],
      },
    ];
  },
});
