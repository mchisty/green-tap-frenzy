# Green Tap Frenzy - Monetization Setup Guide

## Overview
This app includes monetization features with Google AdMob ads and In-App Purchases. The current implementation provides a working demo in the web preview, with placeholder code ready for mobile deployment.

## Features Implemented

### 1. Google AdMob Integration
- **Banner Ads**: Non-intrusive banner ads at the bottom during gameplay
- **Interstitial Ads**: Full-screen ads shown every 3rd game over
- **Ad-Free Experience**: Ads are hidden when user purchases "Remove Ads"

### 2. In-App Purchases
- **Remove Ads**: Single non-consumable purchase ($2.99)
- **Restore Purchases**: Allows users to restore purchases on new devices
- **Persistent State**: Purchase state is saved locally and persists across sessions

## Mobile Deployment Instructions

### Step 1: Export to GitHub and Setup Local Development
1. Click "Export to GitHub" button in Lovable
2. Clone your repository locally
3. Run `npm install` to install dependencies

### Step 2: Initialize Capacitor
```bash
npx cap init
```
This creates the capacitor.config.ts file (already included in your project).

### Step 3: Add Mobile Platforms
```bash
# For iOS
npx cap add ios

# For Android  
npx cap add android
```

### Step 4: Setup AdMob
1. Create an AdMob account at [https://admob.google.com](https://admob.google.com)
2. Create an app in AdMob console
3. Get your App ID and Ad Unit IDs
4. Replace the test IDs in `capacitor.config.ts` and `src/hooks/useAdMob.ts`

**Update these files:**
- `capacitor.config.ts`: Replace the test App ID
- `src/hooks/useAdMob.ts`: Replace test Ad Unit IDs with your real ones

### Step 5: Setup In-App Purchases
1. Create a RevenueCat account at [https://revenuecat.com](https://revenuecat.com)
2. Setup your app and create a product with ID `remove_ads`
3. Get your RevenueCat API key
4. Update `src/hooks/useInAppPurchase.ts` with the actual RevenueCat implementation

**Uncomment and update the TODO sections in:**
- `src/hooks/useInAppPurchase.ts`

### Step 6: Build and Deploy
```bash
# Build the web app
npm run build

# Sync with native platforms
npx cap sync

# Open in IDE for final setup and testing
npx cap open ios    # For iOS (requires Mac + Xcode)
npx cap open android # For Android (requires Android Studio)
```

### Step 7: Configure App Store/Play Store
- **iOS**: Setup In-App Purchases in App Store Connect
- **Android**: Setup In-App Billing in Google Play Console

## Testing
- The current implementation works in web preview with simulated purchases
- All monetization features are functional and ready for real implementation
- Test ads and purchases will work in development builds

## Key Files
- `src/hooks/useAdMob.ts` - AdMob integration
- `src/hooks/useInAppPurchase.ts` - In-App Purchase logic
- `src/components/GreenTapGame.tsx` - Main game component with monetization UI
- `capacitor.config.ts` - Capacitor configuration with AdMob setup

## Revenue Model
- **Freemium**: Free game with ads, premium ad-free experience
- **Single Purchase**: $2.99 to remove all ads permanently
- **Ad Strategy**: Banner ads during gameplay, interstitials every 3 game overs

For more information on mobile development with Capacitor, visit: https://lovable.dev/blogs/TODO

## Support
For issues with monetization implementation, refer to:
- [AdMob Documentation](https://developers.google.com/admob)
- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [Capacitor Documentation](https://capacitorjs.com/docs)