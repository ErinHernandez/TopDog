/**
 * NavbarVX - Version X Navbar (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/MobileNavbarApple.js (120+ lines)
 * 
 * Features:
 * - TopDog logo
 * - Back/menu button
 * - Leave draft modal
 * - Dynamic background color based on draft state
 * - Touch-optimized for mobile
 */

import React, { useState } from 'react';
import { Z_INDEX } from '../../constants/sizes';
import { BG_COLORS, STATE_COLORS } from '../../constants/colors';

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const NAVBAR_PX = {
  // Container
  height: 64,
  paddingX: 16,
  
  // Logo
  logoHeight: 48,
  
  // Title
  titleFontSize: 18,
  
  // Buttons
  buttonSize: 40,
  buttonRadius: 20,
  iconSize: 24,
  iconStrokeWidth: 2.5,
  menuIconStrokeWidth: 2,
  
  // Modal
  modalMaxWidth: 384,
  modalPaddingX: 24,
  modalPaddingY: 16,
  modalBorderRadius: 12,
  modalTitleFontSize: 18,
  modalBodyFontSize: 14,
  modalButtonHeight: 48,
  modalButtonRadius: 8,
  modalButtonGap: 12,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface NavbarVXProps {
  /** Callback when back button is pressed */
  onBack?: () => void;
  /** Callback when leaving draft */
  onLeaveDraft?: () => void;
  /** Whether it's the user's turn */
  isMyTurn?: boolean;
  /** Timer value (for urgent coloring) */
  timer?: number;
  /** Whether to show draft-specific controls */
  isDraftMode?: boolean;
  /** Whether the draft has started (affects warning message) */
  isDraftStarted?: boolean;
  /** Custom title (overrides logo) */
  title?: string;
  /** Whether to show back button */
  showBack?: boolean;
  /** Whether to show menu button */
  showMenu?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NavbarVX({
  onBack,
  onLeaveDraft,
  isMyTurn = false,
  timer = 30,
  isDraftMode = true,
  isDraftStarted = false,
  title,
  showBack = true,
  showMenu = false,
}: NavbarVXProps): React.ReactElement {
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Determine background color based on state
  const isUrgent = isMyTurn && timer <= 10;
  const backgroundColor = isUrgent ? STATE_COLORS.onTheClock : undefined;

  const handleBackClick = () => {
    if (isDraftMode) {
      setShowLeaveModal(true);
    } else {
      onBack?.();
    }
  };

  const confirmLeave = () => {
    setShowLeaveModal(false);
    onLeaveDraft?.();
  };

  return (
    <>
      <nav
        className="flex items-center justify-between transition-colors duration-300"
        style={{
          height: `${NAVBAR_PX.height}px`,
          paddingLeft: `${NAVBAR_PX.paddingX}px`,
          paddingRight: `${NAVBAR_PX.paddingX}px`,
          background: backgroundColor || `url(/wr_blue.png) no-repeat center center`,
          backgroundSize: 'cover',
          position: 'relative',
          zIndex: Z_INDEX.sticky,
        }}
      >
        {/* Left Section */}
        <div 
          className="flex items-center" 
          style={{ width: `${NAVBAR_PX.buttonSize}px` }}
        >
          {showBack && (
            <button
              onClick={handleBackClick}
              className="flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              style={{
                width: `${NAVBAR_PX.buttonSize}px`,
                height: `${NAVBAR_PX.buttonSize}px`,
              }}
              aria-label="Go back"
            >
              <svg
                width={NAVBAR_PX.iconSize}
                height={NAVBAR_PX.iconSize}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 19L8 12L15 5"
                  stroke="white"
                  strokeWidth={NAVBAR_PX.iconStrokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Center - Logo or Title */}
        <div className="flex-1 flex items-center justify-center h-full">
          {title ? (
            <span 
              className="text-white font-bold"
              style={{ fontSize: `${NAVBAR_PX.titleFontSize}px` }}
            >
              {title}
            </span>
          ) : (
            <button
              onClick={handleBackClick}
              className="flex items-center justify-center"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
              aria-label="Leave draft and go to Lobby"
            >
              <img
                src="/logo.png"
                alt="TopDog"
                style={{
                  height: `${NAVBAR_PX.logoHeight}px`,
                  width: 'auto',
                  display: 'block',
                }}
              />
            </button>
          )}
        </div>

        {/* Right Section */}
        <div 
          className="flex items-center" 
          style={{ width: `${NAVBAR_PX.buttonSize}px` }}
        >
          {showMenu && (
            <button
              className="flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              style={{
                width: `${NAVBAR_PX.buttonSize}px`,
                height: `${NAVBAR_PX.buttonSize}px`,
              }}
              aria-label="Menu"
            >
              <svg
                width={NAVBAR_PX.iconSize}
                height={NAVBAR_PX.iconSize}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6H20M4 12H20M4 18H20"
                  stroke="white"
                  strokeWidth={NAVBAR_PX.menuIconStrokeWidth}
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Leave Draft / Withdraw Entry Modal */}
      {showLeaveModal && (
        <LeaveConfirmModal
          onConfirm={confirmLeave}
          onCancel={() => setShowLeaveModal(false)}
          isDraftStarted={isDraftStarted}
        />
      )}
    </>
  );
}

// ============================================================================
// LEAVE CONFIRM MODAL
// ============================================================================

interface LeaveConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  /** Whether the draft has started - affects warning message */
  isDraftStarted?: boolean;
}

