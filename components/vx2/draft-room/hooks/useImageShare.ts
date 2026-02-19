/**
 * useImageShare - Hook for capturing and sharing draft views as images
 * 
 * Captures DOM elements as images with TopDog branding and shares via
 * Web Share API (with file support) or downloads as fallback.
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Error handling: Graceful fallbacks
 * - Mobile-first: Native share on iOS/Android
 * 
 * @example
 * ```tsx
 * const { captureAndShare, isCapturing } = useImageShare();
 * 
 * <button onClick={() => captureAndShare(boardRef, 'draft-board')}>
 *   Share Board
 * </button>
 * ```
 */

import { useState, useCallback } from 'react';

import { trackShare } from '../../../../lib/shareConfig';
import { UI_COLORS, TEXT_COLORS, BG_COLORS } from '../../core/constants/colors';

// ============================================================================
// CONSTANTS
// ============================================================================

const BRANDING = {
  /** Height of the branded header added to images */
  headerHeight: 56,
  /** Background color matching navbar */
  headerBgColor: UI_COLORS.tiledBg,
  /** TopDog logo path */
  logoPath: '/logo.png',
  /** Logo height in the header */
  logoHeight: 32,
  /** Tiled background image */
  tiledBgPath: '/wr_blue.png',
  /** Tiled background size */
  tiledBgSize: 60,
} as const;

