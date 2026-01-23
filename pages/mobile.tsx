import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

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