function LeaveConfirmModal({ onConfirm, onCancel, isDraftStarted = false }: LeaveConfirmModalProps): React.ReactElement {
  // Different messaging based on draft state
  const title = isDraftStarted ? 'Leave Draft?' : 'Withdraw Entry?';
  const message = isDraftStarted 
    ? 'Are you sure you want to leave? Autodraft will take over for your remaining picks.'
    : 'Are you sure you want to withdraw? Your entry fee will be refunded and your spot will be released.';
  const cancelText = isDraftStarted ? 'Stay' : 'Cancel';
  const confirmText = isDraftStarted ? 'Leave' : 'Withdraw';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: Z_INDEX.modal,
        padding: `${NAVBAR_PX.paddingX}px`,
      }}
      onClick={onCancel}
    >
      <div
        className="w-full overflow-hidden shadow-2xl"
        style={{ 
          backgroundColor: BG_COLORS.secondary,
          maxWidth: `${NAVBAR_PX.modalMaxWidth}px`,
          borderRadius: `${NAVBAR_PX.modalBorderRadius}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="border-b border-white/10"
          style={{
            paddingLeft: `${NAVBAR_PX.modalPaddingX}px`,
            paddingRight: `${NAVBAR_PX.modalPaddingX}px`,
            paddingTop: `${NAVBAR_PX.modalPaddingY}px`,
            paddingBottom: `${NAVBAR_PX.modalPaddingY}px`,
          }}
        >
          <h2 
            className="text-white font-bold text-center"
            style={{ fontSize: `${NAVBAR_PX.modalTitleFontSize}px` }}
          >
            {title}
          </h2>
        </div>

        {/* Content */}
        <div
          style={{
            paddingLeft: `${NAVBAR_PX.modalPaddingX}px`,
            paddingRight: `${NAVBAR_PX.modalPaddingX}px`,
            paddingTop: `${NAVBAR_PX.modalPaddingY}px`,
            paddingBottom: `${NAVBAR_PX.modalPaddingY}px`,
          }}
        >
          <p 
            className="text-gray-300 text-center"
            style={{ fontSize: `${NAVBAR_PX.modalBodyFontSize}px` }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div
          className="flex"
          style={{
            paddingLeft: `${NAVBAR_PX.modalPaddingX}px`,
            paddingRight: `${NAVBAR_PX.modalPaddingX}px`,
            paddingTop: `${NAVBAR_PX.modalPaddingY}px`,
            paddingBottom: `${NAVBAR_PX.modalPaddingY}px`,
            gap: `${NAVBAR_PX.modalButtonGap}px`,
          }}
        >
          <button
            onClick={onCancel}
            className="flex-1 font-medium transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              height: `${NAVBAR_PX.modalButtonHeight}px`,
              borderRadius: `${NAVBAR_PX.modalButtonRadius}px`,
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-medium transition-colors"
            style={{
              backgroundColor: '#EF4444',
              color: 'white',
              height: `${NAVBAR_PX.modalButtonHeight}px`,
              borderRadius: `${NAVBAR_PX.modalButtonRadius}px`,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

