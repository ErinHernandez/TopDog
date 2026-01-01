/**
 * Mobile Share Modal Component
 * 
 * Comprehensive sharing modal with multiple platform options
 * and native mobile sharing integration
 */

import React, { useState, useEffect } from 'react';
import { generateShareData, getPlatformShareUrl, trackShare } from '../../lib/shareConfig';

const ShareModal = ({ 
  isOpen, 
  onClose, 
  shareType, 
  shareData = {},
  title = "Share"
}) => {
  const [copiedFeedback, setCopiedFeedback] = useState('');
  const [generatedShareData, setGeneratedShareData] = useState(null);

  useEffect(() => {
    if (isOpen && shareType) {
      const data = generateShareData(shareType, shareData);
      setGeneratedShareData(data);
    }
  }, [isOpen, shareType, shareData]);

  const handleNativeShare = async () => {
    if (!generatedShareData) return;
    
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(generatedShareData)) {
        await navigator.share(generatedShareData);
        trackShare(shareType, 'native', true);
        onClose();
      } else {
        // Fallback to copy
        await handleCopyLink();
      }
    } catch (error) {
      console.error('Native share failed:', error);
      trackShare(shareType, 'native', false);
      await handleCopyLink();
    }
  };

  const handlePlatformShare = (platform) => {
    if (!generatedShareData) return;
    
    const shareUrl = getPlatformShareUrl(generatedShareData, platform);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    trackShare(shareType, platform, true);
    onClose();
  };

  const handleCopyLink = async () => {
    if (!generatedShareData) return;
    
    try {
      await navigator.clipboard.writeText(generatedShareData.url);
      setCopiedFeedback('Link copied to clipboard!');
      trackShare(shareType, 'clipboard', true);
      setTimeout(() => setCopiedFeedback(''), 3000);
    } catch (error) {
      console.error('Copy failed:', error);
      setCopiedFeedback('Failed to copy link');
      trackShare(shareType, 'clipboard', false);
      setTimeout(() => setCopiedFeedback(''), 3000);
    }
  };

  const shareOptions = [
    {
      name: 'Twitter',
      platform: 'twitter',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      color: 'text-blue-400'
    },
    {
      name: 'Facebook',
      platform: 'facebook',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'text-blue-600'
    },
    {
      name: 'WhatsApp',
      platform: 'whatsapp',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      ),
      color: 'text-green-500'
    },
    {
      name: 'LinkedIn',
      platform: 'linkedin',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: 'text-blue-700'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-t-3xl w-full max-w-md mx-4 mb-0 overflow-hidden">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Preview */}
          {generatedShareData && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg">
              <h4 className="font-medium text-white text-sm mb-1">{generatedShareData.title}</h4>
              <p className="text-gray-400 text-xs line-clamp-2">{generatedShareData.text}</p>
            </div>
          )}
        </div>
        
        {/* Share Options */}
        <div className="px-6 py-4">
          {/* Native Share (if available) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center p-4 hover:bg-gray-800 rounded-lg transition-colors mb-2"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-white">Share</div>
                <div className="text-sm text-gray-400">Use your device&apos;s share menu</div>
              </div>
            </button>
          )}
          
          {/* Platform Options */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {shareOptions.map((option) => (
              <button
                key={option.platform}
                onClick={() => handlePlatformShare(option.platform)}
                className="flex items-center p-3 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className={`${option.color} mr-3`}>
                  {option.icon}
                </div>
                <span className="text-white font-medium">{option.name}</span>
              </button>
            ))}
          </div>
          
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center p-4 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700"
          >
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Copy Link</div>
              <div className="text-sm text-gray-400">Copy URL to clipboard</div>
            </div>
          </button>
          
          {/* Feedback */}
          {copiedFeedback && (
            <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm text-center">{copiedFeedback}</p>
            </div>
          )}
        </div>
        
        {/* Safe area for mobile */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default ShareModal;
