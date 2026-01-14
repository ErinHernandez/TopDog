/**
 * VX2 ProfileSettingsModal - User Profile Management
 * 
 * Features:
 * - View and edit profile information
 * - Change username (with audit trail)
 * - Update preferences
 * - Account deletion
 * - Linked accounts management
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../../core/constants/colors';
import { SPACING, TYPOGRAPHY, Z_INDEX } from '../../core/constants/sizes';
import { Close, ChevronLeft, Edit } from '../../components/icons';
import { UsernameInput } from './UsernameInput';
import { useAuth } from '../hooks/useAuth';
import { useUsernameValidation } from '../hooks/useUsernameValidation';
import { RATE_LIMITS } from '../constants';
import { createScopedLogger } from '../../../../lib/clientLogger';
import { fcmService } from '../../../../lib/pushNotifications/fcmService';
import { getAuth } from 'firebase/auth';

const logger = createScopedLogger('[ProfileSettingsModal]');

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountDeleted?: () => void;
}

type ProfileTab = 'profile' | 'preferences' | 'security' | 'delete';

// ============================================================================
// PROFILE TAB
// ============================================================================

interface ProfileTabContentProps {
  onEditName: () => void;
  onAddEmail: () => void;
  onAddPhone: () => void;
}

function ProfileTabContent({ onEditName, onAddEmail, onAddPhone }: ProfileTabContentProps): React.ReactElement {
  const { user, profile, sendVerificationEmail } = useAuth();
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  
  const handleResendVerification = async () => {
    const result = await sendVerificationEmail();
    if (result.success) {
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 30000);
    }
  };

  const displayName = profile?.firstName && profile?.lastName 
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.displayName || null;
  
  // Get inner cell background color from user preferences (default to dark gray)
  // Borders are fixed and not customizable
  const innerCellColor = profile?.preferences?.cellBackgroundColor || BG_COLORS.tertiary;
  
  // Fixed border color (not customizable) - matches unpicked player card border in horizontal scrolling pick bar
  const fixedBorderColor = '#6B7280'; // Gray for unpicked cards (CARD_COLORS.otherPick from PicksBar)
  
  return (
    <div className="space-y-6">
      {/* Customization Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span 
              className="font-medium block"
              style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
            >
              Profile Customization
            </span>
            <span 
              className="block mt-1"
              style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
            >
              Customize player cell backgrounds
            </span>
          </div>
          <button
            onClick={() => router.push('/profile-customization')}
            className="px-3 py-1.5 rounded-lg font-medium text-sm"
            style={{ 
              backgroundColor: STATE_COLORS.active, 
              color: '#000',
            }}
          >
            Customize
          </button>
        </div>
        
        {/* Example Player Box */}
        <div className="flex justify-center">
          <div 
            className="flex-shrink-0 text-sm font-medium flex flex-col"
            style={{ 
              width: '120px',
              height: '140px',
              borderWidth: '6px',
              borderStyle: 'solid',
              borderColor: fixedBorderColor, // Fixed border color - matches unpicked card border
              borderTopWidth: '32px', 
              backgroundColor: innerCellColor, // Customizable inner area
              borderRadius: '11px', 
              overflow: 'visible'
            }}
          >
            {/* Username in border area */}
            <div 
              className="absolute left-0 right-0 font-bold text-center truncate whitespace-nowrap overflow-hidden"
              style={{ 
                fontSize: '12px', 
                color: '#000',
                backgroundColor: 'transparent',
                zIndex: 10,
                padding: '2px',
                top: '-16px', 
                transform: 'translateY(-50%)',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: '100%',
                width: '100%',
                textTransform: 'uppercase'
              }}
            >
              {profile?.username || 'Username'}
            </div>
            
            {/* Customizable inner area (where player name would go) */}
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="text-center"
                style={{
                  fontSize: '12px',
                  color: TEXT_COLORS.muted,
                }}
              >
                Player Name
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar & Username */}
      <div className="flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
          style={{ backgroundColor: STATE_COLORS.active, color: '#000' }}
        >
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <span 
            className="font-bold"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
          >
            {profile?.username || 'No username'}
          </span>
          <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>

      {/* Name */}
      <div 
        className="p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Name
          </span>
          <button
            onClick={onEditName}
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ 
              backgroundColor: 'rgba(96, 165, 250, 0.15)', 
              color: STATE_COLORS.active,
            }}
          >
            {displayName ? 'Edit' : 'Add'}
          </button>
        </div>
        <p style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
          {displayName || 'Not added yet'}
        </p>
      </div>
      
      {/* Email */}
      <div 
        className="p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Email
          </span>
          {user?.email ? (
            user?.emailVerified ? (
            <span 
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: STATE_COLORS.success }}
            >
              Verified
            </span>
          ) : (
            <button
              onClick={handleResendVerification}
              disabled={emailSent}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ 
                backgroundColor: 'rgba(245, 158, 11, 0.15)', 
                color: STATE_COLORS.warning,
                opacity: emailSent ? 0.5 : 1,
              }}
            >
              {emailSent ? 'Email sent' : 'Verify'}
              </button>
            )
          ) : (
            <button
              onClick={onAddEmail}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ 
                backgroundColor: 'rgba(96, 165, 250, 0.15)', 
                color: STATE_COLORS.active,
              }}
            >
              Add
            </button>
          )}
        </div>
        <p style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
          {user?.email || 'Not added yet'}
        </p>
      </div>
      
      {/* Phone */}
        <div 
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Phone
          </span>
          {!user?.phoneNumber && (
            <button
              onClick={onAddPhone}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{ 
                backgroundColor: 'rgba(96, 165, 250, 0.15)', 
                color: STATE_COLORS.active,
              }}
            >
              Add
            </button>
          )}
        </div>
          <p style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
          {user?.phoneNumber || 'Not added yet'}
          </p>
        </div>
      
      {/* Country */}
      <div 
        className="p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <span 
          className="block mb-2"
          style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
        >
          Country
        </span>
        <p style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}>
          {profile?.countryCode || 'Not set'}
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          className="p-4 rounded-xl text-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <span 
            className="block font-bold text-xl"
            style={{ color: TEXT_COLORS.primary }}
          >
            {profile?.tournamentsEntered || 0}
          </span>
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Tournaments
          </span>
        </div>
        <div 
          className="p-4 rounded-xl text-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <span 
            className="block font-bold text-xl"
            style={{ color: STATE_COLORS.success }}
          >
            ${(profile?.totalWinnings || 0).toLocaleString()}
          </span>
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Winnings
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PREFERENCES TAB
// ============================================================================

