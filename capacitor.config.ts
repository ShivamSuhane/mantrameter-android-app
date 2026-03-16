import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mantrameter.app',
  appName: 'Mantra Meter',
  webDir: 'dist',

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0f172a',
  },

  server: {
    androidScheme: 'https',
  },

  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#4f46e5',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#4f46e5',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '33866769980-cq7umijdlko8qj6anfqlcui95tvcekth.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;