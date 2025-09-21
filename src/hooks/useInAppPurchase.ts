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
      // RevenueCat public API key configured
      await Purchases.configure({
        apiKey: 'YOUR_REVENUECAT_PUBLIC_API_KEY_HERE', // Replace with your actual RevenueCat public API key
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
        console.log('Fetching RevenueCat offerings...');
        const offerings = await Purchases.getOfferings();
        console.log('Offerings received:', offerings);
        
        const currentOffering = offerings.current;
        
        if (!currentOffering || !currentOffering.availablePackages || currentOffering.availablePackages.length === 0) {
          console.error('No offerings or packages available. Check RevenueCat dashboard configuration.');
          throw new Error('No products available for purchase. Please ensure RevenueCat is properly configured with products and entitlements.');
        }

        console.log('Available packages:', currentOffering.availablePackages.map(pkg => ({ id: pkg.identifier })));

        // Look for the remove ads package (you'll need to set this up in RevenueCat dashboard)
        const removeAdsPackage = currentOffering.availablePackages.find(
          pkg => pkg.identifier === 'remove_ads' || pkg.identifier === '$rc_lifetime'
        ) || currentOffering.availablePackages[0];

        console.log('Selected package for purchase:', removeAdsPackage.identifier);

        const purchaseResult = await Purchases.purchasePackage({
          aPackage: removeAdsPackage
        });

        console.log('Purchase result:', purchaseResult);

        // Check if purchase was successful and user now has the entitlement
        if (purchaseResult.customerInfo.entitlements?.active && 
            purchaseResult.customerInfo.entitlements.active['remove_ads']) {
          console.log('Purchase successful, remove_ads entitlement is active');
          onRemoveAds();
          return { success: true };
        } else {
          console.error('Purchase completed but entitlement not active. Check RevenueCat entitlement configuration.');
          throw new Error('Purchase completed but ad-free feature not activated. Please contact support.');
        }
      } catch (purchaseError: any) {
        console.error('Purchase error details:', purchaseError);
        
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
          return { success: false, error: 'Purchase was cancelled' };
        }
        
        // Handle different types of user cancellation
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR ||
            purchaseError.message?.toLowerCase().includes('cancel') ||
            purchaseError.message?.toLowerCase().includes('user cancel') ||
            purchaseError.userCancelled === true) {
          return { success: false, error: 'Purchase was cancelled by user' };
        }
        
        if (purchaseError.code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
          return { success: false, error: 'Store connection problem. Please check your internet connection and try again.' };
        }
        
        if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
          return { success: false, error: 'Purchases are not allowed on this device. Please check your device settings.' };
        }
        
        if (purchaseError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
          return { success: false, error: 'Payment is pending. Please wait for confirmation from your payment provider.' };
        }
        
        // Generic error with more details
        const errorMessage = purchaseError.message || 'Unknown purchase error occurred';
        return { success: false, error: `Purchase failed: ${errorMessage}. Please ensure RevenueCat is properly configured.` };
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