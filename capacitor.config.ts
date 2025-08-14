import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dcp.care',
  appName: 'DCP',
  webDir: 'out',
  server: {
    url: 'https://dcp.care',
    cleartext: false,
    allowNavigation: [
      'dcp.care',
      '*.dcp.care',
      '*.supabase.co',
      '*.supabase.net',
      'api.stripe.com',
      'checkout.stripe.com'
    ]
  },
  ios: { scheme: 'dcp', contentInset: 'always' },
  android: { allowMixedContent: false },
  plugins: { SplashScreen: { launchShowDuration: 0 } }
};

export default config;
