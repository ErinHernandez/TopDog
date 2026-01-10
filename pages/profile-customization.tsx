/**
 * Profile Customization Page - Mobile Only
 * 
 * Mobile-optimized customization page using MobilePhoneFrame.
 * All customization features: flags, overlays, patterns, colors.
 */

import React from 'react';
import Head from 'next/head';
import { AuthProvider } from '@/components/vx2/auth/context/AuthContext';
import ProfileCustomizationContent from '../components/mobile/pages/ProfileCustomizationContent';
import DevNav from '../components/dev/DevNav';

export default function ProfileCustomizationRoute() {
  return (
    <>
      <Head>
        <title>Profile Customization - TopDog.dog</title>
        <meta name="description" content="Customize your TopDog.dog profile settings" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <AuthProvider>
        <ProfileCustomizationContent />
        <DevNav />
      </AuthProvider>
    </>
  );
}
