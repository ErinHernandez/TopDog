/**
 * Edge Health Endpoint Test Page
 * 
 * Tests the edge-optimized health endpoint performance.
 * 
 * @module pages/test-edge-health
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[TestEdgeHealth]');

interface TestResult {
  endpoint: string;
  responseTime: number;
  status: number;
  region?: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

const TestEdgeHealthPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [comparison, setComparison] = useState<{
    edge: TestResult | null;
    standard: TestResult | null;
  }>({ edge: null, standard: null });

  const testEndpoint = async (endpoint: string): Promise<TestResult> => {
    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-cache',
      });
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const data = await response.json();
      
      return {
        endpoint,
        responseTime: Math.round(responseTime),
        status: response.status,
        region: data.edge?.region,
        timestamp: new Date().toISOString(),
        success: response.ok,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        endpoint,
        responseTime: Math.round(endTime - startTime),
        status: 0,
        timestamp: new Date().toISOString(),
        success: false,
        error: (error as Error).message,
      };
    }
  };

  const runSingleTest = async (endpoint: string) => {
    setIsTesting(true);
    try {
      const result = await testEndpoint(endpoint);
      setResults(prev => [...prev, result].slice(-20));
      return result;
    } finally {
      setIsTesting(false);
    }
  };

  const runComparison = async () => {
    setIsTesting(true);
    try {
      // Test both endpoints
      const [edgeResult, standardResult] = await Promise.all([
        testEndpoint('/api/health-edge'),
        testEndpoint('/api/health'),
      ]);

      setResults(prev => [...prev, edgeResult, standardResult].slice(-20));
      setComparison({
        edge: edgeResult,
        standard: standardResult,
      });
    } catch (error) {
      logger.error('Comparison test failed', error instanceof Error ? error : new Error(String(error)));
      alert('Comparison test failed. Check console for details.');
    } finally {
      setIsTesting(false);
    }
  };

  const runMultipleTests = async (endpoint: string, count: number = 10) => {
    setIsTesting(true);
    try {
      const testResults: TestResult[] = [];
      for (let i = 0; i < count; i++) {
        const result = await testEndpoint(endpoint);
        testResults.push(result);
        setResults(prev => [...prev, result].slice(-20));
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between tests
      }
      
      // Calculate statistics
      const successful = testResults.filter(r => r.success);
      const avgResponseTime = successful.length > 0
        ? Math.round(successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length)
        : 0;
      const minResponseTime = successful.length > 0
        ? Math.min(...successful.map(r => r.responseTime))
        : 0;
      const maxResponseTime = successful.length > 0
        ? Math.max(...successful.map(r => r.responseTime))
        : 0;

      alert(`Test Results (${count} requests):\n` +
        `Success Rate: ${successful.length}/${count} (${Math.round(successful.length / count * 100)}%)\n` +
        `Avg Response Time: ${avgResponseTime}ms\n` +
        `Min: ${minResponseTime}ms\n` +
        `Max: ${maxResponseTime}ms`);
    } catch (error) {
      logger.error('Multiple tests failed', error instanceof Error ? error : new Error(String(error)));
      alert('Multiple tests failed. Check console for details.');
    } finally {
      setIsTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setComparison({ edge: null, standard: null });
  };

  const getAverageResponseTime = (endpoint: string): number => {
    const endpointResults = results.filter(r => r.endpoint === endpoint && r.success);
    if (endpointResults.length === 0) return 0;
    return Math.round(
      endpointResults.reduce((sum, r) => sum + r.responseTime, 0) / endpointResults.length
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <Head>
        <title>Edge Health Endpoint Test</title>
      </Head>

      <h1>Edge Health Endpoint Test</h1>
      <p>Compare performance between edge-optimized and standard health endpoints.</p>

      {/* Controls */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Test Controls</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => runSingleTest('/api/health-edge')}
            disabled={isTesting}
            style={{ padding: '10px 20px', cursor: isTesting ? 'not-allowed' : 'pointer' }}
          >
            Test Edge Endpoint
          </button>
          <button
            onClick={() => runSingleTest('/api/health')}
            disabled={isTesting}
            style={{ padding: '10px 20px', cursor: isTesting ? 'not-allowed' : 'pointer' }}
          >
            Test Standard Endpoint
          </button>
          <button
            onClick={runComparison}
            disabled={isTesting}
            style={{ padding: '10px 20px', cursor: isTesting ? 'not-allowed' : 'pointer', backgroundColor: '#4285F4', color: 'white' }}
          >
            Compare Both (Side-by-Side)
          </button>
          <button
            onClick={() => runMultipleTests('/api/health-edge', 10)}
            disabled={isTesting}
            style={{ padding: '10px 20px', cursor: isTesting ? 'not-allowed' : 'pointer' }}
          >
            Test Edge (10x)
          </button>
          <button
            onClick={() => runMultipleTests('/api/health', 10)}
            disabled={isTesting}
            style={{ padding: '10px 20px', cursor: isTesting ? 'not-allowed' : 'pointer' }}
          >
            Test Standard (10x)
          </button>
          <button
            onClick={clearResults}
            disabled={isTesting || results.length === 0}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Clear Results
          </button>
        </div>
        {isTesting && <p style={{ marginTop: '10px', color: '#666' }}>Testing in progress...</p>}
      </div>

      {/* Comparison Results */}
      {comparison.edge && comparison.standard && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h2>Side-by-Side Comparison</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ border: '1px solid #0fba80', padding: '15px', borderRadius: '8px' }}>
              <h3>Edge Endpoint</h3>
              <p><strong>Response Time:</strong> {comparison.edge.responseTime}ms</p>
              <p><strong>Status:</strong> {comparison.edge.status}</p>
              {comparison.edge.region && <p><strong>Region:</strong> {comparison.edge.region}</p>}
              <p><strong>Success:</strong> {comparison.edge.success ? '✅' : '❌'}</p>
            </div>
            <div style={{ border: '1px solid #4285F4', padding: '15px', borderRadius: '8px' }}>
              <h3>Standard Endpoint</h3>
              <p><strong>Response Time:</strong> {comparison.standard.responseTime}ms</p>
              <p><strong>Status:</strong> {comparison.standard.status}</p>
              <p><strong>Success:</strong> {comparison.standard.success ? '✅' : '❌'}</p>
            </div>
          </div>
          {comparison.edge.success && comparison.standard.success && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <p><strong>Performance Difference:</strong></p>
              <p>
                {comparison.edge.responseTime < comparison.standard.responseTime
                  ? `✅ Edge is ${comparison.standard.responseTime - comparison.edge.responseTime}ms faster (${Math.round((1 - comparison.edge.responseTime / comparison.standard.responseTime) * 100)}% improvement)`
                  : comparison.edge.responseTime > comparison.standard.responseTime
                  ? `⚠️ Edge is ${comparison.edge.responseTime - comparison.standard.responseTime}ms slower`
                  : '⚖️ Both endpoints have similar performance'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      {results.length > 0 && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h2>Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3>Edge Endpoint</h3>
              <p><strong>Tests:</strong> {results.filter(r => r.endpoint === '/api/health-edge').length}</p>
              <p><strong>Success Rate:</strong> {
                Math.round(
                  (results.filter(r => r.endpoint === '/api/health-edge' && r.success).length /
                   Math.max(1, results.filter(r => r.endpoint === '/api/health-edge').length)) * 100
                )
              }%</p>
              <p><strong>Avg Response Time:</strong> {getAverageResponseTime('/api/health-edge')}ms</p>
            </div>
            <div>
              <h3>Standard Endpoint</h3>
              <p><strong>Tests:</strong> {results.filter(r => r.endpoint === '/api/health').length}</p>
              <p><strong>Success Rate:</strong> {
                Math.round(
                  (results.filter(r => r.endpoint === '/api/health' && r.success).length /
                   Math.max(1, results.filter(r => r.endpoint === '/api/health').length)) * 100
                )
              }%</p>
              <p><strong>Avg Response Time:</strong> {getAverageResponseTime('/api/health')}ms</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Results */}
      {results.length > 0 && (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h2>Recent Test Results ({results.length})</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ccc' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Endpoint</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Response Time</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Region</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {results.slice().reverse().map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{r.endpoint}</td>
                    <td style={{ padding: '10px' }}>{r.responseTime}ms</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: r.success ? '#0fba80' : '#f44336' }}>
                        {r.success ? '✅' : '❌'} {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{r.region || 'N/A'}</td>
                    <td style={{ padding: '10px' }}>{new Date(r.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3>About Edge Functions</h3>
        <p>
          Edge functions run on Vercel's Edge Network, closer to users worldwide. This can reduce latency,
          especially for users far from the main server region.
        </p>
        <p style={{ marginTop: '10px' }}>
          <strong>Expected Benefits:</strong>
        </p>
        <ul>
          <li>Lower latency for global users</li>
          <li>Automatic geographic distribution</li>
          <li>Better performance for high-traffic endpoints</li>
        </ul>
        <p style={{ marginTop: '10px' }}>
          <strong>Note:</strong> Edge functions have limitations (no Node.js APIs, smaller runtime).
          The health endpoint is a good candidate because it's simple and read-only.
        </p>
      </div>
    </div>
  );
};

export default TestEdgeHealthPage;
