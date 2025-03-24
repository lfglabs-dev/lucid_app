module.exports = {
  expo: {
    name: "lucid-app",
    slug: "lucid-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lucid.app",
      infoPlist: {
        NSCameraUsageDescription: "We need access to your camera to scan QR codes for device pairing"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.lucid.app",
      permissions: ["CAMERA"]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || "http://192.168.110.255:8080",
      coinmarketcapApiKey: process.env.COINMARKETCAP_API_KEY || "",
      eas: {
        projectId: "your-project-id"
      }
    }
  }
}; 