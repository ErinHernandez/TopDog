/**
 * Idesaign — Profile Index Redirect
 *
 * /profile → redirects to /profile/[currentUserId]
 * If not logged in → redirects to /login
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth/AuthProvider';

export default function ProfileIndex() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else {
      router.replace(`/profile/${user.uid}`);
    }
  }, [user, loading, router]);

  return null;
}

// Force SSR to avoid static prerender errors (useAuth needs provider at runtime)
export const getServerSideProps = () => ({ props: {} });
