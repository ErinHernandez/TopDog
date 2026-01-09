/**
 * Dynamic Island Sandbox Demo Page
 * 
 * Demonstrates the three Dynamic Island states:
 * 1. In-draft state
 * 2. Out-of-draft state
 * 3. Out-of-app-during-live-draft state
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DynamicIslandSandbox, { type DynamicIslandState } from '../../components/vx2/dynamic-island/DynamicIslandSandbox';
import type { DraftStatus } from '../../components/vx2/draft-room/types';

export default function DynamicIslandSandboxPage(): React.ReactElement {
  const [currentState, setCurrentState] = useState<DynamicIslandState>('in-draft');
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('active');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [currentPickNumber, setCurrentPickNumber] = useState(1);
  const [autoCycle, setAutoCycle] = useState(false);

  // Simulate draft progression
  useEffect(() => {
    if (currentState !== 'in-draft' || draftStatus !== 'active') return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 0) {
          // Reset timer and advance pick
          setCurrentPickNumber((p) => Math.min(216, p + 1));
          setIsMyTurn((t) => !t); // Alternate turns
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentState, draftStatus]);

  return (
    <>
      <Head>
        <title>Dynamic Island Sandbox - TopDog</title>
        <meta name="description" content="Dynamic Island sandbox for draft timer states" />
      </Head>

      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h1 className="text-3xl font-bold mb-2">Dynamic Island Sandbox</h1>
            <p className="text-gray-600 mb-6">
              Demonstration of Dynamic Island states for draft timer functionality
            </p>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Draft Status</label>
                <select
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as DraftStatus)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="loading">Loading</option>
                  <option value="waiting">Waiting</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="complete">Complete</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Timer Seconds</label>
                <input
                  type="number"
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(parseInt(e.target.value, 10))}
                  min={0}
                  max={60}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Pick</label>
                <input
                  type="number"
                  value={currentPickNumber}
                  onChange={(e) => setCurrentPickNumber(parseInt(e.target.value, 10))}
                  min={1}
                  max={216}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isMyTurn}
                    onChange={(e) => setIsMyTurn(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Is My Turn</span>
                </label>
              </div>

              <div className="md:col-span-2 flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoCycle}
                    onChange={(e) => setAutoCycle(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">Auto-cycle through states</span>
                </label>
              </div>
            </div>

            {/* Dynamic Island Sandbox Component */}
            <DynamicIslandSandbox
              state={currentState}
              draftStatus={draftStatus}
              timerSeconds={timerSeconds}
              totalSeconds={30}
              isMyTurn={isMyTurn}
              currentPickNumber={currentPickNumber}
              totalPicks={216}
              currentDrafter={isMyTurn ? 'You' : 'Team 2'}
              roomId="demo-room-123"
              autoCycle={autoCycle}
              cycleDuration={5}
              onStateChange={setCurrentState}
            />
          </div>

          {/* Documentation */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">States Overview</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">1. In-Draft State</h3>
                <p className="text-gray-700 mb-2">
                  When the user is actively in the draft room. The Dynamic Island shows:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Timer countdown when it's the user's turn</li>
                  <li>Other player's name when they're picking</li>
                  <li>Paused indicator if the draft is paused</li>
                  <li>Urgency colors (normal/warning/critical) based on time remaining</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">2. Out-of-Draft State</h3>
                <p className="text-gray-700 mb-2">
                  When the user is in the app but not in an active draft. The Dynamic Island:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Does not display (normal status bar)</li>
                  <li>No Live Activity is active</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">3. Out-of-App-During-Live-Draft State</h3>
                <p className="text-gray-700 mb-2">
                  When the user leaves the app but a draft is still live. Uses Live Activities API:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                  <li>Shows expanded Live Activity view</li>
                  <li>Timer countdown with progress bar</li>
                  <li>Current pick information</li>
                  <li>Alerts when it's the user's turn</li>
                  <li>Persists even when app is closed</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Implementation Notes</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Requires iOS 16.1+ for Live Activities</li>
                <li>Requires iPhone 14 Pro+ for Dynamic Island (earlier devices show Live Activities in status bar)</li>
                <li>Native iOS implementation needed for full Dynamic Island support</li>
                <li>See <code className="bg-blue-100 px-1 rounded">ios/</code> directory for Swift implementation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
