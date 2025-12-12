/**
 * VX Team Logo Component
 * 
 * Reusable NFL team logo with built-in error handling and fallback.
 * Handles missing logos gracefully.
 */

import React, { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamLogoProps {
  /** Team abbreviation (e.g., 'KC', 'BUF') */
  team: string;
  /** Size in pixels or CSS value */
  size?: number | string;
  /** Additional className */
  className?: string;
  /** Custom fallback element */
  fallback?: React.ReactNode;
  /** Alt text override */
  alt?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TeamLogo({
  team,
  size = 40,
  className = '',
  fallback,
  alt,
}: TeamLogoProps): React.ReactElement {
  const [hasError, setHasError] = useState(false);
  
  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const sizeValue = typeof size === 'number' ? `${size}px` : size;
  const teamCode = team?.toLowerCase() || 'unknown';

  // If error occurred, show fallback
  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback: team abbreviation in a circle
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-700 text-gray-400 font-bold ${className}`}
        style={{ 
          width: sizeValue, 
          height: sizeValue,
          fontSize: `calc(${sizeValue} / 3)`,
        }}
        role="img"
        aria-label={`${team} logo`}
      >
        {team?.toUpperCase().slice(0, 3) || '?'}
      </div>
    );
  }

  return (
    <img
      src={`/logos/nfl/${teamCode}.png`}
      alt={alt || `${team} logo`}
      className={`object-contain ${className}`}
      style={{ width: sizeValue, height: sizeValue }}
      onError={handleError}
      loading="lazy"
    />
  );
}

// ============================================================================
// SMALL VARIANT (for inline use)
// ============================================================================

export function TeamLogoSmall({ team, className = '' }: { team: string; className?: string }): React.ReactElement {
  return <TeamLogo team={team} size={24} className={className} />;
}

// ============================================================================
// LARGE VARIANT (for featured use)
// ============================================================================

export function TeamLogoLarge({ team, className = '' }: { team: string; className?: string }): React.ReactElement {
  return <TeamLogo team={team} size={64} className={className} />;
}

