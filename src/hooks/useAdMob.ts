import { useState, useEffect, useCallback } from 'react';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Ad Configuration
const AD_CONFIG = {
  INTERSTITIAL_FREQUENCY: 3, // Show after every 3rd game over
  COOLDOWN_SECONDS: 90, // 90 second cooldown between interstitials
  MAX_INTERSTITIALS_PER_SESSION: 10 // Safety limit per session
};

export const useAdMob = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [gameOverCount, setGameOverCount] = useState(0);
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [lastInterstitialTime, setLastInterstitialTime] = useState(0);
  const [sessionInterstitialCount, setSessionInterstitialCount] = useState(0);

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
    const newGameOverCount = gameOverCount + 1;
    setGameOverCount(newGameOverCount);

    const currentTime = Date.now();
    const timeSinceLastAd = (currentTime - lastInterstitialTime) / 1000;
    
    console.log('🎯 showInterstitialAd called - Game Over #', newGameOverCount, 'adsRemoved:', adsRemoved);
    console.log('📊 Session stats - Interstitials shown:', sessionInterstitialCount, 'Time since last:', Math.round(timeSinceLastAd), 's');

    if (adsRemoved) {
      console.log('❌ Interstitial ad blocked - ads removed by user');
      return;
    }

    // Check session limit
    if (sessionInterstitialCount >= AD_CONFIG.MAX_INTERSTITIALS_PER_SESSION) {
      console.log('❌ Interstitial ad blocked - session limit reached (' + AD_CONFIG.MAX_INTERSTITIALS_PER_SESSION + ')');
      return;
    }

    // Check frequency
    if (newGameOverCount % AD_CONFIG.INTERSTITIAL_FREQUENCY !== 0) {
      const remaining = AD_CONFIG.INTERSTITIAL_FREQUENCY - (newGameOverCount % AD_CONFIG.INTERSTITIAL_FREQUENCY);
      console.log('⏳ Interstitial ad skipped - need', remaining, 'more game overs (every', AD_CONFIG.INTERSTITIAL_FREQUENCY, 'games)');
      return;
    }

    // Check cooldown
    if (lastInterstitialTime > 0 && timeSinceLastAd < AD_CONFIG.COOLDOWN_SECONDS) {
      const remainingCooldown = Math.ceil(AD_CONFIG.COOLDOWN_SECONDS - timeSinceLastAd);
      console.log('⏰ Interstitial ad blocked - cooldown active (' + remainingCooldown + 's remaining)');
      return;
    }

    console.log('🚀 Time to show interstitial ad! (Game Over #' + newGameOverCount + ')');

    // Update timing and counter
    setLastInterstitialTime(currentTime);
    setSessionInterstitialCount(prev => prev + 1);

    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Web preview - simulating interstitial ad');
      alert('🎬 Interstitial Ad (Simulated)\n\nThis would be a full-screen ad on mobile!\n\nGame Over: ' + newGameOverCount + '\nSession Ads: ' + (sessionInterstitialCount + 1));
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
  }, [isInitialized, adsRemoved, gameOverCount, lastInterstitialTime, sessionInterstitialCount]);

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