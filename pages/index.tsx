import React from 'react';
import Head from 'next/head';
import { AppShellVX2 } from '../components/vx2';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>TopDog</title>
        <meta name="description" content="TopDog" />
      </Head>
      <AppShellVX2 />
    </>
  );
}
