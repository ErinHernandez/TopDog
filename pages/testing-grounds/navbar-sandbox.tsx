/**
 * Navbar Sandbox
 *
 * Isolated testing page for DraftNavbar component with timer.
 */

import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useCallback } from 'react';
import type { JSX } from 'react';

import { DraftNavbar, DraftInfoModal, DraftTutorialModal } from '../../components/vx2/draft-room';
import IPhoneStatusBar from '../../components/vx2/shell/iPhoneStatusBar';

type GraceStatus = 'idle' | 'grace' | 'expired';

function NavbarSandboxPage(): JSX.Element {
  const router = useRouter();
  const [timerSeconds, setTimerSeconds] = useState<number>(30);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isUserTurn, setIsUserTurn] = useState<boolean>(true);
  const [graceStatus, setGraceStatus] = useState<GraceStatus>('idle');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timerSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timerSeconds]);

  // Track when timer hits 0 (grace period starts)
  useEffect(() => {
    if (timerSeconds === 0 && isUserTurn && isRunning) {
      setGraceStatus('grace');
    }
  }, [timerSeconds, isUserTurn, isRunning]);

  const handleLeave = (): void => {
    router.push('/testing-grounds/vx2-draft-room');
  };

  const handleReset = useCallback((seconds: number): void => {
    setTimerSeconds(seconds);
    setIsRunning(false);
    setGraceStatus('idle');
  }, []);

  const handleGracePeriodEnd = useCallback((): void => {
    setGraceStatus('expired');
    setIsRunning(false);
  }, []);

  const handleInfo = useCallback((): void => {
    setIsInfoModalOpen(true);
  }, []);

  const handleTutorial = useCallback((): void => {
    setIsInfoModalOpen(false);
    setIsTutorialOpen(true);
  }, []);

  return (
    <>
      <Head>
        <title>Navbar Sandbox | TopDog</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>

      <div className="min-h-screen bg-gray-900 flex items-start justify-center gap-8 p-8">
        {/* Phone Frame with Navbar */}
        <div>
          <h2 className="text-gray-400 text-sm mb-4">Phone Frame (375px)</h2>
          <div
            className="bg-black rounded-[40px] overflow-hidden shadow-2xl"
            style={{
              width: '375px',
              height: '667px',
              position: 'relative',
            }}
          >
            {/* iPhone Status Bar - dev only */}
            <IPhoneStatusBar />
            {/* Content wrapper - pushed down to account for status bar */}
            <div
              style={{
                position: 'absolute',
                top: '28px',
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
              }}
            >
              {/* Navbar inside phone - uses absolute positioning within frame */}
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <DraftNavbar
                  onLeave={handleLeave}
                  useAbsolutePosition={true}
                  timerSeconds={timerSeconds}
                  isUserTurn={isUserTurn}
                  onGracePeriodEnd={handleGracePeriodEnd}
                  onInfo={handleInfo}
                />
                {/* Gray area below navbar to show context */}
                <div
                  style={{
                    position: 'absolute',
                    top: 48,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: '#101927',
                  }}
                />
                {/* Info Modal */}
                <DraftInfoModal
                  isOpen={isInfoModalOpen}
                  onClose={() => setIsInfoModalOpen(false)}
                  onTutorial={handleTutorial}
                  draftInfo={{
                    format: 'Snake',
                    teams: 12,
                    rounds: 18,
                    pickTime: 30,
                    scoring: 'Best Ball',
                  }}
                />

                {/* Tutorial Modal */}
                <DraftTutorialModal
                  isOpen={isTutorialOpen}
                  onClose={() => setIsTutorialOpen(false)}
                  onRules={() => {}}
                  format="Snake"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="p-4 bg-gray-800 rounded-lg" style={{ width: 280 }}>
          <h3 className="text-white font-bold mb-4">Timer Controls</h3>

          {/* Timer Display */}
          <div className="mb-4 p-3 bg-gray-900 rounded text-center">
            <span className="text-3xl font-bold text-white tabular-nums">{timerSeconds}</span>
            <div className="text-xs text-gray-500 mt-1">
              {graceStatus === 'grace' ? (
                <span className="text-yellow-400">GRACE PERIOD (can still pick)</span>
              ) : graceStatus === 'expired' ? (
                <span className="text-red-400">EXPIRED (auto-pick triggered)</span>
              ) : timerSeconds <= 5 ? (
                'CRITICAL'
              ) : timerSeconds <= 10 ? (
                'WARNING'
              ) : (
                'NORMAL'
              )}
            </div>
          </div>

          {/* Play/Pause */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 py-2 px-4 rounded font-medium ${
                isRunning
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleReset(30)}
              className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              30s
            </button>
            <button
              onClick={() => handleReset(10)}
              className="flex-1 py-2 px-3 bg-yellow-700 hover:bg-yellow-600 text-white rounded text-sm"
            >
              10s
            </button>
            <button
              onClick={() => handleReset(5)}
              className="flex-1 py-2 px-3 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
            >
              5s
            </button>
            <button
              onClick={() => handleReset(90)}
              className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
            >
              90s
            </button>
          </div>

          {/* User Turn Toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-300 text-sm">User&apos;s Turn</span>
            <button
              onClick={() => setIsUserTurn(!isUserTurn)}
              className={`w-12 h-6 rounded-full transition-colors ${
                isUserTurn ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  isUserTurn ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <hr className="border-gray-700 my-4" />

          {/* Specs */}
          <h3 className="text-white font-bold mb-3">Specs</h3>
          <div className="text-gray-300 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Height:</span>
              <span className="text-green-400">48px</span>
            </div>
            <div className="flex justify-between">
              <span>Timer Font:</span>
              <span className="text-green-400">32px mono bold</span>
            </div>
            <div className="flex justify-between">
              <span>Red bg:</span>
              <span className="text-red-400">9s</span>
            </div>
            <div className="flex justify-between">
              <span>Pulse:</span>
              <span className="text-yellow-400">3s, 2s, 1s, 0s</span>
            </div>
            <div className="flex justify-between">
              <span>Shake:</span>
              <span className="text-red-400">0s</span>
            </div>
            <div className="flex justify-between">
              <span>Grace Period:</span>
              <span className="text-green-400">600ms</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NavbarSandboxPage;
