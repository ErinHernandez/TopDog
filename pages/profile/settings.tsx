/**
 * Idesaign — Account Settings Page
 *
 * Protected account settings page with:
 * - Wrapped in ProtectedRoute component
 * - Header with navigation
 * - Settings form:
 *   - Display Name (text input, pre-filled)
 *   - Bio (textarea, max 200 chars)
 *   - Avatar URL (text input or upload placeholder)
 *   - Email (read-only from Firebase)
 * - Save Changes button
 * - Danger zone: Delete Account (confirmation, doesn't actually delete)
 */

import { useEffect, useState, useCallback, FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth/AuthProvider';
import { ProtectedRoute } from '@/lib/auth/ProtectedRoute';
import { getServerSideProps as _getServerSideProps } from '@/lib/auth/withServerAuth';
import styles from '@/styles/settings.module.css';

export const getServerSideProps = _getServerSideProps;

/* ================================================================
   Types
   ================================================================ */

interface SettingsForm {
  displayName: string;
  bio: string;
  avatarUrl: string;
}

interface FormErrors {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

/* ================================================================
   Component: Settings Page (Wrapped in ProtectedRoute)
   ================================================================ */

function SettingsPageContent() {
  const router = useRouter();
  const { user, updateUserProfile, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState<SettingsForm>({
    displayName: '',
    bio: '',
    avatarUrl: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* ---- Initialize form with user data ---- */
  useEffect(() => {
    if (!user) return;

    const loadUserProfile = async () => {
      try {
        const { UserProfileService } = await import('@/lib/studio/community/firestore');

        // Fetch Firestore profile to get bio
        const userProfile = await UserProfileService.getProfile(user.uid);

        setFormData({
          displayName: user.displayName || '',
          bio: userProfile?.bio || '',
          avatarUrl: user.photoURL || '',
        });
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Fallback to just Firebase Auth data
        setFormData({
          displayName: user.displayName || '',
          bio: '',
          avatarUrl: user.photoURL || '',
        });
      }
    };

    loadUserProfile();
  }, [user]);

  /* ---- Validate form ---- */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length > 100) {
      errors.displayName = 'Display name must be less than 100 characters';
    }

    if (formData.bio.length > 200) {
      errors.bio = 'Bio must be less than 200 characters';
    }

    if (formData.avatarUrl && !isValidUrl(formData.avatarUrl)) {
      errors.avatarUrl = 'Please enter a valid URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /* ---- Handle form submission ---- */
  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveSuccess(false);

    if (!validateForm() || !user) return;

    setIsSaving(true);
    try {
      // Update Firebase Auth profile
      await updateUserProfile?.({
        displayName: formData.displayName,
        photoURL: formData.avatarUrl || user.photoURL,
      });

      // Update Firestore profile with bio
      const { UserProfileService } = await import('@/lib/studio/community/firestore');
      await UserProfileService.updateProfile(user.uid, {
        bio: formData.bio,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setFormErrors({ displayName: 'Failed to save changes. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [user, formData, updateUserProfile]);

  /* ---- Handle input change ---- */
  const handleInputChange = (field: keyof SettingsForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  /* ---- Handle account deletion request ---- */
  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    // In production: show confirmation dialog, then delete account
    alert('Account deletion is not yet available. Please contact support.');
  };

  if (authLoading || !user) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Settings — Idesaign</title>
        <meta name="description" content="Manage your Idesaign account settings" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        {/* ---- Header ---- */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link href="/" className={styles.logo}>
              Idesaign
            </Link>

            <nav className={styles.nav}>
              <Link href="/dashboard" className={styles.navItem}>
                Dashboard
              </Link>
              <Link href="/gallery" className={styles.navItem}>
                Gallery
              </Link>
              <Link
                href={`/profile/${user.uid}`}
                className={styles.navItem}
              >
                Profile
              </Link>
            </nav>

            <div className={styles.authSection}>
              <Link
                href={`/profile/${user.uid}`}
                className={styles.avatarButton}
                title="Go to profile"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {(user.displayName || user.email)?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* ---- Main Content ---- */}
        <main className={styles.main}>
          <div className={styles.settingsContainer}>
            {/* ---- Page Title ---- */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Account Settings</h1>
              <p className={styles.pageSubtitle}>Manage your profile and account preferences</p>
            </div>

            {/* ---- Success Message ---- */}
            {saveSuccess && (
              <div className={styles.successMessage}>
                <span className={styles.successIcon}>✓</span>
                <p className={styles.successText}>Your changes have been saved successfully</p>
              </div>
            )}

            {/* ---- Settings Form ---- */}
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Profile Information</h2>

                {/* ---- Display Name ---- */}
                <div className={styles.formGroup}>
                  <label htmlFor="displayName" className={styles.label}>
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    className={`${styles.input} ${formErrors.displayName ? styles.inputError : ''}`}
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    disabled={isSaving}
                    maxLength={100}
                    placeholder="Your display name"
                  />
                  <p className={styles.helpText}>
                    {formData.displayName.length}/100 characters
                  </p>
                  {formErrors.displayName && (
                    <p className={styles.fieldError}>{formErrors.displayName}</p>
                  )}
                </div>

                {/* ---- Email ---- */}
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={user.email || ''}
                    disabled
                    placeholder="your@email.com"
                  />
                  <p className={styles.helpText}>
                    Read-only. Contact support to change your email.
                  </p>
                </div>

                {/* ---- Bio ---- */}
                <div className={styles.formGroup}>
                  <label htmlFor="bio" className={styles.label}>
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    className={`${styles.textarea} ${formErrors.bio ? styles.inputError : ''}`}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    disabled={isSaving}
                    maxLength={200}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                  <p className={styles.helpText}>
                    {formData.bio.length}/200 characters
                  </p>
                  {formErrors.bio && (
                    <p className={styles.fieldError}>{formErrors.bio}</p>
                  )}
                </div>

                {/* ---- Avatar URL ---- */}
                <div className={styles.formGroup}>
                  <label htmlFor="avatarUrl" className={styles.label}>
                    Avatar URL
                  </label>
                  <input
                    id="avatarUrl"
                    type="text"
                    className={`${styles.input} ${formErrors.avatarUrl ? styles.inputError : ''}`}
                    value={formData.avatarUrl}
                    onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                    disabled={isSaving}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className={styles.helpText}>
                    Enter a URL to an image file. Must be a valid HTTPS URL.
                  </p>
                  {formErrors.avatarUrl && (
                    <p className={styles.fieldError}>{formErrors.avatarUrl}</p>
                  )}
                  {formData.avatarUrl && isValidUrl(formData.avatarUrl) && (
                    <div className={styles.avatarPreview}>
                      <img
                        src={formData.avatarUrl}
                        alt="Avatar preview"
                        className={styles.avatarPreviewImage}
                        onError={() => {
                          setFormErrors((prev) => ({
                            ...prev,
                            avatarUrl: 'Image could not be loaded',
                          }));
                        }}
                      />
                      <p className={styles.previewLabel}>Preview</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ---- Save Button ---- */}
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* ---- Danger Zone ---- */}
            <div className={styles.dangerZone}>
              <h2 className={styles.sectionTitle}>Danger Zone</h2>

              <div className={styles.dangerCard}>
                <div className={styles.dangerContent}>
                  <h3 className={styles.dangerTitle}>Delete Account</h3>
                  <p className={styles.dangerDescription}>
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              </div>

              {/* ---- Delete Confirmation Dialog ---- */}
              {showDeleteConfirm && (
                <div className={styles.modal}>
                  <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)} />

                  <div className={styles.modalContent}>
                    <button
                      type="button"
                      className={styles.closeButton}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      ✕
                    </button>

                    <h3 className={styles.modalTitle}>Delete Account?</h3>

                    <p className={styles.modalDescription}>
                      Are you absolutely sure? This action will permanently delete your account, all your posts,
                      and all associated data. This cannot be undone.
                    </p>

                    <p className={styles.modalWarning}>
                      Type your email address to confirm: <strong>{user.email}</strong>
                    </p>

                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.deleteConfirmButton}
                        onClick={handleDeleteAccount}
                      >
                        Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

/* ================================================================
   Wrapped Component with ProtectedRoute
   ================================================================ */

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
