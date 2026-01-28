import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getAutodraftLimits, setAutodraftLimits, clearAutodraftLimits, DEFAULT_AUTODRAFT_LIMITS, type AutodraftLimits } from '../lib/autodraftLimits';
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[AutodraftLimits]');

export default function AutodraftLimits() {
  const router = useRouter();
  
  // Position limits state - loaded from Firebase + localStorage
  const [limits, setLimits] = useState<AutodraftLimits>(DEFAULT_AUTODRAFT_LIMITS);
  const [originalLimits, setOriginalLimits] = useState<AutodraftLimits>(DEFAULT_AUTODRAFT_LIMITS);
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
        if (savedLimits) {
          setLimits(savedLimits);
          setOriginalLimits(savedLimits); // Track original values
        }
      } catch (error) {
        logger.error('Error loading autodraft limits', error instanceof Error ? error : new Error(String(error)));
        setLimits(DEFAULT_AUTODRAFT_LIMITS);
        setOriginalLimits(DEFAULT_AUTODRAFT_LIMITS);
      } finally {
        setLoading(false);
      }
    }
    loadLimits();
  }, []);

  // Update limit for a specific position
  const updateLimit = (position: keyof AutodraftLimits, change: number) => {
    setLimits(prev => {
      // Set position-specific maximums
      const maxLimits: Record<keyof AutodraftLimits, number> = {
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
      logger.info('Autodraft limits saved successfully', { limits });
    } catch (error) {
      logger.error('Error saving autodraft limits', error instanceof Error ? error : new Error(String(error)));
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
            {/* Header */}
            <div className="px-6 pt-12 pb-4">
              <h1 className="text-2xl font-bold mb-2">Autodraft Limits</h1>
              <p className="text-gray-400 text-sm">Set maximum position limits</p>
            </div>

            {/* Limits Display */}
            <div className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
              {(['QB', 'RB', 'WR', 'TE'] as Array<keyof AutodraftLimits>).map((position) => (
                <div key={position} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold">{position}</span>
                    <span className="text-2xl font-bold text-blue-400">{limits[position]}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateLimit(position, -1)}
                      disabled={limits[position] === 0 || loading}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-semibold transition-colors"
                    >
                      -
                    </button>
                    <button
                      onClick={() => updateLimit(position, 1)}
                      disabled={
                        loading || 
                        (position === 'QB' && limits[position] >= 4) ||
                        (position === 'RB' && limits[position] >= 10) ||
                        (position === 'WR' && limits[position] >= 11) ||
                        (position === 'TE' && limits[position] >= 5)
                      }
                      className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed py-2 rounded-lg font-semibold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-8 pt-4 space-y-3 border-t border-gray-700">
              {hasChanges && (
                <button
                  onClick={saveLimits}
                  disabled={saving || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              {!isAtStandardLimits && (
                <button
                  onClick={clearLimits}
                  disabled={loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Reset to Defaults
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
