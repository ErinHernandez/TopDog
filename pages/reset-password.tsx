/**
 * Idesaign — Reset Password Page
 *
 * Password recovery page with:
 * - Email input field
 * - "Send Reset Link" button
 * - Success state message
 * - Error display
 * - Loading states
 * - Back to sign in link
 * - Redirect if already authenticated
 *
 * @module pages/reset-password
 */

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth/AuthProvider';
import styles from '@/styles/reset-password.module.css';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */

interface FormState {
  email: string;
}

interface FormErrors {
  email?: string;
}

/* ----------------------------------------------------------------
   Component: Reset Password Page
   ---------------------------------------------------------------- */

export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, resetPassword } = useAuth();

  const [formState, setFormState] = useState<FormState>({
    email: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* ---- redirect if authenticated ---- */
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  /* ---- form validation ---- */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formState.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ---- handle submit ---- */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDisplayError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(formState.email);
      setSuccessMessage('Check your email for a password reset link. It may take a few minutes to arrive.');
      setFormState({ email: '' });
    } catch {
      setDisplayError(authError || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- handle input change ---- */
  const handleInputChange = (value: string) => {
    setFormState({ email: value });
    if (formErrors.email) {
      setFormErrors({});
    }
  };

  const displayedError = displayError || authError;

  return (
    <>
      <Head>
        <title>Reset Password — Idesaign</title>
        <meta name="description" content="Reset your Idesaign account password" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        <div className={styles.card}>
          {/* Logo/Branding */}
          <div className={styles.header}>
            <h1 className={styles.logo}>Idesaign</h1>
            <p className={styles.tagline}>Reset your password</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className={styles.successBanner}>
              <div className={styles.successIcon}>✓</div>
              <div>
                <p className={styles.successTitle}>Reset link sent</p>
                <p className={styles.successText}>{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {displayedError && (
            <div className={styles.errorBanner}>
              <div className={styles.errorIcon}>!</div>
              <p className={styles.errorText}>{displayedError}</p>
            </div>
          )}

          {/* Form */}
          {!successMessage && (
            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <p className={styles.fieldDescription}>
                  Enter the email address associated with your account.
                </p>
                <input
                  id="email"
                  type="email"
                  className={`${styles.input} ${formErrors.email ? styles.inputError : ''}`}
                  placeholder="you@example.com"
                  value={formState.email}
                  onChange={(e) => handleInputChange(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                {formErrors.email && <p className={styles.fieldError}>{formErrors.email}</p>}
              </div>

              {/* Send Reset Link Button */}
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {/* Back to Sign In Link */}
          <div className={styles.footer}>
            <Link href="/login" className={styles.backLink}>
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
