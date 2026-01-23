/**
 * Dev Scroll Test Page
 * 
 * Isolated testing environment for scrolling issues
 */

import React, { useState } from 'react';
import Head from 'next/head';
import ScrollTestNonDraft from '../dev/ScrollTestNonDraft';
import ScrollTestDraft from '../dev/ScrollTestDraft';

type TestMode = 'non-draft' | 'draft';

export default function DevScrollTest() {
  const [testMode, setTestMode] = useState<TestMode>('non-draft');

  return (
    <>
      <Head>
        <title>Scroll Test - Dev Environment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
        <div 
          className="bg-black rounded-3xl p-1"
          style={{ 
            width: '375px', 
            height: '812px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}
        >
          <div 
            className="bg-black rounded-3xl overflow-hidden relative"
            style={{ width: '100%', height: '100%' }}
          >
            <div className="h-full bg-[#101927] text-white flex flex-col">
              {/* Test Mode Selector */}
              <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                <h1 className="text-lg font-semibold">Scroll Test</h1>
                <select 
                  value={testMode}
                  onChange={(e) => setTestMode(e.target.value as TestMode)}
                  className="bg-blue-700 text-white px-2 py-1 rounded text-sm"
                >
                  <option value="non-draft">Non-Draft</option>
                  <option value="draft">Draft Room</option>
                </select>
              </div>

              {/* Test Content */}
              <div className="flex-1 min-h-0">
                {testMode === 'non-draft' ? (
                  <ScrollTestNonDraft />
                ) : (
                  <ScrollTestDraft />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="fixed top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <h3 className="font-bold mb-2">Scroll Test Instructions</h3>
        <div className="text-sm space-y-1">
          <p><strong>Non-Draft:</strong> Tests baseline mobile scrolling</p>
          <p><strong>Draft Room:</strong> Tests roster/board/info tab scrolling</p>
          <p className="text-green-600 mt-2">✓ Success: Can scroll to see "END" message</p>
          <p className="text-red-600">✗ Failure: Cannot reach bottom content</p>
        </div>
      </div>
    </>
  );
}
