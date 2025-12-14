import React from 'react';
import { createRosterGradient } from '../lib/gradientUtils';

export default function BadgeTest() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#101927', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', marginBottom: '30px' }}>Dot Test</h1>
      
      {/* Test 1: Just 4 identical divs */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>Test 1: Four identical divs</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
        </div>
      </div>

      {/* Test 2: Same dots in colored containers */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>Test 2: Dots in colored containers</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ 
            width: '24px', 
            height: '15px', 
            backgroundColor: '#F472B6',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          </div>
          <div style={{ 
            width: '24px', 
            height: '15px', 
            backgroundColor: '#0fba80',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          </div>
          <div style={{ 
            width: '24px', 
            height: '15px', 
            backgroundColor: '#4285F4',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          </div>
          <div style={{ 
            width: '24px', 
            height: '15px', 
            backgroundColor: '#7C3AED',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          </div>
        </div>
      </div>

      {/* Test 3: All same background color to isolate the issue */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>Test 3: All same background (should be identical)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ 
            width: '24px', 
            height: '15px', 
            backgroundColor: '#F472B6',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          </div>
          <div style={{ 
            width: '24px', 
            height: '15px', 
            backgroundColor: '#F472B6',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          </div>
          <div style={{ 
            width: '24px', 
            height: '15px', 
            backgroundColor: '#F472B6',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          </div>
          <div style={{ 
            width: '24px', 
            height: '15px', 
            backgroundColor: '#F472B6',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'white', borderRadius: '50%' }}></div>
          </div>
        </div>
      </div>

      {/* Fresh Badge Test - Clean Implementation */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>Fresh Badge Test: Position badges with text</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* QB Badge 1 */}
          <div style={{
            width: '24px',
            height: '15px',
            backgroundColor: '#F472B6',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'normal'
          }}>
            QB
          </div>
          
          {/* RB Badge 2 */}
          <div style={{
            width: '24px',
            height: '15px',
            backgroundColor: '#0fba80',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'normal'
          }}>
            RB
          </div>
          
          {/* WR Badge 3 */}
          <div style={{
            width: '24px',
            height: '15px',
            backgroundColor: '#4285F4',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'normal'
          }}>
            WR
          </div>
          
          {/* TE Badge 4 */}
          <div style={{
            width: '24px',
            height: '15px',
            backgroundColor: '#7C3AED',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'normal'
          }}>
            TE
          </div>
        </div>
      </div>

      {/* FLEX Badge Test - Matching roster gradient */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: 'white', marginBottom: '15px' }}>FLEX Badge: Three-section gradient like roster</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* FLEX Badge with three-section gradient */}
          <div style={{
            width: '32px',
            height: '15px',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '9px',
            fontWeight: 'bold',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Three-section gradient background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              zIndex: 1,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Top section (33.33%) - RB gradient */}
              <div style={{
                height: '33.33%',
                background: createRosterGradient('RB').firstGradient
              }}></div>
              
              {/* Middle section (33.33%) - WR gradient */}
              <div style={{
                height: '33.33%',
                background: createRosterGradient('WR').firstGradient
              }}></div>
              
              {/* Bottom section (33.33%) - TE gradient */}
              <div style={{
                height: '33.33%',
                background: createRosterGradient('TE').firstGradient
              }}></div>
            </div>
            
            {/* Text overlay */}
            <span style={{ position: 'relative', zIndex: 2 }}>FLEX</span>
          </div>

          {/* Regular position badges for comparison */}
          <div style={{
            width: '24px',
            height: '15px',
            backgroundColor: '#0fba80',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'normal'
          }}>
            RB
          </div>
          
          <div style={{
            width: '24px',
            height: '15px',
            backgroundColor: '#4285F4',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'normal'
          }}>
            WR
          </div>
          
          <div style={{
            width: '24px',
            height: '15px',
            backgroundColor: '#7C3AED',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'normal'
          }}>
            TE
          </div>
        </div>
      </div>
    </div>
  );
}