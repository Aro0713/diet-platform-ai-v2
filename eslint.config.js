const next = require('eslint-config-next');

module.exports = [
  ...next(),
  {
    rules: {
      'react/jsx-key': 'warn',
      '@next/next/no-html-link-for-pages': 'off'
    }
  }
];

