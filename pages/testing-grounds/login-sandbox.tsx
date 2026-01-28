/**
 * Login Sandbox - Testing Grounds Page
 *
 * Isolated area to develop and test the VX2 login system:
 * modals (Sign In, Sign Up, Forgot Password, Profile) and full-screen login/signup screens.
 *
 * Access at: /testing-grounds/login-sandbox
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { LoginSandbox } from '../../sandbox/login';

export default function LoginSandboxPage(): React.ReactElement {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          color: '#fff',
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Login Sandbox - TopDog</title>
        <meta
          name="description"
          content="Sandbox for VX2 login system: modals and full-screen auth flows"
        />
      </Head>
      <div
        className="relative w-full min-h-screen overflow-auto"
        style={{ backgroundColor: '#1a1a2e' }}
      >
        <LoginSandbox defaultMode="modals" label="Login System Sandbox" />
      </div>
    </>
  );
}
