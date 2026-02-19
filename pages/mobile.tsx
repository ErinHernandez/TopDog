import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

/**
 * /mobile redirects to / – app is now the same for all devices.
 */
export default function MobilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
