import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getAutodraftLimits, setAutodraftLimits, clearAutodraftLimits, DEFAULT_AUTODRAFT_LIMITS } from '../lib/autodraftLimits';

export default function AutodraftLimits() {
  const router = useRouter();
  
  // Position limits state - loaded from Firebase + localStorage
  const [limits, setLimits] = useState(DEFAULT_AUTODRAFT_LIMITS);
  const [originalLimits, setOriginalLimits] = useState(DEFAULT_AUTODRAFT_LIMITS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Check if limits have been modified
  const hasChanges = JSON.stringify(limits) !== JSON.stringify(originalLimits);
  
  // Check if limits are already at site standard/recommended values
  const isAtStandardLimits = JSON.stringify(limits) === JSON.stringify(DEFAULT_AUTODRAFT_LIMITS);

  // Load saved limits from Firebase + localStorage on component mount
  useEffect(() => {
    const loadLimits = async () => {
      try {
        setLoading(true);
        const savedLimits = await getAutodraftLimits();
        setLimits(savedLimits);
        setOriginalLimits(savedLimits); // Track original values
      } catch (error) {
        console.error('Error loading autodraft limits:', error);
        setLimits(DEFAULT_AUTODRAFT_LIMITS);
        setOriginalLimits(DEFAULT_AUTODRAFT_LIMITS);
      } finally {
        setLoading(false);
      }
    }
    loadLimits();
  }, []);

  // Update limit for a specific position
  const updateLimit = (position, change) => {
    setLimits(prev => {
      // Set position-specific maximums
      const maxLimits = {
        QB: 4,
        RB: 10,
        WR: 11,
        TE: 5
      };
      
      const newValue = Math.max(0, Math.min(maxLimits[position], prev[position] + change));
      return {
        ...prev,
        [position]: newValue
      };
    });
  };

  // Save limits to Firebase + localStorage
  const saveLimits = async () => {
    try {
      setSaving(true);
      await setAutodraftLimits(limits);
      setOriginalLimits(limits); // Update original limits after successful save
      console.log('✅ Autodraft limits saved successfully:', limits);
    } catch (error) {
      console.error('Error saving autodraft limits:', error);
      alert('Error saving limits. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Reset limits to default values (UI only, requires save)
  const clearLimits = () => {
    setLimits(DEFAULT_AUTODRAFT_LIMITS);
    // Don't update originalLimits - this creates unsaved changes that require save button
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <Head>
        <title>Autodraft Limits - TopDog</title>
        <meta name="description" content="Set maximum position limits for autodraft" />
      </Head>

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
            
            {/* Mobile Header */}
            <div 
              className="w-full z-50 shadow-lg"
              style={{
                background: 'url(/wr_blue.png) no-repeat center center',
                backgroundSize: 'cover'
              }}
            >
              <div className="relative flex items-center px-4 py-3 h-16">
                {/* Back Button */}
                <button 
                  onClick={() => router.back()}
                  className="flex items-center justify-center w-10 h-10"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Site Logo */}
                <div className="flex-1 flex justify-center">
                  <img 
                    src="/logo.png" 
                    alt="TopDog.dog Logo" 
                    className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto"
                    style={{
                      minHeight: '48px',
                      maxHeight: '80px'
                    }}
                  />
                </div>

                {/* Spacer for centering */}
                <div className="w-10"></div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Autodraft Position Limits</h2>
                <p className="text-gray-300 leading-relaxed">
                  Set the max number of players you would want at each position if you are not 
                  able to make your picks or are on Autopilot
                </p>
              </div>

              {/* Position Controls */}
              <div className="space-y-6">
                
                {/* QB */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-white">QB</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => updateLimit('QB', -1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        limits.QB <= 0 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={limits.QB <= 0}
                    >
                      <span className={`text-xl font-bold ${limits.QB <= 0 ? 'text-gray-500' : 'text-white'}`}>−</span>
                    </button>
                    <span className="text-white text-xl font-bold w-8 text-center">{limits.QB}</span>
                    <button
                      onClick={() => updateLimit('QB', 1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        limits.QB >= 4 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={limits.QB >= 4}
                    >
                      <span className={`text-xl font-bold ${limits.QB >= 4 ? 'text-gray-500' : 'text-white'}`}>+</span>
                    </button>
                  </div>
                </div>

                {/* RB */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-white">RB</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => updateLimit('RB', -1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        limits.RB <= 0 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={limits.RB <= 0}
                    >
                      <span className={`text-xl font-bold ${limits.RB <= 0 ? 'text-gray-500' : 'text-white'}`}>−</span>
                    </button>
                    <span className="text-white text-xl font-bold w-8 text-center">{limits.RB}</span>
                    <button
                      onClick={() => updateLimit('RB', 1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        limits.RB >= 10 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={limits.RB >= 10}
                    >
                      <span className={`text-xl font-bold ${limits.RB >= 10 ? 'text-gray-500' : 'text-white'}`}>+</span>
                    </button>
                  </div>
                </div>

                {/* WR */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-white">WR</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => updateLimit('WR', -1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        limits.WR <= 0 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={limits.WR <= 0}
                    >
                      <span className={`text-xl font-bold ${limits.WR <= 0 ? 'text-gray-500' : 'text-white'}`}>−</span>
                    </button>
                    <span className="text-white text-xl font-bold w-8 text-center">{limits.WR}</span>
                    <button
                      onClick={() => updateLimit('WR', 1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        limits.WR >= 11 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={limits.WR >= 11}
                    >
                      <span className={`text-xl font-bold ${limits.WR >= 11 ? 'text-gray-500' : 'text-white'}`}>+</span>
                    </button>
                  </div>
                </div>

                {/* TE */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-white">TE</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => updateLimit('TE', -1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        limits.TE <= 0 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={limits.TE <= 0}
                    >
                      <span className={`text-xl font-bold ${limits.TE <= 0 ? 'text-gray-500' : 'text-white'}`}>−</span>
                    </button>
                    <span className="text-white text-xl font-bold w-8 text-center">{limits.TE}</span>
                    <button
                      onClick={() => updateLimit('TE', 1)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        limits.TE >= 5 
                          ? 'bg-gray-800 cursor-not-allowed opacity-50' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      disabled={limits.TE >= 5}
                    >
                      <span className={`text-xl font-bold ${limits.TE >= 5 ? 'text-gray-500' : 'text-white'}`}>+</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-12">
                <button
                  onClick={clearLimits}
                  disabled={isAtStandardLimits}
                  className={`flex-1 py-3 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    isAtStandardLimits
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Reset</span>
                </button>
                
                <button
                  onClick={saveLimits}
                  disabled={saving || !hasChanges}
                  className={`flex-1 py-3 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    saving || !hasChanges
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
