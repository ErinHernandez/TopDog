/**
 * Latency Compensation Test Page
 * 
 * Tests latency compensation functionality in draft rooms.
 * 
 * @module pages/test-latency
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { measureLatency, LatencyTracker, compensateTimer } from '../lib/draft/latencyCompensation';

interface LatencyTestResult {
  rtt: number;
  timestamp: number;
  serverTimestamp?: number;
}

const TestLatencyPage: React.FC = () => {
  const [measurements, setMeasurements] = useState<LatencyTestResult[]>([]);
  const [tracker] = useState(() => new LatencyTracker(10));
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [stats, setStats] = useState(tracker.getStats());
  const [compensatedTimer, setCompensatedTimer] = useState<number | null>(null);
  const [serverTimer, setServerTimer] = useState(30);

  useEffect(() => {
    // Update stats when measurements change
    setStats(tracker.getStats());
    
    // Simulate timer compensation
    if (serverTimer !== null && stats.average > 0) {
      const compensated = compensateTimer(serverTimer * 1000, stats.average);
      setCompensatedTimer(Math.max(0, Math.floor(compensated / 1000)));
    }
  }, [measurements, tracker, serverTimer, stats]);

  const runMeasurement = async () => {
    setIsMeasuring(true);
    try {
      const measurement = await measureLatency('/api/health');
      tracker.addMeasurement(measurement);
      setMeasurements(prev => [...prev, measurement].slice(-10));
      setStats(tracker.getStats());
    } catch (error) {
      console.error('Latency measurement failed:', error);
      alert('Latency measurement failed. Check console for details.');
    } finally {
      setIsMeasuring(false);
    }
  };

  const runMultipleMeasurements = async (count: number = 5) => {
    setIsMeasuring(true);
    try {
      for (let i = 0; i < count; i++) {
        const measurement = await measureLatency('/api/health');
        tracker.addMeasurement(measurement);
        setMeasurements(prev => [...prev, measurement].slice(-10));
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between measurements
      }
      setStats(tracker.getStats());
    } catch (error) {
      console.error('Latency measurements failed:', error);
      alert('Latency measurements failed. Check console for details.');
    } finally {
      setIsMeasuring(false);
    }
  };

  const clearMeasurements = () => {
    tracker.clear();
    setMeasurements([]);
    setStats(tracker.getStats());
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Latency Compensation Test</title>
      </Head>

      <h1>Latency Compensation Test</h1>
      <p>This page tests the latency compensation functionality for draft rooms.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Controls */}
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h2>Controls</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={runMeasurement}
              disabled={isMeasuring}
              style={{ padding: '10px 20px', cursor: isMeasuring ? 'not-allowed' : 'pointer' }}
            >
              {isMeasuring ? 'Measuring...' : 'Measure Latency (Single)'}
            </button>
            <button
              onClick={() => runMultipleMeasurements(5)}
              disabled={isMeasuring}
              style={{ padding: '10px 20px', cursor: isMeasuring ? 'not-allowed' : 'pointer' }}
            >
              {isMeasuring ? 'Measuring...' : 'Measure Latency (5x)'}
            </button>
            <button
              onClick={clearMeasurements}
              disabled={isMeasuring || measurements.length === 0}
              style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
              Clear Measurements
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label>
              Server Timer (seconds):
              <input
                type="number"
                value={serverTimer}
                onChange={(e) => setServerTimer(parseInt(e.target.value, 10) || 30)}
                min="0"
                max="300"
                style={{ marginLeft: '10px', padding: '5px', width: '80px' }}
              />
            </label>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h2>Latency Statistics</h2>
          {stats.count === 0 ? (
            <p style={{ color: '#666' }}>No measurements yet. Click "Measure Latency" to start.</p>
          ) : (
            <div>
              <p><strong>Measurements:</strong> {stats.count}</p>
              <p><strong>Average Latency:</strong> {Math.round(stats.average)}ms</p>
              <p><strong>Min Latency:</strong> {Math.round(stats.min)}ms</p>
              <p><strong>Max Latency:</strong> {Math.round(stats.max)}ms</p>
              <p><strong>Current Latency:</strong> {Math.round(stats.current)}ms</p>
              <p><strong>Estimated Latency:</strong> {Math.round(tracker.getEstimatedLatency())}ms</p>
            </div>
          )}
        </div>
      </div>

      {/* Timer Compensation Demo */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Timer Compensation Demo</h2>
        <p>This demonstrates how the timer is compensated for latency:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '15px' }}>
          <div>
            <p><strong>Server Timer:</strong></p>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#4285F4' }}>
              {serverTimer}s
            </div>
          </div>
          <div>
            <p><strong>Estimated Latency:</strong></p>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0fba80' }}>
              {stats.average > 0 ? `${Math.round(stats.average)}ms` : 'N/A'}
            </div>
          </div>
          <div>
            <p><strong>Compensated Timer:</strong></p>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#F472B6' }}>
              {compensatedTimer !== null ? `${compensatedTimer}s` : 'N/A'}
            </div>
            {compensatedTimer !== null && compensatedTimer !== serverTimer && (
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                (+{compensatedTimer - serverTimer}s compensation)
              </p>
            )}
          </div>
        </div>
        {stats.count === 0 && (
          <p style={{ color: '#666', marginTop: '10px' }}>
            Run latency measurements to see compensation in action.
          </p>
        )}
      </div>

      {/* Recent Measurements */}
      {measurements.length > 0 && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h2>Recent Measurements ({measurements.length})</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>RTT (ms)</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Timestamp</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Server Time</th>
                </tr>
              </thead>
              <tbody>
                {measurements.slice().reverse().map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{Math.round(m.rtt)}</td>
                    <td style={{ padding: '10px' }}>{new Date(m.timestamp).toLocaleTimeString()}</td>
                    <td style={{ padding: '10px' }}>
                      {m.serverTimestamp ? new Date(m.serverTimestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>How It Works</h3>
        <ol>
          <li>Click "Measure Latency" to measure round-trip time to the server</li>
          <li>The system tracks multiple measurements and calculates an average</li>
          <li>When a server timer is received, it's compensated by adding half the estimated latency</li>
          <li>This ensures all users see approximately the same time remaining, regardless of location</li>
        </ol>
        <p style={{ marginTop: '10px' }}>
          <strong>Note:</strong> This is integrated into DraftProvider (V2 draft rooms) and works automatically.
        </p>
      </div>
    </div>
  );
};

export default TestLatencyPage;
