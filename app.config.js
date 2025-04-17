module.exports = {
  expo: {
    name: 'lucid-app',
    slug: 'lucid-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    plugins: ['expo-secure-store'],
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.lucid.app',
      infoPlist: {
        NSCameraUsageDescription:
          'We need access to your camera to scan QR codes for device pairing',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.lucid.app',
      permissions: ['CAMERA'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'c3c56d1a-052a-44fe-8cd1-c3bd7cf4a826',
      },
    },
  },
}
