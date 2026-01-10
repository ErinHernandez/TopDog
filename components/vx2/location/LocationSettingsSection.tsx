/**
 * Location Settings Section
 * 
 * Settings panel for managing location tracking preferences.
 * Shows consent status, trusted locations, and security options.
 */

import { useState } from 'react';
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS, STATE_COLORS } from '@/components/vx2/core/constants/colors';
import { SPACING, RADIUS } from '@/components/vx2/core/constants/sizes';
import { useLocationConsent } from './hooks/useLocationConsent';
import { useLocationTracking } from './hooks/useLocationTracking';
import { LocationConsentModal } from './LocationConsentModal';
import { getFlagDisplayName } from '@/lib/customization/flags';

export function LocationSettingsSection() {
  const { consent, isGranted, grantConsent, revokeConsent } = useLocationConsent();
  const { knownLocations, trustLocation, removeTrust, userLocations } = useLocationTracking();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  
  const handleRevoke = async () => {
    if (!window.confirm('Are you sure you want to disable location tracking? This will remove some customization options.')) {
      return;
    }
    
    setIsRevoking(true);
    try {
      await revokeConsent();
    } finally {
      setIsRevoking(false);
    }
  };
  
  return (
    <div 
      style={{ 
        backgroundColor: BG_COLORS.tertiary,
        borderRadius: RADIUS.lg,
        border: `1px solid ${BORDER_COLORS.light}`,
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between"
        style={{ 
          padding: SPACING.lg,
          borderBottom: `1px solid ${BORDER_COLORS.light}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
          >
            <svg 
              width={20} 
              height={20} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#3B82F6" 
              strokeWidth={2}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <h3 
              className="font-semibold"
              style={{ color: TEXT_COLORS.primary }}
            >
              Location Tracking
            </h3>
            <p 
              className="text-sm"
              style={{ color: TEXT_COLORS.secondary }}
            >
              {isGranted ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
        
        {/* Toggle button */}
        {isGranted ? (
          <button
            onClick={handleRevoke}
            disabled={isRevoking}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: STATE_COLORS.error,
              opacity: isRevoking ? 0.5 : 1,
            }}
          >
            {isRevoking ? 'Disabling...' : 'Disable'}
          </button>
        ) : (
          <button
            onClick={() => setShowConsentModal(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{
              backgroundColor: STATE_COLORS.success,
              color: '#FFFFFF',
            }}
          >
            Enable
          </button>
        )}
      </div>
      
      {/* Content */}
      <div style={{ padding: SPACING.lg }}>
        {isGranted ? (
          <>
            {/* Stats */}
            <div 
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div 
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: BG_COLORS.secondary }}
              >
                <div 
                  className="text-2xl font-bold"
                  style={{ color: TEXT_COLORS.primary }}
                >
                  {userLocations.countries.length}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: TEXT_COLORS.secondary }}
                >
                  Countries
                </div>
              </div>
              <div 
                className="text-center p-4 rounded-lg"
                style={{ backgroundColor: BG_COLORS.secondary }}
              >
                <div 
                  className="text-2xl font-bold"
                  style={{ color: TEXT_COLORS.primary }}
                >
                  {userLocations.states.length}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: TEXT_COLORS.secondary }}
                >
                  US States
                </div>
              </div>
            </div>
            
            {/* Trusted locations */}
            <div>
              <h4 
                className="text-sm font-semibold mb-3"
                style={{ color: TEXT_COLORS.primary }}
              >
                Known Locations
              </h4>
              
              {knownLocations.length === 0 ? (
                <p 
                  className="text-sm"
                  style={{ color: TEXT_COLORS.muted }}
                >
                  No locations recorded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {knownLocations.slice(0, 5).map((loc) => (
                    <div 
                      key={loc.code}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: BG_COLORS.secondary }}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={`/flags/${loc.code.startsWith('US-') ? 'states' : 'countries'}/${loc.code.replace('US-', '').toLowerCase()}.svg`}
                          alt=""
                          className="w-6 h-4 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span 
                          className="text-sm"
                          style={{ color: TEXT_COLORS.primary }}
                        >
                          {getFlagDisplayName(loc.code)}
                        </span>
                        {loc.isTrusted && (
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{ 
                              backgroundColor: 'rgba(16, 185, 129, 0.2)',
                              color: STATE_COLORS.success,
                            }}
                          >
                            Trusted
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => loc.isTrusted ? removeTrust(loc.code) : trustLocation(loc.code)}
                        className="text-xs px-2 py-1 rounded transition-colors"
                        style={{ 
                          color: loc.isTrusted ? TEXT_COLORS.muted : STATE_COLORS.success,
                        }}
                      >
                        {loc.isTrusted ? 'Remove Trust' : 'Trust'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Privacy info */}
            <p 
              className="text-xs mt-6"
              style={{ color: TEXT_COLORS.muted }}
            >
              Location data is used for account security and customization features.
              Only country/state level is tracked, never precise coordinates.
            </p>
          </>
        ) : (
          <div className="text-center py-4">
            <p 
              className="text-sm mb-4"
              style={{ color: TEXT_COLORS.secondary }}
            >
              Enable location tracking to unlock flag customizations and improve account security.
            </p>
            <ul 
              className="text-sm text-left space-y-2"
              style={{ color: TEXT_COLORS.muted }}
            >
              <li className="flex items-center gap-2">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Collect flags from visited locations
              </li>
              <li className="flex items-center gap-2">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Get alerts for suspicious login attempts
              </li>
              <li className="flex items-center gap-2">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Protect your drafts from unauthorized access
              </li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Consent modal */}
      <LocationConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        context="app_open"
      />
    </div>
  );
}

export default LocationSettingsSection;
