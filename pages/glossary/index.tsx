/**
 * Design System Glossary - Landing Page
 * Routes to TopDog (fantasy football) and Idesaign (image editor) glossaries
 */

import { Palette, Gamepad2, ArrowRight } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';

import { elements as topdogElements } from '@/lib/glossary/elements';
import { STUDIO_GLOSSARY_ELEMENTS } from '@/lib/glossary-studio';

export default function GlossaryLanding() {
  return (
    <>
      <Head>
        <title>Design System Glossary</title>
        <meta name="description" content="UI element documentation for TopDog and Idesaign" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: '#1e2a3a',
        color: '#e8f0fb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '40px 20px',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '8px',
          color: '#ffffff',
        }}>
          Design System Glossary
        </h1>
        <p style={{
          fontSize: '0.95rem',
          color: '#8899aa',
          marginBottom: '48px',
        }}>
          Comprehensive UI element documentation
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          maxWidth: '720px',
          width: '100%',
        }}>
          <Link href="/topdog/glossary" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              background: '#243347',
              border: '1px solid #2d3f52',
              borderRadius: '8px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4a7fbf';
              e.currentTarget.style.background = '#2a3d55';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2d3f52';
              e.currentTarget.style.background = '#243347';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Gamepad2 size={24} color="#4a9eff" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>TopDog</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#8899aa', marginBottom: '20px', lineHeight: 1.5 }}>
                Fantasy football platform UI elements. Draft room, lobby, teams, and navigation components.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.8rem',
                  color: '#6b7c8d',
                  background: '#1e2a3a',
                  padding: '4px 10px',
                  borderRadius: '4px',
                }}>
                  {topdogElements.length} elements -- 9 modules
                </span>
                <ArrowRight size={16} color="#4a9eff" />
              </div>
            </div>
          </Link>

          <Link href="/Idesaign/glossary" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              background: '#243347',
              border: '1px solid #2d3f52',
              borderRadius: '8px',
              padding: '32px',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4a7fbf';
              e.currentTarget.style.background = '#2a3d55';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2d3f52';
              e.currentTarget.style.background = '#243347';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Palette size={24} color="#4a9eff" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Idesaign</h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#8899aa', marginBottom: '20px', lineHeight: 1.5 }}>
                AI-powered image editor tools. Selection, paint, draw, transform, adjustment, AI, and utility tools.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '0.8rem',
                  color: '#6b7c8d',
                  background: '#1e2a3a',
                  padding: '4px 10px',
                  borderRadius: '4px',
                }}>
                  {STUDIO_GLOSSARY_ELEMENTS.length} elements -- 7 modules
                </span>
                <ArrowRight size={16} color="#4a9eff" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
