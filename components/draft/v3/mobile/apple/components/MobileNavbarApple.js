/**
 * Mobile Navbar - TopDog Style
 * 
 * Mobile-optimized version of the main TopDog navbar:
 * - Same wr_blue.png background as desktop
 * - Touch-friendly navigation
 * - iOS safe area handling
 * - Mobile-optimized layout
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MOBILE_SIZES, PLATFORM_SPECIFIC } from '../../shared/constants/mobileSizes';
import { getMobilePlatform } from '../../../../../../lib/deviceUtils';
import { db } from '../../../../../../lib/firebase';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { useUserPreferences } from '../../../../../../hooks/useUserPreferences';

export default function MobileNavbarApple({ 
  showBack = true,
  title = "TopDog",
  onMenuToggle,
  transparent = false,
  isMyTurn = false,
  timer = 30,
  isDraftActive = false,
  participantCount = 0,
  roomId = null
}) {
  const [showLeaveDraftModal, setShowLeaveDraftModal] = useState(false);
  const router = useRouter();
  
  // Get user's custom border color
  const { getBorderColor } = useUserPreferences();
  const userBorderColor = getBorderColor();

  const handleHamburgerClick = () => {
    setShowLeaveDraftModal(true);
  };

  const handleLeaveDraft = async () => {
    try {
      // Determine if this is a tournament withdrawal vs just leaving a draft room
      const isRoomFilled = isDraftActive || participantCount >= 12;
      const isWithdrawingFromTournament = !isRoomFilled;
      
      if (isWithdrawingFromTournament && roomId) {
        // Remove user from the draft room participants
        const userName = localStorage.getItem('draftUserName');
        if (userName) {
          await updateDoc(doc(db, 'draftRooms', roomId), {
            participants: arrayRemove(userName)
          });
          console.log(`User ${userName} withdrew from tournament room ${roomId}`);
        }
      }
      
      // Navigate to mobile home page
      router.push('/mobile');
    } catch (error) {
      console.error('Error handling draft exit:', error);
      // Still navigate away even if there's an error
      router.push('/mobile');
    }
  };

  const handleStayInDraft = () => {
    setShowLeaveDraftModal(false);
  };

  return (
    <>
      {/* Main Navbar with wr_blue.png background */}
      <div 
        className="w-full z-50 shadow-lg"
        style={{
          background: isMyTurn && timer <= 10
            ? userBorderColor
            : 'url(/wr_blue.png) no-repeat center center',
          backgroundSize: isMyTurn && timer <= 10 ? 'auto' : 'cover',
          paddingTop: PLATFORM_SPECIFIC.IOS.SAFE_AREA_TOP,
          transition: isMyTurn && timer <= 12 && timer > 10 ? 'background-color 2s ease-in-out' : 'none'
        }}
      >
        <div className="relative flex items-center px-4 py-3 h-16">
          {/* Left Side - Menu Button */}
          <div className="absolute left-4 flex items-center h-full">
            <button 
              onClick={handleHamburgerClick}
              className="flex items-center justify-center"
            >
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ 
                  minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN,
                  minWidth: MOBILE_SIZES.TOUCH_TARGET_MIN,
                  borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS
                }}
              >
                {/* Left Arrow */}
                <svg 
                  width="34" 
                  height="34" 
                  viewBox="0 0 24 24" 
                  fill="white"
                >
                  <path d="M19,11H9l3.29-3.29a1,1,0,0,0,0-1.42,1,1,0,0,0-1.41,0l-4.29,4.3A2,2,0,0,0,6,12H6a2,2,0,0,0,.59,1.4l4.29,4.3a1,1,0,1,0,1.41-1.42L9,13H19a1,1,0,0,0,0-2Z"/>
                </svg>
              </div>
            </button>
          </div>

          {/* Center - TopDog Logo (Absolutely Centered) */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Link 
              href="/mobile"
              className="flex items-center"
            >
              <img 
                src="/logo.png" 
                alt="TopDog.dog Logo" 
                className="h-16"
                style={{ height: '64px' }}
              />
            </Link>
          </div>


        </div>
      </div>



      {/* Leave Draft Confirmation Modal */}
      {showLeaveDraftModal && (
        <LeaveDraftModal 
          isOpen={showLeaveDraftModal} 
          onLeaveDraft={handleLeaveDraft}
          onStayInDraft={handleStayInDraft}
          isDraftActive={isDraftActive}
          participantCount={participantCount}
          roomId={roomId}
        />
      )}
    </>
  );
}

/**
 * Leave Draft Confirmation Modal - iOS Style
 */
function LeaveDraftModal({ isOpen, onLeaveDraft, onStayInDraft, isDraftActive, participantCount, roomId }) {
  if (!isOpen) return null;

  // Determine if this is a tournament withdrawal vs just leaving a draft room
  // Room is considered "filled" if draft is active or if we have enough participants (12 for standard rooms)
  const isRoomFilled = isDraftActive || participantCount >= 12;
  const isWithdrawingFromTournament = !isRoomFilled;

  return (
    <div 
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onStayInDraft}
    >
      {/* Modal Panel */}
      <div 
        className="bg-[#2a2a2a] rounded-2xl mx-6 p-6 max-w-sm w-full shadow-2xl"
        style={{
          borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS * 2,
          animation: 'modalFadeIn 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-red-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {isWithdrawingFromTournament ? 'Withdraw from Tournament?' : 'Exit Draft Room?'}
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed px-2" style={{ fontSize: 'calc(0.875rem + 0.2px)' }}>
            {isWithdrawingFromTournament 
              ? 'Leaving now will withdraw you from the tournament. You will forfeit your entry fee and cannot rejoin this tournament.'
              : 'Are you sure you want to exit the draft room?'
            }
          </p>
        </div>

        {/* Modal Actions */}
        <div className="space-y-3">
          {/* Leave Draft Button */}
          <button
            onClick={onLeaveDraft}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-xl transition-colors"
            style={{ 
              minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN,
              borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS
            }}
          >
            {isWithdrawingFromTournament ? 'Yes, Withdraw' : 'Yes, Leave Draft Room'}
          </button>
          
          {/* Stay in Draft Button */}
          <button
            onClick={onStayInDraft}
            className="w-full py-4 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
            style={{ 
              minHeight: MOBILE_SIZES.TOUCH_TARGET_MIN,
              borderRadius: PLATFORM_SPECIFIC.IOS.BORDER_RADIUS
            }}
          >
            {isWithdrawingFromTournament ? 'Stay in Tournament' : 'Stay in Room'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
