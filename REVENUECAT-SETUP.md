# RevenueCat Setup for Real In-App Purchases

## Steps to Enable Real Purchases

### 1. RevenueCat Dashboard Setup
1. Create account at [RevenueCat](https://www.revenuecat.com/)
2. Create a new project
3. Get your **public API key** from Project Settings
4. Replace `'your_revenuecat_public_api_key_here'` in `src/hooks/useInAppPurchase.ts` with your actual key

### 2. Create Products & Entitlements
1. In RevenueCat dashboard, go to **Entitlements**
2. Create entitlement named: `remove_ads`
3. Go to **Products** and create:
   - Product ID: `remove_ads` (must match your app store product)
   - Attach to `remove_ads` entitlement

### 3. App Store Configuration
**Google Play Store:**
1. Go to Google Play Console → Your App → Monetize → Products → In-app products
2. Create product with ID: `remove_ads`
3. Set price (e.g., $2.99)
4. Activate the product

**Apple App Store:**
1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create product with ID: `remove_ads`  
3. Set price and activate

### 4. Connect Stores to RevenueCat
1. In RevenueCat dashboard, go to **Integrations**
2. Connect Google Play Store (upload service account JSON)
3. Connect App Store Connect (provide keys)

### 5. Test
- Use RevenueCat's sandbox/test mode for testing
- Test purchases won't charge real money
- Production builds will process real payments

## Current Status
✅ RevenueCat integration implemented  
⚠️ Requires API key and dashboard setup  
⚠️ Requires app store product configuration