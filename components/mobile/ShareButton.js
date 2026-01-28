/**
 * Mobile Share Button Component
 *
 * Reusable share button for mobile interface that handles different content types
 * and provides native mobile sharing when available, with clipboard fallback
 */

import React, { useState } from 'react';
import { createScopedLogger } from '../../lib/clientLogger';

const logger = createScopedLogger('[ShareButton]');

const ShareButton = ({ 
  shareData,
  size = 'md',
  variant = 'default',
  className = '',
  showLabel = false,
  onShareSuccess,
  onShareError
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);

  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  // Button variant styles
  const variantClasses = {
    default: 'text-gray-400 hover:text-white',
    primary: 'text-blue-500 hover:text-blue-400',
    secondary: 'text-gray-500 hover:text-gray-400',
    accent: 'text-teal-500 hover:text-teal-400',
    pill: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full',
    outline: 'border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-white px-3 py-2 rounded-lg'
  };

  const handleShare = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      // Validate share data
      if (!shareData || (!shareData.url && !shareData.text)) {
        throw new Error('Invalid share data provided');
      }

      // Prepare share data with defaults
      const preparedShareData = {
        title: shareData.title || 'TopDog.dog',
        text: shareData.text || 'Check this out!',
        url: shareData.url || window.location.href,
        ...shareData
      };

      // Try native mobile sharing first
      if (navigator.share && navigator.canShare && navigator.canShare(preparedShareData)) {
        await navigator.share(preparedShareData);
        onShareSuccess?.('native');
      } else {
        // Fallback to clipboard copy
        const shareText = preparedShareData.url || 
          `${preparedShareData.title}\n${preparedShareData.text}\n${preparedShareData.url || ''}`.trim();
        
        await navigator.clipboard.writeText(shareText);
        
        // Show copied feedback
        setShowCopiedFeedback(true);
        setTimeout(() => setShowCopiedFeedback(false), 2000);
        
        onShareSuccess?.('clipboard');
      }
    } catch (error) {
      logger.error('Share failed', error);
      onShareError?.(error);

      // Last resort: try to copy URL only
      try {
        await navigator.clipboard.writeText(shareData.url || window.location.href);
        setShowCopiedFeedback(true);
        setTimeout(() => setShowCopiedFeedback(false), 2000);
      } catch (clipboardError) {
        logger.error('Clipboard fallback failed', clipboardError);
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Share icon SVG (matches the uploaded image style)
  const ShareIcon = ({ className }) => (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
      />
    </svg>
  );

  // Alternative simpler upload icon (closer to your image)
  const UploadIcon = ({ className }) => (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3-3m0 0l3 3m-3-3v9" 
      />
    </svg>
  );

  // Simple box with arrow up (most similar to your image)
  const SimpleShareIcon = ({ className }) => (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
      />
    </svg>
  );

  const buttonClasses = `
    relative inline-flex items-center justify-center
    transition-all duration-200 ease-in-out
    ${variant === 'pill' || variant === 'outline' ? variantClasses[variant] : `${variantClasses[variant]} p-2 rounded-lg hover:bg-gray-800/50`}
    ${isSharing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={buttonClasses}
        title={shareData?.title ? `Share ${shareData.title}` : 'Share'}
        aria-label={shareData?.title ? `Share ${shareData.title}` : 'Share'}
      >
        {isSharing ? (
          <div className={`animate-spin ${sizeClasses[size]}`}>
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <div className="flex items-center">
            <SimpleShareIcon className={sizeClasses[size]} />
            {showLabel && (
              <span className="ml-2 text-sm font-medium">Share</span>
            )}
          </div>
        )}
      </button>

      {/* Copied feedback tooltip */}
      {showCopiedFeedback && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50">
          Copied to clipboard!
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
