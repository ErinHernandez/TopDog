/**
 * Deprecation Banner Component
 * 
 * Displays a banner warning users that they're on a deprecated draft room version.
 * Used in Phase 4: Draft Version Consolidation.
 * 
 * @example
 * <DeprecationBanner version="v2" migrationDate="2025-03-01" />
 */

import React from 'react';
import { useRouter } from 'next/router';

interface DeprecationBannerProps {
  version: 'v2' | 'v3' | 'vx';
  migrationDate: string;
  roomId?: string;
}

export function DeprecationBanner({ 
  version, 
  migrationDate,
  roomId 
}: DeprecationBannerProps): React.ReactElement {
  const router = useRouter();
  
  const handleMigrate = () => {
    const currentRoomId = roomId || (router.query.roomId as string);
    if (currentRoomId) {
      router.push(`/draft/vx2/${currentRoomId}`);
    }
  };
  
  return (
    <div className="bg-yellow-600 text-white p-4 text-center">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm">
          <strong>⚠️ Deprecated Version:</strong> This draft room version ({version}) is deprecated 
          and will be removed on {migrationDate}.
        </p>
        <button
          onClick={handleMigrate}
          className="bg-white text-yellow-600 px-4 py-2 rounded font-semibold hover:bg-yellow-50 transition-colors"
          aria-label="Switch to vx2 draft room"
        >
          Switch to vx2
        </button>
      </div>
    </div>
  );
}

export default DeprecationBanner;
