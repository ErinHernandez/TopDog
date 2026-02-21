/**
 * Idesaign — Sign Up Page
 *
 * Premium registration page with:
 * - Display Name, Email, Password, Confirm Password fields
 * - Client-side validation (8+ chars, matching passwords)
 * - Google OAuth button
 * - Error display
 * - Loading states
 * - Redirect on success to /dashboard
 * - Redirect if already authenticated
 *
 * @module pages/signup
 */

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth/AuthProvider';
import styles from '@/styles/signup.module.css';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */

interface FormState {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/* ----------------------------------------------------------------
   Utility: Google Icon (Inline SVG)
   ---------------------------------------------------------------- */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="currentColor"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="currentColor"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="currentColor"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ----------------------------------------------------------------
   Component: Sign Up Page
   ---------------------------------------------------------------- */

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, signUp, signInWithGoogle } = useAuth();

  const [formState, setFormState] = useState<FormState>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayError, setDisplayError] = useState<string | null>(null);

  /* ---- redirect if authenticated ---- */
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  /* ---- form validation ---- */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formState.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formState.displayName.trim().length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }

    if (!formState.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formState.password) {
      errors.password = 'Password is required';
    } else if (formState.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formState.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formState.password !== formState.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ---- handle submit ---- */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDisplayError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(formState.email, formState.password, formState.displayName);
      // Redirect handled by useEffect above
    } catch {
      setDisplayError(authError || 'Sign up failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- handle google sign in ---- */
  const handleGoogleSignIn = async () => {
    setDisplayError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      // Redirect handled by useEffect above
    } catch {
      setDisplayError(authError || 'Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- handle input change ---- */
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const displayedError = displayError || authError;

  return (
    <>
      <Head>
        <title>Create Account — Idesaign</title>
        <meta name="description" content="Create an Idesaign account to start designing" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        <div className={styles.card}>
          {/* Logo/Branding */}
          <div className={styles.header}>
            <h1 className={styles.logo}>Idesaign</h1>
            <p className={styles.tagline}>Create your account</p>
          </div>

          {/* Error Display */}
          {displayedError && (
            <div className={styles.errorBanner}>
              <div className={styles.errorIcon}>!</div>
              <p className={styles.errorText}>{displayedError}</p>
            </div>
          )}

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Display Name Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="displayName" className={styles.label}>
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                className={`${styles.input} ${formErrors.displayName ? styles.inputError : ''}`}
                placeholder="Your name"
                value={formState.displayName}
                onChange={e => handleInputChange('displayName', e.target.value)}
                disabled={isSubmitting}
                autoComplete="name"
              />
              {formErrors.displayName && (
                <p className={styles.fieldError}>{formErrors.displayName}</p>
              )}
            </div>

            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={`${styles.input} ${formErrors.email ? styles.inputError : ''}`}
                placeholder="you@example.com"
                value={formState.email}
                onChange={e => handleInputChange('email', e.target.value)}
                disabled={isSubmitting}
                autoComplete="email"
              />
              {formErrors.email && <p className={styles.fieldError}>{formErrors.email}</p>}
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className={`${styles.input} ${formErrors.password ? styles.inputError : ''}`}
                placeholder="••••••••"
                value={formState.password}
                onChange={e => handleInputChange('password', e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {formErrors.password && <p className={styles.fieldError}>{formErrors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`${styles.input} ${formErrors.confirmPassword ? styles.inputError : ''}`}
                placeholder="••••••••"
                value={formState.confirmPassword}
                onChange={e => handleInputChange('confirmPassword', e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {formErrors.confirmPassword && (
                <p className={styles.fieldError}>{formErrors.confirmPassword}</p>
              )}
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>or</span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || authLoading}
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </button>

          {/* Sign In Link */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Already have an account?{' '}
              <Link href="/login" className={styles.footerLink}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Force SSR to avoid static prerender errors (useAuth needs provider at runtime)
export const getServerSideProps = () => ({ props: {} });
