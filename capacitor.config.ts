import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mchisty.greentap',
  appName: 'Green Tap Frenzy',
  webDir: 'dist',
  // Remove server config for production builds
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
      testingDevices: ['YOUR_DEVICE_ID_HERE']
    }
  }
};

export default config;