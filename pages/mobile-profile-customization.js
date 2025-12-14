/**
 * Mobile Profile Customization Page
 * 
 * Thin wrapper that renders the ProfileCustomizationContent component.
 * All UI logic has been extracted to components/mobile/pages/ProfileCustomizationContent.js
 */

import React from 'react';
import Head from 'next/head';
import ProfileCustomizationContent from '../components/mobile/pages/ProfileCustomizationContent';

export default function MobileProfileCustomization() {
  return (
    <>
      <Head>
        <title>Profile Customization - TopDog.dog</title>
        <meta name="description" content="Customize your TopDog.dog profile settings" />
      </Head>

      <ProfileCustomizationContent />
    </>
  );
}
