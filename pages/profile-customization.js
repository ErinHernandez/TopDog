import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BorderColorPicker from '../components/BorderColorPicker';
import { useUser } from '../lib/userContext';

export default function ProfileCustomization() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
        <div className="text-white text-xl">Please log in to access profile customization.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-x-auto" style={{ background: 'url(/wr_blue.png) repeat-y', backgroundSize: 'auto 100%', backgroundPosition: 'center center' }}>
      <Head>
        <title>Profile Customization - TopDog.dog</title>
        <meta name="description" content="Customize your TopDog.dog profile settings" />
      </Head>
      
      <div className="min-w-[1400px]">
        {/* Subheader Navigation */}
        <section className="border-b border-gray-700 bg-white">
          <div className="container mx-auto px-4" style={{ minWidth: '1400px' }}>
            <div className="flex justify-start space-x-8 items-center" style={{ marginTop: '0px', marginBottom: '0px', height: '54px' }}>
              <Link href="/" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '0.95rem', WebkitTextStroke: '0.12px #18181b', color: '#ffffff', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Home
              </Link>
              <Link href="/my-teams" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '0.95rem', WebkitTextStroke: '0.12px #18181b', color: '#ffffff', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                My Teams
              </Link>
              <Link href="/exposure" className="font-medium text-base pb-1 transition-colors" style={{ fontSize: '0.95rem', WebkitTextStroke: '0.12px #18181b', color: '#ffffff', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Exposure Report
              </Link>
              <span className="font-medium border-b-2 border-yellow-400 pb-1 text-base" style={{ fontSize: '0.95rem', WebkitTextStroke: '0.12px #18181b', color: '#ffffff', background: 'url(/wr_blue.png) no-repeat center center', backgroundSize: 'cover', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Profile Customization
              </span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8" style={{ minWidth: '1400px' }}>
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Profile Customization</h1>
              <p className="text-gray-300">
                Personalize your TopDog experience with custom colors and settings.
              </p>
            </div>

            {/* Customization Sections */}
            <div className="space-y-8">
              
              {/* Border Color Customization */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Draft Room Appearance</h2>
                <BorderColorPicker />
              </div>

              {/* Future Customization Sections */}
              <div className="p-6 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
                <h3 className="text-lg font-semibold text-gray-400 mb-2">Coming Soon</h3>
                <p className="text-gray-500">
                  Additional customization options including themes, avatars, and more personalization features will be available in future updates.
                </p>
              </div>

            </div>

            {/* Back to Profile Link */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <Link 
                href="/profile" 
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Profile
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
