import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hoopsiq.app",
  appName: "HoopsIQ",
  webDir: "dist/public",

  server: {
    // Use https scheme on Android for secure cookie + auth flows
    androidScheme: "https",
  },

  ios: {
    // Respect the device's safe area (notch, Dynamic Island, home indicator)
    contentInset: "always",
    // Allow scrolling to reach content behind the status bar
    scrollEnabled: true,
    backgroundColor: "#0b0d12",
  },

  android: {
    backgroundColor: "#0b0d12",
    // Enable hardware back button to navigate within the app
    allowMixedContent: false,
  },

  plugins: {
    // SplashScreen — hide immediately once the React app mounts.
    // Configure the actual splash screen image in Xcode / Android Studio.
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: "#0b0d12",
      showSpinner: false,
    },
    // StatusBar — match the app's dark background
    StatusBar: {
      style: "Dark",
      backgroundColor: "#0b0d12",
    },
  },
};

export default config;
