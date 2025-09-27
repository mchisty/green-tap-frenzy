import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Purchases, PURCHASES_ERROR_CODE, LOG_LEVEL } from '@revenuecat/purchases-capacitor';

interface PurchaseInfo {
  success: boolean;
  error?: any;
}

export const useInAppPurchase = (onRemoveAds: () => void) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [productPrice, setProductPrice] = useState<string | null>(null);

  useEffect(() => {
    // Simulate initialization for web preview
    if (!Capacitor.isNativePlatform()) {
      setIsInitialized(true);
      return;
    }

    // In real mobile app, initialize purchase system here
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      const apiKey = 'YOUR_REVENUECAT_PUBLIC_API_KEY'; // Replace with your actual RevenueCat public API key
      
      // Initialize RevenueCat with your public API key
      await Purchases.configure({
        apiKey: apiKey,
        appUserID: null // Optional: set a unique user ID
      });
      
      // Enable debug logs for troubleshooting
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      
      console.log('RevenueCat initialized successfully');
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
    }
  };

  // Helper: wait for entitlement to become active (post-purchase processing can be async)
  const waitForEntitlementActive = async (maxWaitMs = 20000, intervalMs = 1500): Promise<boolean> => {
    const start = Date.now();
    try {
      while (Date.now() - start < maxWaitMs) {
        const info = await Purchases.getCustomerInfo();
        const active = info?.customerInfo?.entitlements?.active && info.customerInfo.entitlements.active['remove_ads'];
        if (active) {
          onRemoveAds();
          return true;
        }
        await new Promise((r) => setTimeout(r, intervalMs));
      }
    } catch (e) {
      console.error('Polling entitlements failed:', e);
    }
    return false;
  };

  // Check and apply entitlement state from RevenueCat/local storage
  const checkEntitlements = useCallback(async (): Promise<boolean> => {
    try {
      // On web preview, rely on local storage flag set by AdMob hook
      if (!Capacitor.isNativePlatform()) {
        const purchased = localStorage.getItem('ads_removed') === 'true';
        if (purchased) onRemoveAds();
        return purchased;
      }

      const info = await Purchases.getCustomerInfo();
      const active = info?.customerInfo?.entitlements?.active && info.customerInfo.entitlements.active['remove_ads'];
      if (active) {
        onRemoveAds();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to check entitlements:', e);
      return false;
    }
  }, [onRemoveAds]);

  // Fetch product price information
  const fetchProductPrice = useCallback(async () => {
    try {
      // For web preview, simulate a price
      if (!Capacitor.isNativePlatform()) {
        setProductPrice('$0.20');
        return;
      }

      // Fetch actual price from RevenueCat offerings
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      
      if (currentOffering && currentOffering.availablePackages && currentOffering.availablePackages.length > 0) {
        // Look for the remove ads package
        const removeAdsPackage = currentOffering.availablePackages.find(
          pkg => pkg.identifier === '$rc_lifetime'
        ) || currentOffering.availablePackages.find(
          pkg => pkg.identifier === 'remove_ads'
        ) || currentOffering.availablePackages[0];

        if (removeAdsPackage && removeAdsPackage.product) {
          setProductPrice(removeAdsPackage.product.priceString);
        }
      }
    } catch (error) {
      console.error('Failed to fetch product price:', error);
      // Don't set price on error - button will show without price
    }
  }, []);

  // When initialized, sync entitlement state and fetch price
  useEffect(() => {
    if (isInitialized) {
      checkEntitlements();
      fetchProductPrice();
    }
  }, [isInitialized, checkEntitlements, fetchProductPrice]);

  const purchaseRemoveAds = useCallback(async (): Promise<PurchaseInfo> => {
    if (isPurchasing) return { success: false };

    // Check if RevenueCat is properly configured
    if (!isInitialized) {
      return { success: false, error: 'RevenueCat is not configured. Please contact the app developer.' };
    }

    setIsPurchasing(true);
    
    try {
      // Simulate purchase for web preview (always succeeds)
      if (!Capacitor.isNativePlatform()) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        onRemoveAds();
        return { success: true };
      }

      // Before purchasing, check if user already owns the entitlement
      const alreadyOwned = await checkEntitlements();
      if (alreadyOwned) {
        console.log('Entitlement already active, skipping purchase');
        return { success: true };
      }

      // Implement actual purchase logic for mobile using RevenueCat
      try {
        console.log('Fetching RevenueCat offerings...');
        const offerings = await Purchases.getOfferings();
        console.log('Offerings received:', offerings);
        
        const currentOffering = offerings.current;
        
        if (!currentOffering || !currentOffering.availablePackages || currentOffering.availablePackages.length === 0) {
          console.error('No offerings or packages available. Check RevenueCat dashboard configuration.');
          throw new Error('No products available for purchase. Please ensure RevenueCat is properly configured with products and entitlements.');
        }

        console.log('Available packages:', currentOffering.availablePackages.map(pkg => ({ id: pkg.identifier })));

        // Look for the remove ads package - prioritize $rc_lifetime as shown in RevenueCat dashboard
        const removeAdsPackage = currentOffering.availablePackages.find(
          pkg => pkg.identifier === '$rc_lifetime'
        ) || currentOffering.availablePackages.find(
          pkg => pkg.identifier === 'remove_ads'
        ) || currentOffering.availablePackages[0];

        console.log('Package details:', {
          identifier: removeAdsPackage.identifier,
          packageType: removeAdsPackage.packageType,
          product: removeAdsPackage.product
        });

        console.log('Selected package for purchase:', removeAdsPackage.identifier);

        const purchaseResult = await Purchases.purchasePackage({
          aPackage: removeAdsPackage
        });

        console.log('Purchase result:', purchaseResult);

        // Check if purchase was successful and user now has the entitlement
        const entitlementActive = purchaseResult.customerInfo.entitlements?.active && 
            purchaseResult.customerInfo.entitlements.active['remove_ads'];
        if (entitlementActive) {
          console.log('Purchase successful, remove_ads entitlement is active');
          onRemoveAds();
          return { success: true };
        }

        console.warn('Entitlement not active immediately. Polling RevenueCat...');
        const activatedAfterWait = await waitForEntitlementActive(20000, 1500);
        if (activatedAfterWait) {
          return { success: true };
        }

        console.warn('Still not active. Forcing sync and retrying...');
        try { await Purchases.syncPurchases(); } catch (e) { console.warn('syncPurchases failed:', e); }
        const activatedAfterSync = await waitForEntitlementActive(15000, 1500);
        if (activatedAfterSync) {
          return { success: true };
        }

        console.error('Purchase completed but entitlement not active after waiting.');
        throw new Error('Purchase completed but processing is delayed. Tap "Restore Purchases" in a minute or try again.');
      } catch (purchaseError: any) {
        console.error('Purchase error details:', purchaseError);
        
        // If item already owned, treat as success after verifying entitlement
        if (purchaseError.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR ||
            purchaseError.message?.toLowerCase().includes('already active') ||
            purchaseError.message?.toLowerCase().includes('already own')) {
          const hasEntitlement = await checkEntitlements();
          if (hasEntitlement) {
            return { success: true };
          }
          try {
            const restoreResult = await Purchases.restorePurchases();
            if (restoreResult.customerInfo.entitlements?.active && restoreResult.customerInfo.entitlements.active['remove_ads']) {
              onRemoveAds();
              return { success: true };
            }
          } catch {}
          return { success: false, error: 'already_owned' };
        }
        
        // User explicitly cancelled the purchase flow
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return { success: false, error: 'cancelled' };
        }
        
        // Handle different types of user cancellation and dismissal
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR ||
            purchaseError.message?.toLowerCase().includes('cancel') ||
            purchaseError.message?.toLowerCase().includes('user cancel') ||
            purchaseError.userCancelled === true) {
          return { success: false, error: 'cancelled' };
        }
        
        // Payment was declined by payment provider
        if (purchaseError.message?.toLowerCase().includes('declined') ||
            purchaseError.message?.toLowerCase().includes('payment was declined') ||
            purchaseError.code === 'PAYMENT_DECLINED') {
          return { success: false, error: 'payment_declined' };
        }
        
        if (purchaseError.code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
          return { success: false, error: 'Store connection problem. Please check your internet connection and try again.' };
        }
        
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
          // Some Android dismiss actions may be reported under this code; treat as user cancellation
          return { success: false, error: 'cancelled' };
        }
        
        if (purchaseError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
          return { success: false, error: 'Payment is pending. Please wait for confirmation from your payment provider.' };
        }
        
        // Check for configuration issues
        if (purchaseError.message?.includes('credentials') || 
            purchaseError.message?.includes('API key') ||
            purchaseError.code === 'CONFIGURATION_ERROR') {
          return { success: false, error: 'RevenueCat is not properly configured. Please contact the app developer.' };
        }
        
        // Generic error with more details
        const errorMessage = purchaseError.message || 'Unknown purchase error occurred';
        return { success: false, error: `Purchase failed: ${errorMessage}. Please try again later.` };
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      return { success: false, error };
    } finally {
      setIsPurchasing(false);
    }
  }, [isInitialized, isPurchasing, onRemoveAds]);

  const restorePurchases = useCallback(async (): Promise<PurchaseInfo> => {
    if (!isInitialized || isRestoring) return { success: false };

    setIsRestoring(true);
    try {
      // Simulate restore for web preview
      if (!Capacitor.isNativePlatform()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
      }

      // Implement actual restore logic for mobile using RevenueCat
      try { await Purchases.syncPurchases(); } catch (e) { console.warn('syncPurchases during restore failed:', e); }
      const restoreResult = await Purchases.restorePurchases();
      
      const activeNow = restoreResult.customerInfo.entitlements?.active && 
          restoreResult.customerInfo.entitlements.active['remove_ads'];
      if (activeNow) {
        onRemoveAds();
        return { success: true };
      }
      
      // Sometimes processing is delayed, poll for a short while
      const activated = await waitForEntitlementActive(15000, 1500);
      if (activated) {
        return { success: true };
      }
      
      return { success: false, error: 'No previous purchases found to restore.' };
    } catch (error: any) {
      console.error('Restore failed:', error);
      
      // Handle specific restore errors more gracefully
      if (error.code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
        return { success: false, error: 'Store connection problem. Please check your internet connection and try again.' };
      }
      
      if (error.code === PURCHASES_ERROR_CODE.CONFIGURATION_ERROR) {
        return { success: false, error: 'App configuration issue. Please contact support.' };
      }
      
      // Generic error
      return { success: false, error: 'Unable to restore purchases. Please try again.' };
    } finally {
      setIsRestoring(false);
    }
  }, [isInitialized, isRestoring, onRemoveAds]);

  return {
    isInitialized,
    isPurchasing,
    isRestoring,
    productPrice,
    purchaseRemoveAds,
    restorePurchases
  };
};