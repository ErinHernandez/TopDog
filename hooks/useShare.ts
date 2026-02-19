/**
 * useShare Hook
 *
 * Custom hook for handling sharing functionality across the mobile app
 * Provides easy access to share methods and modal management
 */

import { useState, useCallback } from 'react';

import { createScopedLogger } from '../lib/clientLogger';
import { generateShareData, trackShare, getPlatformShareUrl, ShareType, Platform, ShareData as ShareConfigData, ShareDataInput } from '../lib/shareConfig';

const logger = createScopedLogger('[useShare]');

interface ShareData {
  [key: string]: unknown;
}

interface GeneratedShareData extends ShareConfigData {
  url: string;
  [key: string]: unknown;
}

interface ShareResult {
  success: boolean;
  method?: string;
  message?: string;
  error?: string;
}

interface PlatformShareResult {
  success: boolean;
  platform?: string;
  error?: string;
}

interface UseShareReturn {
  isModalOpen: boolean;
  currentShareType: ShareType | null;
  currentShareData: ShareData;
  isSharing: boolean;
  quickShare: (shareType: ShareType, shareData?: ShareDataInput) => Promise<ShareResult>;
  openShareModal: (shareType: ShareType, shareData?: ShareDataInput) => void;
  closeShareModal: () => void;
  shareToPlat: (shareType: ShareType, shareData?: ShareDataInput, platform?: Platform) => PlatformShareResult;
  copyToClipboard: (shareType: ShareType, shareData?: ShareDataInput) => Promise<ShareResult>;
  isNativeShareAvailable: (shareData?: ShareDataInput) => boolean;
}

export const useShare = (): UseShareReturn => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentShareType, setCurrentShareType] = useState<ShareType | null>(null);
  const [currentShareData, setCurrentShareData] = useState<ShareData>({});
  const [isSharing, setIsSharing] = useState<boolean>(false);

  // Quick share function (tries native first, then clipboard)
  const quickShare = useCallback(async (shareType: ShareType, shareData: ShareDataInput = {}): Promise<ShareResult> => {
    setIsSharing(true);

    try {
      const generatedData = generateShareData(shareType, shareData);

      // Try native sharing first
      if (navigator.share && navigator.canShare && navigator.canShare({ url: generatedData.url })) {
        await navigator.share({ url: generatedData.url });
        trackShare(shareType, 'native', true);
        return { success: true, method: 'native' };
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(generatedData.url);
        trackShare(shareType, 'share', true);
        return { success: true, method: 'clipboard', message: 'Link copied to clipboard!' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Quick share failed', error instanceof Error ? error : new Error(String(error)), { shareType });
      trackShare(shareType, 'share', false);
      return { success: false, error: errorMessage };
    } finally {
      setIsSharing(false);
    }
  }, []);

  // Open share modal with options
  const openShareModal = useCallback((shareType: ShareType, shareData: ShareDataInput = {}) => {
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
  const shareToPlat = useCallback((shareType: ShareType, shareData: ShareDataInput = {}, platform: Platform = 'native'): PlatformShareResult => {
    try {
      const generatedData = generateShareData(shareType, shareData, platform);
      const shareUrl = getPlatformShareUrl(generatedData, platform);

      window.open(shareUrl, '_blank', 'width=600,height=400');
      trackShare(shareType, platform, true);
      return { success: true, platform };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Share to platform failed', error instanceof Error ? error : new Error(String(error)), { shareType, platform });
      trackShare(shareType, platform, false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (shareType: ShareType, shareData: ShareDataInput = {}): Promise<ShareResult> => {
    try {
      const generatedData = generateShareData(shareType, shareData);
      await navigator.clipboard.writeText(generatedData.url);
      trackShare(shareType, 'share', true);
      return { success: true, message: 'Link copied to clipboard!' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Copy to clipboard failed', error instanceof Error ? error : new Error(String(error)));
      trackShare(shareType, 'share', false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Check if native sharing is available
  const isNativeShareAvailable = useCallback((shareData: ShareDataInput = {}): boolean => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      return false;
    }
    try {
      return navigator.canShare?.({ url: shareData.url ?? '' }) ?? false;
    } catch {
      return false;
    }
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
