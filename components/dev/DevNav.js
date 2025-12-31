/**
 * DevNav - Shared navigation component for testing grounds
 * 
 * Provides consistent navigation across all dev/testing pages:
 * - Compare with links
 * - Back/Forward browser navigation
 * - Draggable position (persisted to localStorage)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const STORAGE_KEY = 'devnav-position';
const MINIMIZED_KEY = 'devnav-minimized';

export default function DevNav() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [isMinimized, setIsMinimized] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  // Load saved position and minimized state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPosition(parsed);
      }
      const minimized = localStorage.getItem(MINIMIZED_KEY);
      if (minimized) {
        setIsMinimized(JSON.parse(minimized));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);
  
  // Save position when it changes
  useEffect(() => {
    if (position.x !== null && position.y !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [position]);
  
  // Save minimized state when it changes
  useEffect(() => {
    try {
      localStorage.setItem(MINIMIZED_KEY, JSON.stringify(isMinimized));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [isMinimized]);
  
  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);
  
  const handleMouseDown = useCallback((e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setIsDragging(true);
    e.preventDefault();
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    
    // Constrain to viewport
    const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 200);
    const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 200);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  }, [isDragging]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  // Add/remove global mouse listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  // Reset position to default (bottom-right)
  const handleReset = useCallback(() => {
    setPosition({ x: null, y: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Ignore
    }
  }, []);

  // Calculate style based on position
  const positionStyle = position.x !== null && position.y !== null
    ? { left: position.x, top: position.y }
    : { bottom: 20, right: 20 };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        ...positionStyle,
        backgroundColor: '#1F2937',
        borderRadius: isMinimized ? 8 : 12,
        padding: isMinimized ? 8 : 16,
        paddingTop: 8,
        paddingBottom: isMinimized ? 8 : 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        zIndex: 9999,
        minWidth: isMinimized ? 'auto' : 200,
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMinimized ? 0 : 8,
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '4px 0',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          {/* Grip icon */}
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="#6B7280"
            style={{ flexShrink: 0 }}
          >
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="9" r="1.5" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
          <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
            DEV NAV
          </span>
        </div>
        {/* Header buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Reset position button */}
          {position.x !== null && !isMinimized && (
            <button
              onClick={handleReset}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                fontSize: 10,
                cursor: 'pointer',
                padding: '2px 4px',
              }}
              title="Reset to default position"
            >
              reset
            </button>
          )}
          {/* Minimize/Expand button */}
          <button
            onClick={toggleMinimized}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B7280',
              fontSize: 14,
              cursor: 'pointer',
              padding: '2px 6px',
              lineHeight: 1,
            }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '+' : '-'}
          </button>
        </div>
      </div>
      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <>
          {/* Compare with Links */}
          <div 
            style={{ 
              marginBottom: 12,
              maxHeight: 120,
              overflowY: 'auto',
            }}
          >
            <Link 
              href="/testing-grounds/mobile-apple-demo"
              style={{
                display: 'block',
                padding: '6px 10px',
                backgroundColor: router.pathname === '/testing-grounds/mobile-apple-demo' ? '#4B3621' : '#78350F',
                color: '#FCD34D',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 4,
                textDecoration: 'none',
              }}
            >
              Mobile Demo (Original)
            </Link>
            <Link 
              href="/testing-grounds/vx-mobile-demo"
              style={{
                display: 'block',
                padding: '6px 10px',
                backgroundColor: router.pathname === '/testing-grounds/vx-mobile-demo' ? '#374151' : '#111827',
                color: '#D1D5DB',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 4,
                textDecoration: 'none',
              }}
            >
              VX Draft Room (Original)
            </Link>
            <Link 
              href="/testing-grounds/vx2-mobile-app-demo"
              style={{
                display: 'block',
                padding: '6px 10px',
                backgroundColor: router.pathname === '/testing-grounds/vx2-mobile-app-demo' ? '#374151' : '#111827',
                color: '#D1D5DB',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 4,
                textDecoration: 'none',
              }}
            >
              VX2 App Shell
            </Link>
            <Link 
              href="/testing-grounds/card-sandbox"
              style={{
                display: 'block',
                padding: '6px 10px',
                backgroundColor: router.pathname === '/testing-grounds/card-sandbox' ? '#1E3A5F' : '#1E3A8A',
                color: '#93C5FD',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 4,
                textDecoration: 'none',
              }}
            >
              Card Sandbox
            </Link>
            <Link 
              href="/testing-grounds/navbar-sandbox"
              style={{
                display: 'block',
                padding: '6px 10px',
                backgroundColor: router.pathname === '/testing-grounds/navbar-sandbox' ? '#4C1D95' : '#5B21B6',
                color: '#C4B5FD',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 4,
                textDecoration: 'none',
              }}
            >
              Navbar Sandbox
            </Link>
            <Link 
              href="/testing-grounds/vx2-draft-room"
              style={{
                display: 'block',
                padding: '6px 10px',
                backgroundColor: router.pathname === '/testing-grounds/vx2-draft-room' ? '#1F4D3A' : '#14532D',
                color: '#86EFAC',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 4,
                textDecoration: 'none',
              }}
            >
              VX2 Draft Room
            </Link>
            <Link 
              href="/testing-grounds/vx2-tablet-draft-room"
              style={{
                display: 'block',
                padding: '6px 10px',
                backgroundColor: router.pathname === '/testing-grounds/vx2-tablet-draft-room' ? '#7C2D12' : '#9A3412',
                color: '#FDBA74',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 4,
                textDecoration: 'none',
              }}
            >
              VX2 Tablet Draft
            </Link>
            <Link 
              href="/testing-grounds/device-comparison"
              style={{
                display: 'block',
                padding: '6px 10px',
                backgroundColor: router.pathname === '/testing-grounds/device-comparison' ? '#0F766E' : '#14B8A6',
                color: '#CCFBF1',
                borderRadius: 6,
                fontSize: 12,
                textDecoration: 'none',
              }}
            >
              Device Comparison
            </Link>
          </div>
          
          {/* Browser Navigation */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 24,
              paddingTop: 4,
              paddingBottom: 0,
              borderTop: '1px solid #374151',
            }}
          >
            <button 
              onClick={() => router.back()}
              style={{
                backgroundColor: 'transparent',
                color: '#D1D5DB',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              title="Go back"
            >
              &lt;
            </button>
            <button 
              onClick={() => window.history.forward()}
              style={{
                backgroundColor: 'transparent',
                color: '#D1D5DB',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              title="Go forward"
            >
              &gt;
            </button>
          </div>
        </>
      )}
    </div>
  );
}

