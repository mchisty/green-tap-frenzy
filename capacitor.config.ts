import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mchisty.greentap',
  appName: 'Green Tap Frenzy',
  webDir: 'dist',
  server: {
    url: 'https://966de51c-627b-4779-8217-82e1fdb259a5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3940256099942544~3347511713', // Test App ID
      testingDevices: ['YOUR_DEVICE_ID_HERE']
    }
  }
};

export default config;