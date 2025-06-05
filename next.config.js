const { i18n } = require('./next-i18next.config');
const webpack = require('webpack');

module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  i18n,
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
