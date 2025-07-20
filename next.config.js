const { i18n } = require('./next-i18next.config');
const webpack = require('webpack');

module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Dopisz jawnie konfigurację i18n (Next.js tego potrzebuje)
  i18n: {
    locales: [
      'pl', 'en', 'es', 'fr', 'de',
      'ua', 'ru', 'zh', 'hi', 'ar', 'he'
    ],
    defaultLocale: 'pl',
    localeDetection: true
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      process: require.resolve('process/browser'),
    };

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'node:process': require.resolve('process/browser'),
    };

    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
      })
    );

    return config;
  },
};
