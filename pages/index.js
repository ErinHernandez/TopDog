import React from 'react';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>TopDog</title>
        <meta name="description" content="TopDog - Coming Soon" />
      </Head>

      <main
        style={{
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          background: 'url(/wr_blue.png) no-repeat center center',
          backgroundSize: 'cover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/under_construction_no_bg.png"
          alt="TopDog - Under Construction"
          style={{
            width: '200px',
            height: 'auto',
          }}
        />
      </main>
    </>
  );
}
