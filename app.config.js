import 'dotenv/config'

export default ({ config }) => {
  const existingExpo = config?.expo ?? {}

  return {
    ...config,
    expo: {
      ...existingExpo,
      name: 'crypto-dashboard-mobile',
      slug: 'crypto-dashboard-mobile',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/images/icon.png',
      scheme: 'cryptodashboardmobile',
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      ios: {
        ...existingExpo.ios,
        supportsTablet: true,
      },
      android: {
        ...existingExpo.android,
        package: existingExpo.android?.package ?? 'com.adamplewa.cryptodashboardmobile',
        adaptiveIcon: {
          backgroundColor: '#E6F4FE',
          foregroundImage: './assets/images/android-icon-foreground.png',
          backgroundImage: './assets/images/android-icon-background.png',
          monochromeImage: './assets/images/android-icon-monochrome.png',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
      },
      web: {
        ...existingExpo.web,
        output: 'static',
        favicon: './assets/images/favicon.png',
      },
      plugins: [
        'expo-router',
        [
          'expo-splash-screen',
          {
            image: './assets/images/splash-icon.png',
            imageWidth: 200,
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
            dark: {
              backgroundColor: '#000000',
            },
          },
        ],
      ],
      experiments: {
        typedRoutes: true,
        reactCompiler: true,
      },
      extra: {
        ...existingExpo.extra, // <- zachowuje wszystko, co było w extra
        firebase: {
          apiKey: process.env.FIREBASE_API_KEY,
          authDomain: process.env.FIREBASE_AUTH_DOMAIN,
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.FIREBASE_APP_ID,
        },
        google: {
          webClientId: process.env.GOOGLE_WEB_CLIENT_ID || '656233021-96b5to7mns3vg9ol9errel25iefbtek3.apps.googleusercontent.com',
        },
        eas: {
          projectId: existingExpo.extra?.eas?.projectId ?? '63c1643b-f883-4644-b3ff-ec40d00a9e76',
        },
      },
    },
  }
}