function PreferencesTabContent(): React.ReactElement {
  const { profile, updateProfile } = useAuth();
  const [preferences, setPreferences] = useState({
    notifications: profile?.preferences?.notifications ?? true,
    emailUpdates: profile?.preferences?.emailUpdates ?? true,
    publicProfile: profile?.preferences?.publicProfile ?? true,
    dynamicIslandEnabled: profile?.preferences?.dynamicIslandEnabled ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dynamicIslandSupported, setDynamicIslandSupported] = useState(false);
  
  // Alert preferences state
  const [alertPreferences, setAlertPreferences] = useState({
    roomFilled: profile?.preferences?.draftAlerts?.roomFilled ?? true,
    draftStarting: profile?.preferences?.draftAlerts?.draftStarting ?? true,
    twoPicksAway: profile?.preferences?.draftAlerts?.twoPicksAway ?? true,
    onTheClock: profile?.preferences?.draftAlerts?.onTheClock ?? true,
    tenSecondsRemaining: profile?.preferences?.draftAlerts?.tenSecondsRemaining ?? true,
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [fcmEnabled, setFcmEnabled] = useState(profile?.preferences?.fcmEnabled ?? false);
  const [fcmInitializing, setFcmInitializing] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  // Check Dynamic Island support on mount
  useEffect(() => {
    // Check iOS and standalone mode
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
      setIsStandalone((window.navigator as any).standalone === true);
    }
    // Check if iOS 16.1+ (Live Activities support)
    const checkSupport = () => {
      if (typeof window === 'undefined') return false;
      const userAgent = navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/.test(userAgent);
      if (!isIOS) return false;
      const match = userAgent.match(/OS (\d+)_(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        return major > 16 || (major === 16 && minor >= 1);
      }
      return false;
    };
    setDynamicIslandSupported(checkSupport());
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);
  
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };
  
  const handleAlertToggle = async (key: keyof typeof alertPreferences) => {
    setSavingKey(key);
    const newValue = !alertPreferences[key];
    setAlertPreferences(prev => ({ ...prev, [key]: newValue }));
    
    try {
      await updateProfile({
        preferences: {
          ...profile?.preferences,
          draftAlerts: {
            ...alertPreferences,
            [key]: newValue,
          },
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to update alert preferences:', error);
      // Revert on error
      setAlertPreferences(prev => ({ ...prev, [key]: !newValue }));
    } finally {
      setSavingKey(null);
    }
  };
  
  const handleToggle = async (key: keyof typeof preferences) => {
    const newValue = !preferences[key];
    setPreferences(prev => ({ ...prev, [key]: newValue }));
    
    // For Dynamic Island, also update localStorage
    if (key === 'dynamicIslandEnabled') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('topdog_dynamic_island_enabled', String(newValue));
      }
    }
    
    setIsSaving(true);
    try {
      await updateProfile({ 
        preferences: { ...profile?.preferences, [key]: newValue } 
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !newValue }));
      if (key === 'dynamicIslandEnabled' && typeof localStorage !== 'undefined') {
        localStorage.setItem('topdog_dynamic_island_enabled', String(!newValue));
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-colors"
      style={{ 
        backgroundColor: checked ? STATE_COLORS.active : 'rgba(255,255,255,0.1)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      role="switch"
      aria-checked={checked}
    >
      <div 
        className="absolute w-5 h-5 rounded-full bg-white transition-transform"
        style={{ 
          top: '2px', 
          left: checked ? '22px' : '2px',
        }}
      />
    </button>
  );
  
  return (
    <div className="space-y-4">
      {saved && (
        <div 
          className="p-3 rounded-lg text-center"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: STATE_COLORS.success }}
        >
          Preferences saved
        </div>
      )}
      
      <div 
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div>
          <span 
            className="block font-medium"
            style={{ color: TEXT_COLORS.primary }}
          >
            Push Notifications
          </span>
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Draft reminders and updates
          </span>
        </div>
        <ToggleSwitch 
          checked={preferences.notifications} 
          onChange={() => handleToggle('notifications')} 
        />
      </div>
      
      {/* FCM Push Notifications - Receive alerts when app is closed */}
      <div 
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex-1">
          <span 
            className="block font-medium"
            style={{ color: TEXT_COLORS.primary }}
          >
            Background Push Notifications
          </span>
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Receive alerts even when app is closed
          </span>
          {isIOS && !isStandalone && (
            <span style={{ color: '#FBBF25', fontSize: `${TYPOGRAPHY.fontSize.xs}px` }} className="block mt-1">
              ⚠️ Add to Home Screen to enable on iOS
            </span>
          )}
        </div>
        <button
          onClick={async () => {
            if (fcmEnabled) {
              // Disable
              await fcmService.deleteToken();
              setFcmEnabled(false);
              await updateProfile({
                preferences: {
                  ...profile?.preferences,
                  fcmEnabled: false,
                },
              });
            } else {
              // Enable (user interaction required)
              setFcmInitializing(true);
              try {
                const token = await fcmService.requestPermissionAndGetToken();
                if (token) {
                  setFcmEnabled(true);
                  await updateProfile({
                    preferences: {
                      ...profile?.preferences,
                      fcmEnabled: true,
                    },
                  });
                } else {
                  alert('Failed to enable push notifications. Please check browser permissions.');
                }
              } catch (error) {
                console.error('[FCM] Enable failed:', error);
                alert('Failed to enable push notifications.');
              } finally {
                setFcmInitializing(false);
              }
            }
          }}
          disabled={fcmInitializing}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-opacity"
          style={{ 
            backgroundColor: fcmEnabled ? STATE_COLORS.active : 'rgba(255,255,255,0.1)',
            color: fcmEnabled ? '#000' : TEXT_COLORS.primary,
            opacity: fcmInitializing ? 0.5 : 1,
            cursor: fcmInitializing ? 'not-allowed' : 'pointer',
          }}
        >
          {fcmInitializing ? 'Enabling...' : fcmEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>
      
      {/* Dynamic Island / Live Activity toggle - only show on supported iOS devices */}
      {dynamicIslandSupported && (
        <div 
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        >
          <div>
            <span 
              className="block font-medium"
              style={{ color: TEXT_COLORS.primary }}
            >
              Dynamic Island Timer
            </span>
            <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
              See draft timer when using other apps
            </span>
          </div>
          <ToggleSwitch 
            checked={preferences.dynamicIslandEnabled} 
            onChange={() => handleToggle('dynamicIslandEnabled')} 
          />
        </div>
      )}
      
      {/* Draft Alerts - Show for ALL users */}
      <div className="space-y-3 mt-6">
        <h3 className="text-lg font-semibold" style={{ color: TEXT_COLORS.primary }}>
          Draft Alerts
        </h3>
        <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
          {dynamicIslandSupported
            ? 'Alerts appear in Dynamic Island and Lock Screen'
            : 'Alerts appear as browser notifications'
          }
        </p>
        
        {/* Show permission request for non-Dynamic Island users */}
        {notificationPermission !== 'granted' && !dynamicIslandSupported && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <p className="text-yellow-400 text-sm mb-2">
              Enable browser notifications to receive draft alerts
            </p>
            <button
              onClick={requestNotificationPermission}
              className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium"
            >
              Enable Notifications
            </button>
          </div>
        )}
        
        {[
          { key: 'roomFilled' as const, label: 'Room Filled', desc: 'When draft room reaches capacity' },
          { key: 'draftStarting' as const, label: 'Draft Starting', desc: 'When draft countdown begins' },
          { key: 'twoPicksAway' as const, label: 'Two Picks Away', desc: "When you're 2 picks from your turn" },
          { key: 'onTheClock' as const, label: 'On The Clock', desc: "When it's your turn to pick" },
          { key: 'tenSecondsRemaining' as const, label: '10 Seconds Remaining', desc: 'When timer hits 10 seconds' },
        ].map(({ key, label, desc }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            <div>
              <span
                className="block font-medium"
                style={{ color: TEXT_COLORS.primary }}
              >
                {label}
              </span>
              <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                {desc}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={alertPreferences[key]}
                onChange={() => handleAlertToggle(key)}
                disabled={savingKey === key || isSaving}
              />
              {savingKey === key && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div 
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div>
          <span 
            className="block font-medium"
            style={{ color: TEXT_COLORS.primary }}
          >
            Email Updates
          </span>
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Tournament news and promotions
          </span>
        </div>
        <ToggleSwitch 
          checked={preferences.emailUpdates} 
          onChange={() => handleToggle('emailUpdates')} 
        />
      </div>
      
      <div 
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div>
          <span 
            className="block font-medium"
            style={{ color: TEXT_COLORS.primary }}
          >
            Public Profile
          </span>
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
            Let others see your stats
          </span>
        </div>
        <ToggleSwitch 
          checked={preferences.publicProfile} 
          onChange={() => handleToggle('publicProfile')} 
        />
      </div>
    </div>
  );
}

// ============================================================================
// SECURITY TAB
// ============================================================================

function SecurityTabContent(): React.ReactElement {
  const { user, sendPasswordResetEmail, linkEmailPassword } = useAuth();
  const [resetSent, setResetSent] = useState(false);
  
  const handlePasswordReset = async () => {
    if (user?.email) {
      const result = await sendPasswordResetEmail(user.email);
      if (result.success) {
        setResetSent(true);
      }
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Password */}
      <div 
        className="p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span 
              className="block font-medium"
              style={{ color: TEXT_COLORS.primary }}
            >
              Password
            </span>
            <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
              {user?.email ? 'Change your password' : 'Add a password'}
            </span>
          </div>
          <button
            onClick={handlePasswordReset}
            disabled={resetSent || !user?.email}
            className="px-4 py-2 rounded-lg font-medium"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              color: TEXT_COLORS.primary,
              opacity: resetSent || !user?.email ? 0.5 : 1,
            }}
          >
            {resetSent ? 'Email Sent' : 'Reset'}
          </button>
        </div>
      </div>
      
      {/* Session Info */}
      <div 
        className="p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      >
        <span 
          className="block font-medium mb-2"
          style={{ color: TEXT_COLORS.primary }}
        >
          Current Session
        </span>
        <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
          Last login: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Unknown'}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// DELETE ACCOUNT TAB
// ============================================================================

interface DeleteTabContentProps {
  onDelete: () => void;
  isDeleting: boolean;
}

function DeleteTabContent({ onDelete, isDeleting }: DeleteTabContentProps): React.ReactElement {
  const [confirmText, setConfirmText] = useState('');
  const canDelete = confirmText.toLowerCase() === 'delete';
  
  return (
    <div className="space-y-6">
      <div 
        className="p-4 rounded-xl"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
      >
        <div className="flex items-start gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={STATE_COLORS.error} strokeWidth="2" className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span 
              className="block font-semibold mb-1"
              style={{ color: STATE_COLORS.error }}
            >
              Warning: This action is irreversible
            </span>
            <p style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
              Deleting your account will permanently remove all your data, including:
            </p>
            <ul 
              className="list-disc list-inside mt-2 space-y-1"
              style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
            >
              <li>Your profile and username</li>
              <li>Tournament history and stats</li>
              <li>All teams and draft data</li>
              <li>Transaction history</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div>
        <label 
          className="block font-medium mb-2"
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
        >
          Type &quot;delete&quot; to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="delete"
          className="w-full px-4 py-3 rounded-xl outline-none"
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: TEXT_COLORS.primary,
            border: `2px solid ${confirmText && !canDelete ? STATE_COLORS.error : BORDER_COLORS.default}`,
            fontSize: `${TYPOGRAPHY.fontSize.base}px`,
          }}
        />
      </div>
      
      <button
        onClick={onDelete}
        disabled={!canDelete || isDeleting}
        className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
        style={{
          backgroundColor: canDelete ? STATE_COLORS.error : BG_COLORS.tertiary,
          color: canDelete ? '#fff' : TEXT_COLORS.disabled,
          opacity: canDelete ? 1 : 0.5,
        }}
      >
        {isDeleting ? (
          <>
            <div 
              className="animate-spin rounded-full h-5 w-5 border-2"
              style={{ borderColor: '#fff transparent transparent transparent' }}
            />
            Deleting...
          </>
        ) : (
          'Delete My Account'
        )}
      </button>
    </div>
  );
}

// ============================================================================
// CHANGE USERNAME MODAL
// ============================================================================

interface ChangeUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
}

function ChangeUsernameModal({ isOpen, onClose, currentUsername }: ChangeUsernameModalProps): React.ReactElement | null {
  const { profile, changeUsername } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [reason, setReason] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { canSubmit } = useUsernameValidation({
    initialValue: newUsername,
    countryCode: profile?.countryCode || 'US',
  });
  
  const canChange = canSubmit && newUsername.toLowerCase() !== currentUsername.toLowerCase();
  
  const handleChange = async () => {
    setIsChanging(true);
    setError(null);
    
    try {
      const result = await changeUsername({ newUsername, reason });
      
      if (result.success) {
        setSuccess(true);
        setTimeout(onClose, 2000);
      } else {
        setError(result.error?.message || 'Failed to change username');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsChanging(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: Z_INDEX.modal + 10 }}
    >
      <div 
        className="w-full max-w-md mx-4 rounded-2xl"
        style={{ backgroundColor: BG_COLORS.secondary }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4"
          style={{ borderBottom: `1px solid ${BORDER_COLORS.default}` }}
        >
          <h3 
            className="font-bold"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
          >
            Change Username
          </h3>
          <button onClick={onClose} className="p-2">
            <Close size={20} color={TEXT_COLORS.muted} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {success ? (
            <div 
              className="text-center py-8"
              style={{ color: STATE_COLORS.success }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-semibold">Username changed!</p>
            </div>
          ) : (
            <>
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
              >
                <p style={{ color: STATE_COLORS.warning, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                  You can change your username {RATE_LIMITS.MAX_USERNAME_CHANGES_PER_YEAR} times per year.
                </p>
              </div>
              
              {error && (
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: STATE_COLORS.error }}
                >
                  {error}
                </div>
              )}
              
              <div>
                <label 
                  className="block font-medium mb-2"
                  style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
                >
                  Current username
                </label>
                <p style={{ color: TEXT_COLORS.muted }}>@{currentUsername}</p>
              </div>
              
              <UsernameInput
                value={newUsername}
                onChange={setNewUsername}
                countryCode={profile?.countryCode || 'US'}
                placeholder="Enter new username"
              />
              
              <div>
                <label 
                  className="block font-medium mb-2"
                  style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
                >
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you changing?"
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: TEXT_COLORS.primary,
                    border: `1px solid ${BORDER_COLORS.default}`,
                    fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                  }}
                />
              </div>
              
              <button
                onClick={handleChange}
                disabled={!canChange || isChanging}
                className="w-full py-3 rounded-xl font-bold"
                style={{
                  backgroundColor: canChange ? STATE_COLORS.active : BG_COLORS.tertiary,
                  color: canChange ? '#000' : TEXT_COLORS.disabled,
                  opacity: canChange ? 1 : 0.5,
                }}
              >
                {isChanging ? 'Changing...' : 'Change Username'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADD CONTACT MODAL (Email or Phone)
// ============================================================================

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'email' | 'phone';
}

function AddContactModal({ isOpen, onClose, type }: AddContactModalProps): React.ReactElement | null {
  const [value, setValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const isEmail = type === 'email';
  const label = isEmail ? 'Email Address' : 'Phone Number';
  const placeholder = isEmail ? 'you@example.com' : '+1 (555) 123-4567';
  const inputType = isEmail ? 'email' : 'tel';
  
  const isValid = isEmail 
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    : value.replace(/\D/g, '').length >= 10;
  
  const handleAdd = async () => {
    setIsAdding(true);
    setError(null);
    
    try {
      // Get Firebase auth token for API call
      let authToken: string | null = null;
      try {
        const auth = getAuth();
        if (auth.currentUser) {
          authToken = await auth.currentUser.getIdToken();
        } else {
          throw new Error('User not authenticated');
        }
      } catch (tokenError) {
        logger.warn('Failed to get auth token', { error: tokenError });
        // In development, allow dev-token fallback
        if (process.env.NODE_ENV !== 'production') {
          // Will use dev-token below
        } else {
          throw new Error('Authentication required');
        }
      }

      // Call API to add email/phone to account
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else if (process.env.NODE_ENV === 'development') {
        // Development fallback
        headers['Authorization'] = 'Bearer dev-token';
      }

      const response = await fetch('/api/user/update-contact', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: getAuth().currentUser?.uid,
          [isEmail ? 'email' : 'phone']: value,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || `Failed to add ${label.toLowerCase()}`);
      }

      setSuccess(true);

      setTimeout(() => {
        onClose();
        setSuccess(false);
        setValue('');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to add ${label.toLowerCase()}. Please try again.`;
      setError(errorMessage);
    } finally {
      setIsAdding(false);
    }
  };
  
  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setValue('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: Z_INDEX.modal + 10 }}
    >
      <div 
        className="w-full max-w-md mx-4 rounded-2xl"
        style={{ backgroundColor: BG_COLORS.secondary }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4"
          style={{ borderBottom: `1px solid ${BORDER_COLORS.default}` }}
        >
          <h3 
            className="font-bold"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
          >
            Add {label}
          </h3>
          <button onClick={onClose} className="p-2">
            <Close size={20} color={TEXT_COLORS.muted} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {success ? (
            <div 
              className="text-center py-8"
              style={{ color: STATE_COLORS.success }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-semibold">{label} added!</p>
              <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }} className="mt-2">
                {isEmail ? 'Check your inbox to verify.' : 'Verification code sent.'}
              </p>
            </div>
          ) : (
            <>
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: 'rgba(96, 165, 250, 0.1)' }}
              >
                <p style={{ color: STATE_COLORS.active, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
                  Adding {isEmail ? 'an email' : 'a phone number'} gives you another way to sign in to your account.
                </p>
              </div>
              
              {error && (
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: STATE_COLORS.error }}
                >
                  {error}
                </div>
              )}
              
              <div>
                <label 
                  className="block font-medium mb-2"
                  style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
                >
                  {label}
                </label>
                <input
                  type={inputType}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  autoComplete={isEmail ? 'email' : 'tel'}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: TEXT_COLORS.primary,
                    border: `2px solid ${value && !isValid ? STATE_COLORS.error : BORDER_COLORS.default}`,
                    fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                  }}
                />
                {value && !isValid && (
                  <span 
                    className="block mt-1"
                    style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}
                  >
                    Please enter a valid {label.toLowerCase()}
                  </span>
                )}
              </div>
              
              <button
                onClick={handleAdd}
                disabled={!isValid || isAdding}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isValid ? STATE_COLORS.active : BG_COLORS.tertiary,
                  color: isValid ? '#000' : TEXT_COLORS.disabled,
                  opacity: isValid ? 1 : 0.5,
                }}
              >
                {isAdding ? (
                  <>
                    <div 
                      className="animate-spin rounded-full h-5 w-5 border-2"
                      style={{ borderColor: '#000 transparent transparent transparent' }}
                    />
                    Adding...
                  </>
                ) : (
                  `Add ${label}`
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EDIT NAME MODAL
// ============================================================================

interface EditNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFirstName: string;
  currentLastName: string;
}

function EditNameModal({ isOpen, onClose, currentFirstName, currentLastName }: EditNameModalProps): React.ReactElement | null {
  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { updateProfile } = useAuth();
  
  const isValid = firstName.trim().length >= 1 && lastName.trim().length >= 1;
  const hasChanges = firstName !== currentFirstName || lastName !== currentLastName;
  
  const handleSave = async () => {
    if (!isValid || !hasChanges) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Failed to update name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setFirstName(currentFirstName);
      setLastName(currentLastName);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, currentFirstName, currentLastName]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: Z_INDEX.modal + 10 }}
    >
      <div 
        className="w-full max-w-md mx-4 rounded-2xl"
        style={{ backgroundColor: BG_COLORS.secondary }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4"
          style={{ borderBottom: `1px solid ${BORDER_COLORS.default}` }}
        >
          <h3 
            className="font-bold"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
          >
            {currentFirstName ? 'Edit Name' : 'Add Name'}
          </h3>
          <button onClick={onClose} className="p-2">
            <Close size={20} color={TEXT_COLORS.muted} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {success ? (
            <div 
              className="text-center py-8"
              style={{ color: STATE_COLORS.success }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="font-semibold">Name updated!</p>
            </div>
          ) : (
            <>
              {error && (
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: STATE_COLORS.error }}
                >
                  {error}
                </div>
              )}
              
              <div>
                <label 
                  className="block font-medium mb-2"
                  style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
                >
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: TEXT_COLORS.primary,
                    border: `2px solid ${BORDER_COLORS.default}`,
                    fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                  }}
                />
              </div>
              
              <div>
                <label 
                  className="block font-medium mb-2"
                  style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: TEXT_COLORS.primary,
                    border: `2px solid ${BORDER_COLORS.default}`,
                    fontSize: `${TYPOGRAPHY.fontSize.base}px`,
                  }}
                />
              </div>
              
              <button
                onClick={handleSave}
                disabled={!isValid || !hasChanges || isSaving}
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isValid && hasChanges ? STATE_COLORS.active : BG_COLORS.tertiary,
                  color: isValid && hasChanges ? '#000' : TEXT_COLORS.disabled,
                  opacity: isValid && hasChanges ? 1 : 0.5,
                }}
              >
                {isSaving ? (
                  <>
                    <div 
                      className="animate-spin rounded-full h-5 w-5 border-2"
                      style={{ borderColor: '#000 transparent transparent transparent' }}
                    />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProfileSettingsModal({
  isOpen,
  onClose,
  onAccountDeleted,
}: ProfileSettingsModalProps): React.ReactElement | null {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState<'email' | 'phone' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { profile, deleteAccount, signOut } = useAuth();
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('profile');
      setShowAddContactModal(null);
      setIsDeleting(false);
    }
  }, [isOpen]);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAccount();
      if (result.success) {
        onAccountDeleted?.();
        onClose();
      }
    } catch (err) {
      logger.error('Delete account failed', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsDeleting(false);
    }
  };
  
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'security', label: 'Security' },
    { id: 'delete', label: 'Delete' },
  ];
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{ 
        top: '60px', 
        backgroundColor: BG_COLORS.secondary, 
        zIndex: Z_INDEX.modal 
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between flex-shrink-0"
        style={{ 
          padding: `${SPACING.md}px ${SPACING.lg}px`, 
          borderBottom: `1px solid ${BORDER_COLORS.default}` 
        }}
      >
        <h2 
          className="font-bold" 
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
        >
          Settings
        </h2>
        <button 
          onClick={onClose} 
          className="p-2" 
          aria-label="Close"
        >
          <Close size={24} color={TEXT_COLORS.muted} />
        </button>
      </div>
      
      {/* Tabs */}
      <div 
        className="flex border-b"
        style={{ borderColor: BORDER_COLORS.default }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 font-medium transition-colors"
            style={{
              color: activeTab === tab.id ? STATE_COLORS.active : TEXT_COLORS.muted,
              borderBottom: activeTab === tab.id ? `2px solid ${STATE_COLORS.active}` : '2px solid transparent',
              fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto" 
        style={{ padding: SPACING.lg, scrollbarWidth: 'none' }}
      >
        {activeTab === 'profile' && (
          <ProfileTabContent 
            onEditName={() => setShowNameModal(true)}
            onAddEmail={() => setShowAddContactModal('email')}
            onAddPhone={() => setShowAddContactModal('phone')}
          />
        )}
        {activeTab === 'preferences' && <PreferencesTabContent />}
        {activeTab === 'security' && <SecurityTabContent />}
        {activeTab === 'delete' && (
          <DeleteTabContent onDelete={handleDelete} isDeleting={isDeleting} />
        )}
      </div>
      
      {/* Footer */}
      <div 
        className="flex-shrink-0 text-center py-6"
        style={{ borderTop: `1px solid ${BORDER_COLORS.default}` }}
      >
        <button
          onClick={async () => { await signOut(); onClose(); }}
          className="py-3 px-8 rounded-xl"
          style={{ color: STATE_COLORS.error, fontSize: `${TYPOGRAPHY.fontSize.base}px` }}
        >
          Sign Out
        </button>
      </div>
      
      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddContactModal !== null}
        onClose={() => setShowAddContactModal(null)}
        type={showAddContactModal || 'email'}
      />

      {/* Edit Name Modal */}
      <EditNameModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        currentFirstName={profile?.firstName || ''}
        currentLastName={profile?.lastName || ''}
      />
    </div>
  );
}

export default ProfileSettingsModal;

