const { i18n } = require('./next-i18next.config');

module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  i18n: {
    locales: [
      'pl', 'en', 'es', 'fr', 'de',
      'ua', 'ru', 'zh', 'hi', 'ar', 'he'
    ],
    defaultLocale: 'pl',
    localeDetection: true
  },

  webpack: (config) => {
    // ❌ usunięto zastępowanie process.env wersją z browsera
    return config;
  },
};
