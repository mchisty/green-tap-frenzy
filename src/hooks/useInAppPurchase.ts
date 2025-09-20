import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';

interface PurchaseInfo {
  success: boolean;
  error?: any;
}

export const useInAppPurchase = (onRemoveAds: () => void) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

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
      // Initialize RevenueCat with your public API key
      // Replace with your actual RevenueCat public API key
      await Purchases.configure({
        apiKey: 'your_revenuecat_public_api_key_here', // Replace with actual key
        appUserID: null // Optional: set a unique user ID
      });
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize purchases:', error);
    }
  };

  const purchaseRemoveAds = useCallback(async (): Promise<PurchaseInfo> => {
    if (!isInitialized || isPurchasing) return { success: false };

    setIsPurchasing(true);
    
    try {
      // Simulate purchase for web preview (always succeeds)
      if (!Capacitor.isNativePlatform()) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        onRemoveAds();
        return { success: true };
      }

      // Implement actual purchase logic for mobile using RevenueCat
      try {
        const offerings = await Purchases.getOfferings();
        const currentOffering = offerings.current;
        
        if (!currentOffering || !currentOffering.availablePackages || currentOffering.availablePackages.length === 0) {
          throw new Error('No products available for purchase');
        }

        // Look for the remove ads package (you'll need to set this up in RevenueCat dashboard)
        const removeAdsPackage = currentOffering.availablePackages.find(
          pkg => pkg.identifier === 'remove_ads' || pkg.identifier === '$rc_lifetime'
        ) || currentOffering.availablePackages[0];

        const purchaseResult = await Purchases.purchasePackage({
          aPackage: removeAdsPackage
        });

        // Check if purchase was successful and user now has the entitlement
        if (purchaseResult.customerInfo.entitlements?.active && 
            purchaseResult.customerInfo.entitlements.active['remove_ads']) {
          onRemoveAds();
          return { success: true };
        } else {
          throw new Error('Purchase completed but entitlement not active');
        }
      } catch (purchaseError: any) {
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return { success: false, error: 'Purchase was cancelled' };
        }
        throw purchaseError;
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
      const restoreResult = await Purchases.restorePurchases();
      
      // Check if user has active remove_ads entitlement
      if (restoreResult.customerInfo.entitlements?.active && 
          restoreResult.customerInfo.entitlements.active['remove_ads']) {
        onRemoveAds();
        return { success: true };
      }
      
      return { success: true }; // Restore completed successfully, but no active entitlements
    } catch (error) {
      console.error('Restore failed:', error);
      return { success: false, error };
    } finally {
      setIsRestoring(false);
    }
  }, [isInitialized, isRestoring, onRemoveAds]);

  return {
    isInitialized,
    isPurchasing,
    isRestoring,
    purchaseRemoveAds,
    restorePurchases
  };
};