const SHARE_CONFIG = {
  /** Image quality (0-1) */
  quality: 0.92,
  /** Image type */
  type: 'image/png',
  /** File name prefix */
  filePrefix: 'topdog',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export type ShareableView = 'draft-board' | 'roster' | 'picks';

export interface UseImageShareOptions {
  /** Called when share succeeds */
  onSuccess?: (method: 'native' | 'download') => void;
  /** Called when share fails */
  onError?: (error: Error) => void;
}

export interface UseImageShareResult {
  /** Whether an image capture is in progress */
  isCapturing: boolean;
  /** Last error that occurred */
  error: string | null;
  /** Capture element and share as image */
  captureAndShare: (
    element: HTMLElement | null,
    viewType: ShareableView,
    teamName?: string
  ) => Promise<void>;
  /** Capture element and download as image */
  captureAndDownload: (
    element: HTMLElement | null,
    viewType: ShareableView,
    teamName?: string
  ) => Promise<void>;
  /** Check if native sharing with files is supported */
  canShareFiles: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a branded header canvas with TopDog navbar
 */
async function createBrandedHeader(width: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = BRANDING.headerHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw tiled background
  const tiledBg = new Image();
  tiledBg.crossOrigin = 'anonymous';
  
  await new Promise<void>((resolve, reject) => {
    tiledBg.onload = () => {
      // Create pattern and fill
      const pattern = ctx.createPattern(tiledBg, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, BRANDING.headerHeight);
      } else {
        // Fallback to solid color
        ctx.fillStyle = BRANDING.headerBgColor;
        ctx.fillRect(0, 0, width, BRANDING.headerHeight);
      }
      resolve();
    };
    tiledBg.onerror = () => {
      // Fallback to solid color on error
      ctx.fillStyle = BRANDING.headerBgColor;
      ctx.fillRect(0, 0, width, BRANDING.headerHeight);
      resolve();
    };
    tiledBg.src = BRANDING.tiledBgPath;
  });
  
  // Draw TopDog logo centered
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  
  await new Promise<void>((resolve) => {
    logo.onload = () => {
      const aspectRatio = logo.width / logo.height;
      const logoWidth = BRANDING.logoHeight * aspectRatio;
      const x = (width - logoWidth) / 2;
      const y = (BRANDING.headerHeight - BRANDING.logoHeight) / 2;
      ctx.drawImage(logo, x, y, logoWidth, BRANDING.logoHeight);
      resolve();
    };
    logo.onerror = () => {
      // Draw text fallback if logo fails
      ctx.fillStyle = TEXT_COLORS.primary;
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TOPDOG', width / 2, BRANDING.headerHeight / 2);
      resolve();
    };
    logo.src = BRANDING.logoPath;
  });
  
  return canvas;
}

/**
 * Combines branded header with captured content
 */
function combineCanvases(
  header: HTMLCanvasElement,
  content: HTMLCanvasElement
): HTMLCanvasElement {
  const combined = document.createElement('canvas');
  combined.width = Math.max(header.width, content.width);
  combined.height = header.height + content.height;
  
  const ctx = combined.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw header at top
  ctx.drawImage(header, 0, 0);
  
  // Draw content below header
  ctx.drawImage(content, 0, header.height);
  
  return combined;
}

/**
 * Converts canvas to blob
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      SHARE_CONFIG.type,
      SHARE_CONFIG.quality
    );
  });
}

/**
 * Generates filename for the image
 */
function generateFilename(viewType: ShareableView, teamName?: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const name = teamName ? `-${teamName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : '';
  return `${SHARE_CONFIG.filePrefix}-${viewType}${name}-${timestamp}.png`;
}

/**
 * Check if Web Share API supports sharing files
 */
function checkCanShareFiles(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (!navigator.share) return false;
  if (!navigator.canShare) return false;
  
  // Test with a dummy file
  try {
    const testFile = new File([''], 'test.png', { type: 'image/png' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useImageShare(options: UseImageShareOptions = {}): UseImageShareResult {
  const { onSuccess, onError } = options;
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check file sharing support (memoized on mount)
  const canShareFiles = typeof window !== 'undefined' ? checkCanShareFiles() : false;
  
  /**
   * Captures an element as an image with branding
   */
  const captureElement = useCallback(async (
    element: HTMLElement | null,
    viewType: ShareableView
  ): Promise<{ canvas: HTMLCanvasElement; filename: string } | null> => {
    if (!element) {
      setError('No element to capture');
      return null;
    }

    try {
      // Dynamically import html2canvas only when needed (lazy load ~100KB library)
      const html2canvas = (await import('html2canvas')).default;

      // Capture the element
      const contentCanvas = await html2canvas(element, {
        backgroundColor: BG_COLORS.primary,
        scale: 2, // Higher resolution for sharing
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      
      // Create branded header
      const headerCanvas = await createBrandedHeader(contentCanvas.width);
      
      // Combine header and content
      const finalCanvas = combineCanvases(headerCanvas, contentCanvas);
      
      return {
        canvas: finalCanvas,
        filename: generateFilename(viewType),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture image';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
      return null;
    }
  }, [onError]);
  
  /**
   * Captures element and shares via native share or clipboard
   */
  const captureAndShare = useCallback(async (
    element: HTMLElement | null,
    viewType: ShareableView,
    teamName?: string
  ): Promise<void> => {
    setIsCapturing(true);
    setError(null);
    
    try {
      const result = await captureElement(element, viewType);
      if (!result) {
        setIsCapturing(false);
        return;
      }
      
      const { canvas, filename } = result;
      const blob = await canvasToBlob(canvas);
      const file = new File([blob], filename, { type: SHARE_CONFIG.type });
      
      // Try native share with file
      if (canShareFiles) {
        try {
          await navigator.share({
            files: [file],
            title: `TopDog ${viewType === 'draft-board' ? 'Draft Board' : 'Roster'}`,
            text: teamName ? `Check out ${teamName}'s picks!` : 'Check out my draft!',
          });
          trackShare(viewType === 'draft-board' ? 'draftBoard' : 'roster', 'native', true);
          onSuccess?.('native');
          setIsCapturing(false);
          return;
        } catch (shareErr) {
          // User cancelled or share failed - fall through to download
          if ((shareErr as Error).name === 'AbortError') {
            // User cancelled, don't treat as error
            setIsCapturing(false);
            return;
          }
        }
      }
      
      // Fallback: Download the image
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      trackShare(viewType === 'draft-board' ? 'draftBoard' : 'roster', 'download', true);
      onSuccess?.('download');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to share image';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
      trackShare(viewType === 'draft-board' ? 'draftBoard' : 'roster', 'share', false);
    } finally {
      setIsCapturing(false);
    }
  }, [captureElement, canShareFiles, onSuccess, onError]);
  
  /**
   * Captures element and downloads as image (no sharing)
   */
  const captureAndDownload = useCallback(async (
    element: HTMLElement | null,
    viewType: ShareableView,
    teamName?: string
  ): Promise<void> => {
    setIsCapturing(true);
    setError(null);
    
    try {
      const result = await captureElement(element, viewType);
      if (!result) {
        setIsCapturing(false);
        return;
      }
      
      const { canvas } = result;
      const blob = await canvasToBlob(canvas);
      const filename = generateFilename(viewType, teamName);
      
      // Download the image
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      trackShare(viewType === 'draft-board' ? 'draftBoard' : 'roster', 'download', true);
      onSuccess?.('download');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download image';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setIsCapturing(false);
    }
  }, [captureElement, onSuccess, onError]);
  
  return {
    isCapturing,
    error,
    captureAndShare,
    captureAndDownload,
    canShareFiles,
  };
}

export default useImageShare;
