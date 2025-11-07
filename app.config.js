import "dotenv/config";

export default {
  expo: {
    name: "Dream Pilot",
    slug: "dream-pilot",
    version: "1.0.2",
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
      package: "com.gharooni.dreampilot",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      icon: "./assets/app_icons/icon.png",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: ["NOTIFICATIONS", "SCHEDULE_EXACT_ALARM"],
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
    },
      compilerOptions: {
        paths: {
         "@firebase/auth": ["./node_modules/@firebase/auth/dist/index.rn.d.ts"]
        }
      },
      extends: "expo/tsconfig.base" 
  }
};
