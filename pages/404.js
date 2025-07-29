import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | TopDog.dog</title>
        <meta name="description" content="Page not found" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4" style={{ color: '#c4b5fd' }}>404</h1>
          <p className="text-xl mb-8 text-gray-300">Page not found</p>
          <Link href="/">
            <button className="bg-[#c4b5fd] text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-[#2DE2C5] transition-colors">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    </>
  );
} 