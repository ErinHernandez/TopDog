/**
 * Mobile Payment Methods Page
 * 
 * Thin wrapper that renders the PaymentPageContent component.
 * All UI logic has been extracted to components/mobile/pages/PaymentPageContent.js
 */

import Head from 'next/head';
import React from 'react';

import PaymentPageContent from '../components/mobile/pages/PaymentPageContent';

export default function MobilePaymentPage() {
  return (
    <>
      <Head>
        <title>Payment Methods - TopDog Mobile</title>
        <meta name="description" content="Manage your payment methods and options" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <PaymentPageContent />
    </>
  );
}
