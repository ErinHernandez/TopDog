/**
 * TournamentCardVX - Mobile Tournament Card Component (TypeScript)
 * 
 * Migrated from: components/mobile/TournamentCardMobile.js
 * 
 * Displays tournament information in a mobile-optimized card format
 */

import React from 'react';

// ============================================================================
// PIXEL-PERFECT CONSTANTS
// ============================================================================

const CARD_PX = {
  // Main card dimensions
  width: 320,
  height: 522,
  borderRadius: 16,
  borderWidth: 1,
  
  // Title section
  titleTop: 114,
  titleSvgWidth: 260,
  titleSvgHeight: 100,
  titleFontSize: 36,
  titleLetterSpacing: 2,
  titleStrokeWidth: 0.8,
  titleLine1Y: -48,
  titleLine2Y: -2,
  
  // Logo section
  logoTop: 126,
  logoSize: 227,
  logoBorderRadius: 14.4,
  
  // Button section
  buttonTop: 370,
  buttonPaddingY: 12,
  buttonPaddingX: 32,
  buttonFontSize: 16,
  buttonBorderRadius: 12,
  
  // Stats section
  statsBottom: 12,
  statsPaddingX: 16,
  statsGap: 20,
  statsValueFontSize: 20,
  statsLabelFontSize: 14,
} as const;

const COMPACT_PX = {
  // Container
  padding: 16,
  marginX: 16,
  marginY: 8,
  borderRadius: 12,
  
  // Title
  titleFontSize: 18,
  titleMarginBottom: 16,
  
  // Button
  buttonPaddingY: 8,
  buttonPaddingX: 16,
  buttonFontSize: 14,
  buttonBorderRadius: 8,
  buttonMarginLeft: 16,
  
  // Stats
  statsGap: 8,
  statsValueFontSize: 14,
  statsLabelFontSize: 12,
} as const;

const PROGRESS_PX = {
  // Container
  padding: 24,
  marginX: 16,
  marginY: 16,
  borderRadius: 16,
  
  // Title
  titleFontSize: 24,
  titleMarginBottom: 24,
  
  // Progress bar
  progressHeight: 8,
  progressBorderRadius: 4,
  progressMarginBottom: 16,
  progressLabelFontSize: 14,
  progressLabelMarginBottom: 8,
  
  // Button
  buttonHeight: 48,
  buttonFontSize: 16,
  buttonBorderRadius: 12,
  buttonMarginBottom: 24,
  
  // Stats
  statsGap: 16,
  statsValueFontSize: 24,
  statsValueMarginBottom: 4,
  statsLabelFontSize: 14,
} as const;

