/**
 * useShare Hook
 * 
 * Custom hook for handling sharing functionality across the mobile app
 * Provides easy access to share methods and modal management
 */

import { useState, useCallback } from 'react';
import { generateShareData, trackShare } from '../lib/shareConfig';

export const useShare = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentShareType, setCurrentShareType] = useState(null);
  const [currentShareData, setCurrentShareData] = useState({});
  const [isSharing, setIsSharing] = useState(false);

  // Quick share function (tries native first, then clipboard)
  const quickShare = useCallback(async (shareType, shareData = {}) => {
    setIsSharing(true);
    
    try {
      const generatedData = generateShareData(shareType, shareData);
      
      // Try native sharing first
      if (navigator.share && navigator.canShare && navigator.canShare(generatedData)) {
        await navigator.share(generatedData);
        trackShare(shareType, 'native', true);
        return { success: true, method: 'native' };
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(generatedData.url);
        trackShare(shareType, 'clipboard', true);
        return { success: true, method: 'clipboard', message: 'Link copied to clipboard!' };
      }
    } catch (error) {
      console.error('Quick share failed:', error);
      trackShare(shareType, 'quick_share', false);
      return { success: false, error: error.message };
    } finally {
      setIsSharing(false);
    }
  }, []);

  // Open share modal with options
  const openShareModal = useCallback((shareType, shareData = {}) => {
    setCurrentShareType(shareType);
    setCurrentShareData(shareData);
    setIsModalOpen(true);
  }, []);

  // Close share modal
  const closeShareModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentShareType(null);
    setCurrentShareData({});
  }, []);

  // Direct platform share
  const shareToPlat = useCallback((shareType, shareData = {}, platform) => {
    try {
      const generatedData = generateShareData(shareType, shareData, platform);
      const shareUrl = getPlatformShareUrl(generatedData, platform);
      
      window.open(shareUrl, '_blank', 'width=600,height=400');
      trackShare(shareType, platform, true);
      return { success: true, platform };
    } catch (error) {
      console.error(`Share to ${platform} failed:`, error);
      trackShare(shareType, platform, false);
      return { success: false, error: error.message };
    }
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (shareType, shareData = {}) => {
    try {
      const generatedData = generateShareData(shareType, shareData);
      await navigator.clipboard.writeText(generatedData.url);
      trackShare(shareType, 'clipboard', true);
      return { success: true, message: 'Link copied to clipboard!' };
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      trackShare(shareType, 'clipboard', false);
      return { success: false, error: error.message };
    }
  }, []);

  // Check if native sharing is available
  const isNativeShareAvailable = useCallback((shareData = {}) => {
    return navigator.share && navigator.canShare && navigator.canShare(shareData);
  }, []);

  return {
    // State
    isModalOpen,
    currentShareType,
    currentShareData,
    isSharing,
    
    // Actions
    quickShare,
    openShareModal,
    closeShareModal,
    shareToPlat,
    copyToClipboard,
    
    // Utilities
    isNativeShareAvailable
  };
};

export default useShare;
