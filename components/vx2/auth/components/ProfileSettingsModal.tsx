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

import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import React, { useState, useCallback, useEffect } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { Close, ChevronLeft, Edit } from '../../components/icons';
import { useTemporaryState } from '../../hooks/ui/useTemporaryState';
import { RATE_LIMITS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useUsernameValidation } from '../hooks/useUsernameValidation';



import sharedStyles from './auth-shared.module.css';
import { DeleteAccountModal } from './DeleteAccountModal';
import styles from './ProfileSettingsModal.module.css';
import { UsernameInput } from './UsernameInput';

const logger = createScopedLogger('[ProfileSettingsModal]');

// ============================================================================
// TYPES
// ============================================================================

export interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountDeleted?: () => void;
  /** Top offset in px. Use 0 to align to safe-area edge (e.g. inside phone frame). Default 60. */
  contentTopInset?: number;
}

type ProfileTab = 'profile' | 'preferences' | 'security';

// ============================================================================
// PROFILE TAB
// ============================================================================

interface ProfileTabContentProps {
  onEditName: () => void;
  onAddEmail: () => void;
  onAddPhone: () => void;
  onOpenDeleteModal: () => void;
}

function ProfileTabContent({ onEditName, onAddEmail, onAddPhone, onOpenDeleteModal }: ProfileTabContentProps): React.ReactElement {
  const { user, profile, sendVerificationEmail } = useAuth();
  const router = useRouter();
  const [emailSent, setEmailSent] = useTemporaryState(false, 30000);

  const handleResendVerification = async () => {
    const result = await sendVerificationEmail();
    if (result.success) {
      setEmailSent(true);
    }
  };

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.displayName || null;

  // Get inner cell background color from user preferences (default to dark gray)
  // Borders are fixed and not customizable
  const innerCellColor = profile?.preferences?.cellBackgroundColor || '#374151';

  // Fixed border color (not customizable) - matches unpicked player card border in horizontal scrolling pick bar
  const fixedBorderColor = '#6B7280'; // Gray for unpicked cards (CARD_COLORS.otherPick from PicksBar)

  return (
    <div className="space-y-6">
      {/* Customization Section */}
      <div className={styles.customizationSection}>
        {/* Example Player Box */}
        <div className={styles.playerBoxContainer}>
          <div
            className={styles.playerBox}
            style={{
              '--player-box-border': fixedBorderColor,
              '--player-box-bg': innerCellColor,
            } as React.CSSProperties}
          >
            {/* Header - matches draft room card header structure */}
            <div className={styles.playerBoxHeader}>
              {profile?.username || 'Username'}
            </div>

            {/* Content area - matches draft room card content */}
            <div className={styles.playerBoxContent}>
            </div>
          </div>
        </div>

        <div className={cn('flex items-center justify-center')}>
          <button
            onClick={() => router.push('/profile-customization')}
            className={styles.customizeButton}
          >
            Customize
          </button>
        </div>
      </div>


      {/* Name */}
      <div className={styles.infoBox}>
        <div className={styles.infoBoxHeader}>
          <span className={styles.infoLabel}>
            Name
          </span>
        </div>
        <p className={styles.infoValue}>
          {displayName || 'Not added yet'}
        </p>
      </div>

      {/* Email */}
      <div className={styles.infoBox}>
        <div className={styles.infoBoxHeader}>
          <span className={styles.infoLabel}>
            Email
          </span>
          {user?.email ? (
            user?.emailVerified ? (
            <span className={cn(styles.badge, styles.badgeVerified)}>
              Verified
            </span>
          ) : (
            <button
              onClick={handleResendVerification}
              disabled={emailSent}
              className={styles.verifyButton}
            >
              {emailSent ? 'Email sent' : 'Verify'}
              </button>
            )
          ) : null}
        </div>
        <p className={styles.infoValue}>
          {user?.email || 'Not added yet'}
        </p>
      </div>

      {/* Phone */}
      <div className={styles.infoBox}>
        <div className={styles.infoBoxHeader}>
          <span className={styles.infoLabel}>
            Phone
          </span>
        </div>
        <p className={styles.infoValue}>
          {user?.phoneNumber || 'Not added yet'}
        </p>
      </div>

      {/* Country */}
      <div className={styles.infoBox}>
        <span className={cn(styles.infoLabel, 'block mb-2')}>
          Country
        </span>
        <p className={styles.infoValue}>
          {profile?.countryCode || 'Not set'}
        </p>
      </div>
      
      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={cn(styles.statValue, 'block font-bold text-xl')}>
            {profile?.tournamentsEntered || 0}
          </span>
          <span className={styles.statLabel}>
            Tournaments
          </span>
        </div>
        <div className={styles.statCard}>
          <span
            className={cn(styles.statValue, 'block font-bold text-xl', styles.statValueSuccess)}
          >
            ${(profile?.totalWinnings || 0).toLocaleString()}
          </span>
          <span className={styles.statLabel}>
            Winnings
          </span>
        </div>
      </div>

      {/* Delete account — opens modal (eligibility, maze, password) */}
      <div className={styles.deleteAccountSection}>
        <div className={styles.deleteAccountInfo}>
          <span className={styles.deleteAccountTitle}>
            Delete account
          </span>
          <span className={styles.deleteAccountDescription}>
            Permanently delete your account and data
          </span>
        </div>
        <button
          onClick={onOpenDeleteModal}
          className={styles.deleteButton}
        >
          Delete account
        </button>
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
    dynamicIslandEnabled: profile?.preferences?.dynamicIslandEnabled ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useTemporaryState(false, 2000);
  const [dynamicIslandSupported, setDynamicIslandSupported] = useState(false);
  
  // Alert preferences state
  const [alertPreferences, setAlertPreferences] = useState({
    roomFilled: profile?.preferences?.draftAlerts?.roomFilled ?? false,
    draftStarting: profile?.preferences?.draftAlerts?.draftStarting ?? false,
    twoPicksAway: profile?.preferences?.draftAlerts?.twoPicksAway ?? false,
    onTheClock: profile?.preferences?.draftAlerts?.onTheClock ?? false,
    tenSecondsRemaining: profile?.preferences?.draftAlerts?.tenSecondsRemaining ?? false,
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [savingKey, setSavingKey] = useState<string | null>(null);
  
  // Check Dynamic Island support on mount
  useEffect(() => {
    // Check if iOS 16.1+ (Live Activities support)
    const checkSupport = () => {
      if (typeof window === 'undefined') return false;
      const userAgent = navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/.test(userAgent);
      if (!isIOS) return false;
      const match = userAgent.match(/OS (\d+)_(\d+)/);
      if (match) {
        const major = parseInt(match[1]!, 10);
        const minor = parseInt(match[2]!, 10);
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
    } catch (error) {
      logger.error('Failed to update alert preferences:', error instanceof Error ? error : new Error(String(error)));
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
      className={styles.toggleSwitch}
      data-checked={checked}
      role="switch"
      aria-checked={checked}
    >
      <div className={styles.toggleSwitchThumb} />
    </button>
  );
  
  return (
    <div className={styles.preferencesContent}>
      {saved && (
        <div className={styles.savedMessage}>
          Preferences saved
        </div>
      )}

      {/* Dynamic Island / Live Activity toggle - only show on supported iOS devices */}
      {dynamicIslandSupported && (
        <div className={styles.preferenceItem}>
          <div className={styles.preferenceItemLabel}>
            <span className={styles.preferenceItemTitle}>
              Dynamic Island Timer
            </span>
            <span className={styles.preferenceItemDescription}>
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
      <div className={styles.alertPreferencesSection}>
        <h3 className={styles.alertsTitle}>
          Draft Alerts
        </h3>
        <p className={styles.alertsDescription}>
          {dynamicIslandSupported
            ? 'Alerts appear in Dynamic Island and Lock Screen'
            : 'Alerts appear as browser notifications'
          }
        </p>

        {/* Show permission request for non-Dynamic Island users */}
        {notificationPermission !== 'granted' && !dynamicIslandSupported && (
          <div className={styles.notificationPermissionBox}>
            <p className={styles.notificationPermissionText}>
              Enable browser notifications to receive draft alerts
            </p>
            <button
              onClick={requestNotificationPermission}
              className={styles.notificationPermissionButton}
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
          <div key={key} className={styles.preferenceItem}>
            <div className={styles.preferenceItemLabel}>
              <span className={styles.preferenceItemTitle}>
                {label}
              </span>
              <span className={styles.preferenceItemDescription}>
                {desc}
              </span>
            </div>
            <div className={cn('flex items-center gap-2', styles.alertItemWithSaving)}>
              <ToggleSwitch
                checked={alertPreferences[key]}
                onChange={() => handleAlertToggle(key)}
                disabled={savingKey === key || isSaving}
              />
              {savingKey === key && (
                <div className={styles.savingSpinner} />
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.preferenceItem}>
        <div className={styles.preferenceItemLabel}>
          <span className={styles.preferenceItemTitle}>
            Slow draft email updates
          </span>
          <span className={styles.preferenceItemDescription}>
            Updates about your slow drafts
          </span>
        </div>
        <ToggleSwitch
          checked={preferences.emailUpdates}
          onChange={() => handleToggle('emailUpdates')}
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
    <div className={styles.securityContent}>
      {/* Password */}
      <div className={styles.securityItem}>
        <div className={styles.securityItemInfo}>
          <span className={styles.securityItemTitle}>
            Password
          </span>
          <span className={styles.securityItemDescription}>
            {user?.email ? 'Change your password' : 'Add a password'}
          </span>
        </div>
        <button
          onClick={handlePasswordReset}
          disabled={resetSent || !user?.email}
          className={styles.resetButton}
        >
          {resetSent ? 'Email Sent' : 'Reset'}
        </button>
      </div>

      {/* Session Info */}
      <div className={styles.securityItem}>
        <span className={cn(styles.securityItemTitle, 'block mb-2')}>
          Current Session
        </span>
        <span className={styles.securityItemDescription}>
          Last login: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Unknown'}
        </span>
      </div>
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalDialog}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Change Username
          </h3>
          <button onClick={onClose} className={styles.modalCloseButton}>
            <Close size={20} className={styles.closingIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {success ? (
            <div className={styles.successMessage}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn(styles.successIcon, 'mx-auto mb-4')}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className={cn(styles.successText, 'font-semibold')}>Username changed!</p>
            </div>
          ) : (
            <>
              <div className={styles.warningBox}>
                <p className={styles.warningText}>
                  You can change your username {RATE_LIMITS.MAX_USERNAME_CHANGES_PER_YEAR} times per year.
                </p>
              </div>

              {error && (
                <div className={styles.errorBox}>
                  {error}
                </div>
              )}

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Current username
                </label>
                <p className={styles.fieldValue}>@{currentUsername}</p>
              </div>

              <UsernameInput
                value={newUsername}
                onChange={setNewUsername}
                countryCode={profile?.countryCode || 'US'}
                placeholder="Enter new username"
              />

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you changing?"
                  className={styles.fieldInput}
                />
              </div>

              <button
                onClick={handleChange}
                disabled={!canChange || isChanging}
                className={cn(
                  styles.primaryButton,
                  canChange ? styles.primaryButtonEnabled : styles.primaryButtonDisabled
                )}
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalDialog}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Add {label}
          </h3>
          <button onClick={onClose} className={styles.modalCloseButton}>
            <Close size={20} className={styles.closingIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {success ? (
            <div className={styles.successMessage}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn(styles.successIcon, 'mx-auto mb-4')}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className={cn(styles.successText, 'font-semibold')}>{label} added!</p>
              <p className={cn(styles.infoLabel, 'mt-2')}>
                {isEmail ? 'Check your inbox to verify.' : 'Verification code sent.'}
              </p>
            </div>
          ) : (
            <>
              <div className={styles.infoMessageBox}>
                <p className={styles.infoMessageText}>
                  Adding {isEmail ? 'an email' : 'a phone number'} gives you another way to sign in to your account.
                </p>
              </div>

              {error && (
                <div className={styles.errorBox}>
                  {error}
                </div>
              )}

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  {label}
                </label>
                <input
                  type={inputType}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  autoComplete={isEmail ? 'email' : 'tel'}
                  className={cn(
                    styles.fieldInput,
                    value && !isValid && styles.fieldInputError
                  )}
                />
                {value && !isValid && (
                  <span className={styles.fieldError}>
                    Please enter a valid {label.toLowerCase()}
                  </span>
                )}
              </div>

              <button
                onClick={handleAdd}
                disabled={!isValid || isAdding}
                className={cn(
                  styles.primaryButton,
                  isValid ? styles.primaryButtonEnabled : styles.primaryButtonDisabled
                )}
              >
                {isAdding ? (
                  <>
                    <div className={styles.spinnerContainer} />
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalDialog}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {currentFirstName ? 'Edit Name' : 'Add Name'}
          </h3>
          <button onClick={onClose} className={styles.modalCloseButton}>
            <Close size={20} className={styles.closingIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.modalContent}>
          {success ? (
            <div className={styles.successMessage}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn(styles.successIcon, 'mx-auto mb-4')}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className={cn(styles.successText, 'font-semibold')}>Name updated!</p>
            </div>
          ) : (
            <>
              {error && (
                <div className={styles.errorBox}>
                  {error}
                </div>
              )}

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                  className={styles.fieldInput}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                  className={styles.fieldInput}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={!isValid || !hasChanges || isSaving}
                className={cn(
                  styles.primaryButton,
                  isValid && hasChanges ? styles.primaryButtonEnabled : styles.primaryButtonDisabled
                )}
              >
                {isSaving ? (
                  <>
                    <div className={styles.spinnerContainer} />
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
  contentTopInset = 60,
}: ProfileSettingsModalProps): React.ReactElement | null {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState<'email' | 'phone' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { profile, signOut } = useAuth();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setActiveTab('profile');
      setShowAddContactModal(null);
      setShowDeleteModal(false);
    }
  }, [isOpen]);
  
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'preferences', label: 'Draft Alerts' },
    { id: 'security', label: 'Security' },
  ];
  
  if (!isOpen) return null;

  return (
    <div
      className={styles.modal}
      style={{
        '--content-top-inset': `${contentTopInset}px`,
      } as React.CSSProperties}
      data-inset={contentTopInset}
    >
      {/* Header — same top padding as Sign In/Sign Up/Forgot Password so X height is consistent */}
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>
          Settings
        </h2>
        <button
          onClick={onClose}
          className={sharedStyles.closeButton}
          aria-label="Close"
        >
          <Close size={24} className={styles.closingIcon} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          // eslint-disable-next-line jsx-a11y/role-supports-aria-props -- aria-selected is intentional for accessibility
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={styles.tab}
            aria-selected={activeTab === tab.id}
          >
            <span className={styles.tabLabel}>{tab.label}</span>
            {activeTab === tab.id && (
              <div className={styles.tabIndicator} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'profile' && (
          <ProfileTabContent
            onEditName={() => setShowNameModal(true)}
            onAddEmail={() => setShowAddContactModal('email')}
            onAddPhone={() => setShowAddContactModal('phone')}
            onOpenDeleteModal={() => setShowDeleteModal(true)}
          />
        )}
        {activeTab === 'preferences' && <PreferencesTabContent />}
        {activeTab === 'security' && <SecurityTabContent />}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <button
          onClick={async () => { await signOut(); onClose(); }}
          className={styles.signOutButton}
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

      {/* Delete Account Modal – eligibility, maze, password */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={() => {
          onAccountDeleted?.();
          onClose();
        }}
      />
    </div>
  );
}

export default ProfileSettingsModal;

