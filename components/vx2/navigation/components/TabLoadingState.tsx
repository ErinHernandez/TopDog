/**
 * TabLoadingState - Loading Skeleton for Tabs
 * 
 * Displays while tab content is being lazy-loaded.
 * Shows tab-specific skeleton UI.
 */

import React from 'react';
import type { TabId } from '../../core/types';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS } from '../../core/constants/sizes';
import { TAB_DISPLAY_NAMES } from '../../core/types/navigation';

// ============================================================================
// TYPES
// ============================================================================

export interface TabLoadingStateProps {
  /** Tab that is loading */
  tabId: TabId;
  /** Custom message */
  message?: string;
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
  className?: string;
}

function Skeleton({ 
  width = '100%', 
  height = 16, 
  borderRadius = RADIUS.md,
  className = '',
}: SkeletonProps): React.ReactElement {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: `${borderRadius}px`,
      }}
    />
  );
}

// ============================================================================
// TAB-SPECIFIC SKELETONS
// ============================================================================

function LobbyLoadingSkeleton(): React.ReactElement {
  return (
    <div className="p-4 space-y-4">
      {/* Tournament card skeleton */}
      <div 
        className="rounded-lg p-4"
        style={{ 
          backgroundColor: BG_COLORS.secondary,
          borderRadius: `${RADIUS.lg}px`,
        }}
      >
        <Skeleton width={200} height={24} className="mb-4" />
        <Skeleton width="100%" height={120} className="mb-4" />
        <div className="flex justify-between">
          <Skeleton width={80} height={32} />
          <Skeleton width={100} height={32} />
        </div>
      </div>
      
      {/* Additional cards */}
      {[1, 2].map((i) => (
        <div 
          key={i}
          className="rounded-lg p-4"
          style={{ backgroundColor: BG_COLORS.secondary }}
        >
          <Skeleton width={150} height={20} className="mb-3" />
          <Skeleton width="100%" height={16} className="mb-2" />
          <Skeleton width="60%" height={16} />
        </div>
      ))}
    </div>
  );
}

function LiveDraftsLoadingSkeleton(): React.ReactElement {
  return (
    <div className="p-4 space-y-3">
      {/* Draft cards */}
      {[1, 2, 3].map((i) => (
        <div 
          key={i}
          className="rounded-lg p-4"
          style={{ backgroundColor: BG_COLORS.secondary }}
        >
          <div className="flex justify-between mb-3">
            <Skeleton width={120} height={18} />
            <Skeleton width={60} height={18} />
          </div>
          <Skeleton width="80%" height={14} className="mb-2" />
          <div className="flex gap-2 mt-3">
            <Skeleton width={80} height={32} />
            <Skeleton width={80} height={32} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MyTeamsLoadingSkeleton(): React.ReactElement {
  return (
    <div className="p-4">
      {/* Search bar */}
      <Skeleton width="100%" height={44} className="mb-4" />
      
      {/* Team list */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            className="rounded-lg p-4 flex justify-between items-center"
            style={{ backgroundColor: BG_COLORS.secondary }}
          >
            <Skeleton width={150} height={18} />
            <Skeleton width={24} height={24} borderRadius={RADIUS.full} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ExposureLoadingSkeleton(): React.ReactElement {
  return (
    <div className="p-4">
      {/* Header stats */}
      <div className="flex gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1">
            <Skeleton width="100%" height={60} />
          </div>
        ))}
      </div>
      
      {/* Player list */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i}
            className="flex items-center gap-3 p-3"
            style={{ backgroundColor: BG_COLORS.secondary, borderRadius: `${RADIUS.md}px` }}
          >
            <Skeleton width={36} height={36} borderRadius={RADIUS.full} />
            <div className="flex-1">
              <Skeleton width={120} height={14} className="mb-1" />
              <Skeleton width={80} height={12} />
            </div>
            <Skeleton width={50} height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileLoadingSkeleton(): React.ReactElement {
  return (
    <div className="p-4">
      {/* Avatar placeholder */}
      <div className="flex justify-center mb-6">
        <Skeleton width={100} height={120} borderRadius={RADIUS.lg} />
      </div>
      
      {/* Menu items */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton 
            key={i} 
            width="100%" 
            height={52} 
            borderRadius={RADIUS.md} 
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TabLoadingState({ 
  tabId,
  message,
}: TabLoadingStateProps): React.ReactElement {
  // Tab-specific skeleton
  const renderSkeleton = () => {
    switch (tabId) {
      case 'lobby':
        return <LobbyLoadingSkeleton />;
      case 'live-drafts':
        return <LiveDraftsLoadingSkeleton />;
      case 'my-teams':
        return <MyTeamsLoadingSkeleton />;
      case 'exposure':
        return <ExposureLoadingSkeleton />;
      case 'profile':
        return <ProfileLoadingSkeleton />;
      default:
        return <GenericLoadingSkeleton />;
    }
  };
  
  return (
    <div 
      className="flex-1 flex flex-col"
      style={{ backgroundColor: BG_COLORS.primary }}
      role="status"
      aria-label={`Loading ${TAB_DISPLAY_NAMES[tabId]}`}
    >
      {message && (
        <div 
          className="text-center py-4"
          style={{ color: TEXT_COLORS.secondary }}
        >
          {message}
        </div>
      )}
      
      {renderSkeleton()}
      
      {/* Screen reader text */}
      <span className="sr-only">
        Loading {TAB_DISPLAY_NAMES[tabId]}...
      </span>
    </div>
  );
}

// Generic fallback skeleton
function GenericLoadingSkeleton(): React.ReactElement {
  return (
    <div className="p-4 space-y-4">
      <Skeleton width="60%" height={24} />
      <Skeleton width="100%" height={100} />
      <Skeleton width="100%" height={60} />
      <Skeleton width="80%" height={40} />
    </div>
  );
}