// Colors
const COLORS = {
  teal: '#14b8a6',
  tealHover: '#0d9488',
  cardBg: 'rgba(31, 41, 55, 0.9)',
  cardBorder: 'rgba(75, 85, 99, 0.5)',
  textWhite: '#ffffff',
  textGray: '#9ca3af',
  progressBg: '#374151',
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface TournamentCardVXProps {
  title?: string;
  entryFee?: string;
  totalEntries?: string;
  firstPlacePrize?: string;
  onJoinClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface TournamentCardCompactVXProps {
  title?: string;
  entryFee?: string;
  totalEntries?: string;
  firstPlacePrize?: string;
  onJoinClick?: () => void;
  className?: string;
}

export interface TournamentCardWithProgressVXProps {
  title?: string;
  entryFee?: string;
  currentEntries?: number;
  maxEntries?: number;
  firstPlacePrize?: string;
  onJoinClick?: () => void;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TournamentCardVX({
  title = "THE TOPDOG INTERNATIONAL",
  entryFee = "$25",
  totalEntries = "571,480",
  firstPlacePrize = "$2M",
  onJoinClick,
  className = "",
  style = {}
}: TournamentCardVXProps): React.ReactElement {
  return (
    <div 
      className={`relative ${className}`} 
      style={{ 
        width: `${CARD_PX.width}px`, 
        height: `${CARD_PX.height}px`, 
        marginLeft: 'auto', 
        marginRight: 'auto',
        backgroundColor: COLORS.cardBg,
        borderRadius: `${CARD_PX.borderRadius}px`,
        border: `${CARD_PX.borderWidth}px solid ${COLORS.cardBorder}`,
        ...style 
      }}
    >
      {/* Tournament Title - Two lines with teal stroke */}
      <div 
        className="absolute text-center" 
        style={{ 
          top: `${CARD_PX.titleTop}px`, 
          left: '50%', 
          transform: 'translateX(-50%)' 
        }}
      >
        <svg 
          width={CARD_PX.titleSvgWidth} 
          height={CARD_PX.titleSvgHeight} 
          viewBox={`0 0 ${CARD_PX.titleSvgWidth} ${CARD_PX.titleSvgHeight}`} 
          style={{ overflow: 'visible' }}
        >
          <text 
            fill={COLORS.textWhite}
            fontWeight="700" 
            style={{ 
              letterSpacing: `${CARD_PX.titleLetterSpacing}px`, 
              fontFamily: 'Anton SC, sans-serif', 
              paintOrder: 'stroke fill' 
            }} 
            stroke={COLORS.teal}
            strokeWidth={CARD_PX.titleStrokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            fontSize={CARD_PX.titleFontSize}
            x={CARD_PX.titleSvgWidth / 2}
            y={CARD_PX.titleLine1Y}
            textAnchor="middle"
          >
            The TopDog
          </text>
          <text 
            fill={COLORS.textWhite}
            fontWeight="800" 
            style={{ 
              letterSpacing: `${CARD_PX.titleLetterSpacing}px`, 
              fontFamily: 'Anton SC, sans-serif', 
              paintOrder: 'stroke fill' 
            }} 
            stroke={COLORS.teal}
            strokeWidth={CARD_PX.titleStrokeWidth}
            strokeLinejoin="round" 
            strokeLinecap="round" 
            fontSize={CARD_PX.titleFontSize}
            x={CARD_PX.titleSvgWidth / 2}
            y={CARD_PX.titleLine2Y}
            textAnchor="middle"
          >
            International
          </text>
        </svg>
      </div>

      {/* Tournament Logo */}
      <div 
        className="absolute" 
        style={{ 
          top: `${CARD_PX.logoTop}px`, 
          left: '50%', 
          transform: 'translateX(-50%)' 
        }}
      >
        <div 
          className="flex items-center justify-center" 
          style={{ 
            width: `${CARD_PX.logoSize}px`, 
            height: `${CARD_PX.logoSize}px`,
            borderRadius: `${CARD_PX.logoBorderRadius}px`,
          }}
        >
          <img 
            src="/Teal_Earth_irelandcenter.png" 
            alt="Tournament Graphic"
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              borderRadius: `${CARD_PX.logoBorderRadius}px`,
            }}
          />
        </div>
      </div>

      {/* Join Tournament Button */}
      <div 
        className="absolute" 
        style={{ 
          top: `${CARD_PX.buttonTop}px`, 
          left: '50%', 
          transform: 'translateX(-50%)' 
        }}
      >
        <button
          onClick={onJoinClick}
          className="font-semibold shadow-lg transition-colors duration-200"
          style={{ 
            backgroundColor: COLORS.teal,
            color: COLORS.textWhite,
            padding: `${CARD_PX.buttonPaddingY}px ${CARD_PX.buttonPaddingX}px`,
            fontSize: `${CARD_PX.buttonFontSize}px`,
            borderRadius: `${CARD_PX.buttonBorderRadius}px`,
            whiteSpace: 'nowrap',
          }}
        >
          Join Tournament
        </button>
      </div>

      {/* Tournament Stats */}
      <div 
        className="absolute" 
        style={{ 
          bottom: `${CARD_PX.statsBottom}px`, 
          left: 0, 
          right: 0, 
          padding: `0 ${CARD_PX.statsPaddingX}px` 
        }}
      >
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: `${CARD_PX.statsGap}px`, 
            textAlign: 'center' 
          }}
        >
          <div>
            <div 
              className="font-bold" 
              style={{ fontSize: `${CARD_PX.statsValueFontSize}px`, color: COLORS.textWhite }}
            >
              {entryFee}
            </div>
            <div style={{ fontSize: `${CARD_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
              Entry
            </div>
          </div>
          <div>
            <div 
              className="font-bold" 
              style={{ fontSize: `${CARD_PX.statsValueFontSize}px`, color: COLORS.textWhite }}
            >
              {totalEntries}
            </div>
            <div style={{ fontSize: `${CARD_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
              Entries
            </div>
          </div>
          <div>
            <div 
              className="font-bold" 
              style={{ fontSize: `${CARD_PX.statsValueFontSize}px`, color: COLORS.textWhite }}
            >
              {firstPlacePrize}
            </div>
            <div style={{ fontSize: `${CARD_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
              1st Place
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

/**
 * Compact Mobile Tournament Card
 * For use in lists or smaller spaces
 */
export function TournamentCardCompactVX({
  title = "THE TOPDOG INTERNATIONAL",
  entryFee = "$25",
  totalEntries = "571,480",
  firstPlacePrize = "$2M",
  onJoinClick,
  className = ""
}: TournamentCardCompactVXProps): React.ReactElement {
  return (
    <div 
      className={className}
      style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: `${COMPACT_PX.borderRadius}px`,
        border: `1px solid ${COLORS.cardBorder}`,
        padding: `${COMPACT_PX.padding}px`,
        marginLeft: `${COMPACT_PX.marginX}px`,
        marginRight: `${COMPACT_PX.marginX}px`,
        marginTop: `${COMPACT_PX.marginY}px`,
        marginBottom: `${COMPACT_PX.marginY}px`,
      }}
    >
      {/* Title and Button Row */}
      <div 
        className="flex items-center justify-between"
        style={{ marginBottom: `${COMPACT_PX.titleMarginBottom}px` }}
      >
        <h3 
          className="font-bold flex-1"
          style={{ 
            fontSize: `${COMPACT_PX.titleFontSize}px`, 
            color: COLORS.textWhite 
          }}
        >
          {title}
        </h3>
        <button
          onClick={onJoinClick}
          className="font-medium transition-colors duration-200"
          style={{ 
            backgroundColor: COLORS.teal,
            color: COLORS.textWhite,
            padding: `${COMPACT_PX.buttonPaddingY}px ${COMPACT_PX.buttonPaddingX}px`,
            fontSize: `${COMPACT_PX.buttonFontSize}px`,
            borderRadius: `${COMPACT_PX.buttonBorderRadius}px`,
            marginLeft: `${COMPACT_PX.buttonMarginLeft}px`,
          }}
        >
          Join
        </button>
      </div>

      {/* Stats Row */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: `${COMPACT_PX.statsGap}px`, 
          textAlign: 'center' 
        }}
      >
        <div>
          <div 
            className="font-bold" 
            style={{ fontSize: `${COMPACT_PX.statsValueFontSize}px`, color: COLORS.textWhite }}
          >
            {entryFee}
          </div>
          <div style={{ fontSize: `${COMPACT_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
            Entry
          </div>
        </div>
        <div>
          <div 
            className="font-bold" 
            style={{ fontSize: `${COMPACT_PX.statsValueFontSize}px`, color: COLORS.textWhite }}
          >
            {totalEntries}
          </div>
          <div style={{ fontSize: `${COMPACT_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
            Entries
          </div>
        </div>
        <div>
          <div 
            className="font-bold" 
            style={{ fontSize: `${COMPACT_PX.statsValueFontSize}px`, color: COLORS.textWhite }}
          >
            {firstPlacePrize}
          </div>
          <div style={{ fontSize: `${COMPACT_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
            1st Place
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS VARIANT
// ============================================================================

/**
 * Mobile Tournament Card with Progress Bar
 * Shows tournament fill status
 */
export function TournamentCardWithProgressVX({
  title = "THE TOPDOG INTERNATIONAL",
  entryFee = "$25",
  currentEntries = 571480,
  maxEntries = 672672,
  firstPlacePrize = "$2M",
  onJoinClick,
  className = ""
}: TournamentCardWithProgressVXProps): React.ReactElement {
  const fillPercentage = Math.round((currentEntries / maxEntries) * 100);
  const entriesText = currentEntries.toLocaleString();
  
  return (
    <div 
      className={className}
      style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: `${PROGRESS_PX.borderRadius}px`,
        border: `1px solid ${COLORS.cardBorder}`,
        padding: `${PROGRESS_PX.padding}px`,
        marginLeft: `${PROGRESS_PX.marginX}px`,
        marginRight: `${PROGRESS_PX.marginX}px`,
        marginTop: `${PROGRESS_PX.marginY}px`,
        marginBottom: `${PROGRESS_PX.marginY}px`,
      }}
    >
      {/* Tournament Title */}
      <div 
        className="text-center"
        style={{ marginBottom: `${PROGRESS_PX.titleMarginBottom}px` }}
      >
        <h2 
          className="font-bold leading-tight"
          style={{ 
            fontSize: `${PROGRESS_PX.titleFontSize}px`, 
            color: COLORS.textWhite 
          }}
        >
          {title}
        </h2>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: `${PROGRESS_PX.progressMarginBottom}px` }}>
        <div 
          className="flex justify-between"
          style={{ 
            fontSize: `${PROGRESS_PX.progressLabelFontSize}px`, 
            color: COLORS.textGray,
            marginBottom: `${PROGRESS_PX.progressLabelMarginBottom}px`,
          }}
        >
          <span>Tournament Fill</span>
          <span>{fillPercentage}% Full</span>
        </div>
        <div 
          className="w-full"
          style={{ 
            backgroundColor: COLORS.progressBg,
            borderRadius: `${PROGRESS_PX.progressBorderRadius}px`,
            height: `${PROGRESS_PX.progressHeight}px`,
          }}
        >
          <div 
            className="transition-all duration-300"
            style={{ 
              width: `${fillPercentage}%`,
              backgroundColor: COLORS.teal,
              height: `${PROGRESS_PX.progressHeight}px`,
              borderRadius: `${PROGRESS_PX.progressBorderRadius}px`,
            }}
          />
        </div>
      </div>

      {/* Join Tournament Button */}
      <div 
        className="flex justify-center"
        style={{ marginBottom: `${PROGRESS_PX.buttonMarginBottom}px` }}
      >
        <button
          onClick={onJoinClick}
          className="w-full font-semibold shadow-lg transition-colors duration-200"
          style={{ 
            backgroundColor: COLORS.teal,
            color: COLORS.textWhite,
            height: `${PROGRESS_PX.buttonHeight}px`,
            fontSize: `${PROGRESS_PX.buttonFontSize}px`,
            borderRadius: `${PROGRESS_PX.buttonBorderRadius}px`,
          }}
        >
          Join Tournament
        </button>
      </div>

      {/* Tournament Stats */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: `${PROGRESS_PX.statsGap}px`, 
          textAlign: 'center' 
        }}
      >
        <div>
          <div 
            className="font-bold" 
            style={{ 
              fontSize: `${PROGRESS_PX.statsValueFontSize}px`, 
              color: COLORS.textWhite,
              marginBottom: `${PROGRESS_PX.statsValueMarginBottom}px`,
            }}
          >
            {entryFee}
          </div>
          <div style={{ fontSize: `${PROGRESS_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
            Entry
          </div>
        </div>
        <div>
          <div 
            className="font-bold" 
            style={{ 
              fontSize: `${PROGRESS_PX.statsValueFontSize}px`, 
              color: COLORS.textWhite,
              marginBottom: `${PROGRESS_PX.statsValueMarginBottom}px`,
            }}
          >
            {entriesText}
          </div>
          <div style={{ fontSize: `${PROGRESS_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
            Entries
          </div>
        </div>
        <div>
          <div 
            className="font-bold" 
            style={{ 
              fontSize: `${PROGRESS_PX.statsValueFontSize}px`, 
              color: COLORS.textWhite,
              marginBottom: `${PROGRESS_PX.statsValueMarginBottom}px`,
            }}
          >
            {firstPlacePrize}
          </div>
          <div style={{ fontSize: `${PROGRESS_PX.statsLabelFontSize}px`, color: COLORS.textGray }}>
            1st Place
          </div>
        </div>
      </div>
    </div>
  );
}

