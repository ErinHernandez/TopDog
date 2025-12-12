/**
 * VX Avatar Component
 * 
 * User and team avatars with fallback support.
 */

import React, { useState } from 'react';
import { TEXT_COLORS, BG_COLORS } from '../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** Image source */
  src?: string;
  /** Alt text */
  alt?: string;
  /** Display name (for fallback) */
  name?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Custom size in pixels */
  customSize?: number;
  /** Shape */
  shape?: 'circle' | 'square';
  /** Status indicator */
  status?: 'online' | 'offline' | 'away' | 'busy';
  /** Custom fallback */
  fallback?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export interface AvatarGroupProps {
  /** Array of avatar props */
  avatars: Omit<AvatarProps, 'size'>[];
  /** Max avatars to show */
  max?: number;
  /** Avatar size */
  size?: AvatarSize;
  /** Custom className */
  className?: string;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES: Record<AvatarSize, { size: number; fontSize: number; statusSize: number }> = {
  xs: { size: 24, fontSize: 10, statusSize: 6 },
  sm: { size: 32, fontSize: 12, statusSize: 8 },
  md: { size: 40, fontSize: 14, statusSize: 10 },
  lg: { size: 56, fontSize: 18, statusSize: 12 },
  xl: { size: 80, fontSize: 24, statusSize: 16 },
};

// ============================================================================
// STATUS COLORS
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  online: '#10B981',
  offline: '#6B7280',
  away: '#F59E0B',
  busy: '#EF4444',
};

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getBackgroundColor(name: string): string {
  if (!name) return BG_COLORS.elevated;
  
  // Generate consistent color from name
  const colors = [
    '#F472B6', // Pink
    '#0fba80', // Green
    '#FBBF25', // Gold
    '#7C3AED', // Purple
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#F97316', // Orange
    '#06B6D4', // Cyan
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  customSize,
  shape = 'circle',
  status,
  fallback,
  className = '',
  onClick,
}: AvatarProps): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  const sizeStyle = SIZE_STYLES[size];
  const pixelSize = customSize || sizeStyle.size;

  const containerStyle: React.CSSProperties = {
    width: pixelSize,
    height: pixelSize,
    borderRadius: shape === 'circle' ? '50%' : '8px',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    cursor: onClick ? 'pointer' : 'default',
  };

  const renderContent = () => {
    if (src && !hasError) {
      return (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      );
    }

    if (fallback) {
      return fallback;
    }

    // Initials fallback
    return (
      <div
        className="w-full h-full flex items-center justify-center font-semibold"
        style={{
          backgroundColor: getBackgroundColor(name || ''),
          color: '#ffffff',
          fontSize: customSize ? customSize / 2.5 : sizeStyle.fontSize,
        }}
      >
        {getInitials(name || '')}
      </div>
    );
  };

  return (
    <div
      className={`inline-block ${className}`}
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {renderContent()}
      
      {/* Status indicator */}
      {status && (
        <div
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: customSize ? customSize / 4 : sizeStyle.statusSize,
            height: customSize ? customSize / 4 : sizeStyle.statusSize,
            backgroundColor: STATUS_COLORS[status],
            borderColor: BG_COLORS.primary,
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// AVATAR GROUP
// ============================================================================

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  className = '',
}: AvatarGroupProps): React.ReactElement {
  const sizeStyle = SIZE_STYLES[size];
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className="ring-2 ring-[#101927] rounded-full"
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className="flex items-center justify-center rounded-full ring-2 ring-[#101927] font-semibold"
          style={{
            width: sizeStyle.size,
            height: sizeStyle.size,
            fontSize: sizeStyle.fontSize,
            backgroundColor: BG_COLORS.elevated,
            color: TEXT_COLORS.secondary,
            zIndex: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USER AVATAR (with default user icon)
// ============================================================================

export function UserAvatar(props: Omit<AvatarProps, 'fallback'>): React.ReactElement {
  return (
    <Avatar
      {...props}
      fallback={
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: BG_COLORS.elevated }}
        >
          <svg
            className="w-1/2 h-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke={TEXT_COLORS.muted}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      }
    />
  );
}

