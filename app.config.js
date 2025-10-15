import "dotenv/config";

export default {
  expo: {
    name: "Dream Pilot",
    slug: "dream-pilot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/app_icons/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      deploymentTarget: "15.1",
      supportsTablet: true,
      bundleIdentifier: "com.gharooni.dreampilot",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      icon: "./assets/app_icons/icon.png",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.gharooni.dreampilot",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-font"],
    notification: {
      color: "#6366f1",
      androidMode: "default",
      androidCollapsedTitle: "Reality Check",
    },
    extra: {
      eas: {
        projectId: "62c4d091-81b1-461d-9388-6754987a3d7a",
      },
      revenueCatApiKey: process.env.EXPO_PRIVATE_IOS_REVENUECAT_API_KEY,
      openAiApiKey: process.env.EXPO_PRIVATE_OPENAI_API_KEY,
    },
  },
};
