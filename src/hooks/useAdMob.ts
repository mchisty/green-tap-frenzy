import { useState, useEffect, useCallback } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export const useAdMob = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [gameOverCount, setGameOverCount] = useState(0);
  const [adsRemoved, setAdsRemoved] = useState(false);

  useEffect(() => {
    // Check if ads were purchased (stored in localStorage)
    const adsPurchased = localStorage.getItem('ads_removed');
    if (adsPurchased === 'true') {
      setAdsRemoved(true);
    }

    if (Capacitor.isNativePlatform()) {
      initializeAdMob();
    }
  }, []);

  const initializeAdMob = async () => {
    try {
      await AdMob.initialize({
        testingDevices: ['YOUR_DEVICE_ID_HERE'],
        initializeForTesting: true,
      });
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
    }
  };

  const showBannerAd = useCallback(async () => {
    console.log('🎯 showBannerAd called - isInitialized:', isInitialized, 'adsRemoved:', adsRemoved, 'isNative:', Capacitor.isNativePlatform());
    
    if (adsRemoved) {
      console.log('❌ Banner ad blocked - ads removed by user');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Web preview - simulating banner ad display');
      setBannerVisible(true);
      return;
    }

    if (!isInitialized) {
      console.log('❌ Banner ad blocked - AdMob not initialized');
      return;
    }

    try {
      const options: BannerAdOptions = {
        adId: 'ca-app-pub-3940256099942544/6300978111', // Test Banner ID
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true
      };

      await AdMob.showBanner(options);
      setBannerVisible(true);
      console.log('✅ Banner ad displayed successfully');
    } catch (error) {
      console.error('❌ Failed to show banner ad:', error);
    }
  }, [isInitialized, adsRemoved]);

  const hideBannerAd = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await AdMob.hideBanner();
      setBannerVisible(false);
    } catch (error) {
      console.error('Failed to hide banner ad:', error);
    }
  }, []);

  const showInterstitialAd = useCallback(async () => {
    // Only show interstitial every 3 game overs
    const newGameOverCount = gameOverCount + 1;
    setGameOverCount(newGameOverCount);

    console.log('🎯 showInterstitialAd called - Game Over #', newGameOverCount, 'adsRemoved:', adsRemoved);

    if (adsRemoved) {
      console.log('❌ Interstitial ad blocked - ads removed by user');
      return;
    }

    if (newGameOverCount % 3 !== 0) {
      console.log('⏳ Interstitial ad skipped - not 3rd game over yet (need', 3 - (newGameOverCount % 3), 'more)');
      return;
    }

    console.log('🚀 Time to show interstitial ad! (Game Over #' + newGameOverCount + ')');

    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Web preview - simulating interstitial ad');
      alert('🎬 Interstitial Ad (Simulated)\n\nThis would be a full-screen ad on mobile!\n\nGame Over Count: ' + newGameOverCount);
      return;
    }

    if (!isInitialized) {
      console.log('❌ Interstitial ad blocked - AdMob not initialized');
      return;
    }

    try {
      const options = {
        adId: 'ca-app-pub-3940256099942544/1033173712', // Test Interstitial ID
        isTesting: true
      };

      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
      console.log('✅ Interstitial ad displayed successfully');
    } catch (error) {
      console.error('❌ Failed to show interstitial ad:', error);
    }
  }, [isInitialized, adsRemoved, gameOverCount]);

  const removeAds = () => {
    setAdsRemoved(true);
    localStorage.setItem('ads_removed', 'true');
    if (bannerVisible) {
      hideBannerAd();
    }
  };

  return {
    isInitialized,
    adsRemoved,
    showBannerAd,
    hideBannerAd,
    showInterstitialAd,
    removeAds,
    bannerVisible
  };
};