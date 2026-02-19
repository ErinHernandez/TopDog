import React from 'react';

import SevenSegmentCountdown from '../components/SevenSegmentCountdown';

export default function TestMonocraft() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Monocraft Font Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Test 1: Basic Monocraft Text */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Basic Monocraft Text</h2>
            <div 
              className="text-3xl font-bold text-green-400"
              style={{ fontFamily: 'Monocraft, monospace' }}
            >
              12:34:56
            </div>
            <div 
              className="text-lg text-blue-400 mt-2"
              style={{ fontFamily: 'Monocraft, monospace' }}
            >
              COUNTDOWN TEST
            </div>
          </div>
          
          {/* Test 2: Seven Segment with Monocraft */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Seven Segment with Monocraft</h2>
            <div className="flex flex-col space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Original SVG Version:</p>
                <SevenSegmentCountdown initialSeconds={30} />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Monocraft Text Version:</p>
                <SevenSegmentCountdown initialSeconds={30} useMonocraft={true} />
              </div>
            </div>
          </div>
          
          {/* Test 3: Font Loading Check */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Font Loading Check</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Monocraft Font:</p>
                <div 
                  className="text-2xl font-bold text-red-400"
                  style={{ fontFamily: 'Monocraft, monospace' }}
                >
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </div>
                <div 
                  className="text-2xl font-bold text-red-400"
                  style={{ fontFamily: 'Monocraft, monospace' }}
                >
                  0123456789
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Fallback Font:</p>
                <div className="text-2xl font-bold text-gray-400 font-mono">
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </div>
                <div className="text-2xl font-bold text-gray-400 font-mono">
                  0123456789
                </div>
              </div>
            </div>
          </div>
          
          {/* Test 4: Draft Room Style */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Draft Room Style</h2>
            <div className="bg-black p-4 rounded">
              <SevenSegmentCountdown initialSeconds={25} useMonocraft={true} />
            </div>
            <div className="text-sm text-gray-400 mt-2">
              This should match the draft room timer style
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How to Check</h2>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Monocraft Text</strong> should have a distinctive Minecraft-style appearance</p>
            <p>2. <strong>Fallback Text</strong> should look like standard monospace font</p>
            <p>3. <strong>Seven Segment Monocraft</strong> should have red glowing text instead of SVG segments</p>
            <p>4. If you see the same font for both Monocraft and Fallback, the font may not be loading</p>
            <p>5. Check browser console for any font loading errors</p>
          </div>
        </div>
      </div>
    </div>
  );
}
