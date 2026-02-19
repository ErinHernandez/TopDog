/**
 * Idesaign — Sign In Page
 *
 * Dark, minimal login matching the homepage palette.
 * Accepts username or email.
 *
 * @module pages/login
 */

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth/AuthProvider';
import styles from '@/styles/login.module.css';

/* ----------------------------------------------------------------
   Types
   ---------------------------------------------------------------- */

interface FormState {
  identifier: string;
  password: string;
}

interface FormErrors {
  identifier?: string;
  password?: string;
}

/* ----------------------------------------------------------------
   Component: Sign In Page
   ---------------------------------------------------------------- */

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, signIn } = useAuth();

  const [formState, setFormState] = useState<FormState>({
    identifier: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayError, setDisplayError] = useState<string | null>(null);

  /* ---- redirect if authenticated ---- */
  useEffect(() => {
    if (!authLoading && user) {
      const returnUrl =
        typeof router.query.returnUrl === 'string' ? router.query.returnUrl : '/dashboard';
      router.push(returnUrl);
    }
  }, [user, authLoading, router]);

  /* ---- form validation ---- */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formState.identifier.trim()) {
      errors.identifier = 'Username or email is required';
    }

    if (!formState.password) {
      errors.password = 'Password is required';
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
      await signIn(formState.identifier, formState.password);
      // Redirect handled by useEffect above
    } catch {
      // Error is set in auth context, displayed via authError
      setDisplayError(authError || 'Sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- handle input change ---- */
  const handleInputChange = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
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
        <title>Sign In — Idesaign</title>
        <meta name="description" content="Sign in to Idesaign" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        {/* Background glow */}
        <div className={styles.glow} />

        <div className={styles.card}>
          {/* Logo */}
          <div className={styles.header}>
            <h1 className={styles.logo}>Idesaign</h1>
            <p className={styles.tagline}>Sign in to your account</p>
          </div>

          {/* Error Display */}
          {displayedError && (
            <div className={styles.errorBanner}>
              <p className={styles.errorText}>{displayedError}</p>
            </div>
          )}

          {/* Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Username / Email Field */}
            <div className={styles.fieldGroup}>
              <label htmlFor="identifier" className={styles.label}>
                Username or Email
              </label>
              <input
                id="identifier"
                type="text"
                className={`${styles.input} ${formErrors.identifier ? styles.inputError : ''}`}
                placeholder="username or email"
                value={formState.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                disabled={isSubmitting}
                autoComplete="username"
              />
              {formErrors.identifier && (
                <p className={styles.fieldError}>{formErrors.identifier}</p>
              )}
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
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              {formErrors.password && (
                <p className={styles.fieldError}>{formErrors.password}</p>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Back to home */}
          <div className={styles.links}>
            <Link href="/" className={styles.link}>
              ← Back
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
