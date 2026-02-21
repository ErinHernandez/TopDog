import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function Home(): React.ReactElement {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/topdog');
    }
  }, [user, authLoading, router]);

  const handlePasswordBlur = async () => {
    if (!identifier.trim() || !password || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(identifier, password);
    } catch {
      setError(authError || 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>TopDog</title>
        <meta name="description" content="TopDog — Enterprise Fantasy Football" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={s.main}>
        {(error || authError) && <p style={s.error}>{error || authError}</p>}

        <form style={s.form} onSubmit={e => e.preventDefault()}>
          <input
            type="text"
            style={s.input}
            placeholder=""
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            disabled={isSubmitting}
            autoComplete="username"
          />

          <div style={s.passwordWrap}>
            <input
              type={showPassword ? 'text' : 'password'}
              style={{ ...s.input, paddingRight: '3rem' }}
              placeholder=""
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <button
              type="button"
              style={s.eyeBtn}
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7a94"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {showPassword ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </form>
      </main>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0a1628',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    boxShadow: 'inset 0 0 0 4.3px #10b981',
    padding: '0 1.5rem',
    boxSizing: 'border-box',
  },
  error: {
    color: '#f87171',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '360px',
  },
  input: {
    width: '100%',
    padding: '0.85rem 1rem',
    fontSize: '0.9375rem',
    fontFamily: 'inherit',
    background: '#1a2740',
    border: '1px solid #2d4a6b',
    borderRadius: '10px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  passwordWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
  },
};

// Force SSR to avoid static prerender errors (useAuth needs provider at runtime)
export const getServerSideProps = () => ({ props: {} });
