// Payment Security Dashboard - Real-time monitoring for 31-processor payment system
import React, { useState, useEffect } from 'react';

import { createScopedLogger } from '../lib/clientLogger';
import { fraudDetectionEngine } from '../lib/fraudDetection';
import { paymentHealthMonitor } from '../lib/paymentHealthMonitor';
import { GLOBAL_PAYMENT_METHODS } from '../lib/paymentMethodConfig';

const logger = createScopedLogger('[PaymentDashboard]');

const PaymentSecurityDashboard = () => {
  const [healthStatus, setHealthStatus] = useState({});
  const [fraudStats, setFraudStats] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [selectedProcessor, setSelectedProcessor] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  const refreshData = async () => {
    try {
      const health = paymentHealthMonitor.getHealthStatus();
      const fraud = fraudDetectionEngine.getFraudStats();
      const summary = paymentHealthMonitor.getHealthSummary();

      setHealthStatus(health);
      setFraudStats(fraud);

      // Generate alerts for unhealthy processors
      const newAlerts = Object.entries(health)
        .filter(([processor, status]) => !status.healthy)
        .map(([processor, status]) => ({
          id: `${processor}-${Date.now()}`,
          type: 'error',
          processor,
          message: `${processor} is unhealthy (${status.consecutiveFailures} consecutive failures)`,
          timestamp: new Date().toISOString()
        }));

      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Keep last 50 alerts

    } catch (error) {
      logger.error('Failed to refresh dashboard data', error);
    }
  };

  useEffect(() => {
    // Initial load
    // eslint-disable-next-line react-hooks/set-state-in-effect -- calling async data loader on mount and interval setup
    refreshData();

    // Set up auto-refresh
    const interval = setInterval(refreshData, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  const getProcessorTier = (processor) => {
    const coreGlobal = ['stripe', 'paypal', 'adyen', 'applepay', 'googlepay'];

    if (coreGlobal.includes(processor)) return { tier: 1, label: 'Core Global', color: 'bg-green-100 text-green-800' };
    return { tier: 3, label: 'Strategic Local', color: 'bg-purple-100 text-purple-800' };
  };
  
  const getHealthColor = (status) => {
    if (!status.healthy) return 'bg-red-500';
    if (status.responseTime > 3000) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getCircuitBreakerColor = (state) => {
    switch (state) {
      case 'open': return 'text-red-600';
      case 'half-open': return 'text-yellow-600';
      case 'closed': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };
  
  const formatUptime = (uptime) => {
    return `${(uptime * 100).toFixed(2)}%`;
  };
  
  const formatResponseTime = (time) => {
    return `${time}ms`;
  };
  
  const totalProcessors = GLOBAL_PAYMENT_METHODS.length;
  const healthyProcessors = Object.values(healthStatus).filter(s => s.healthy).length;
  const unhealthyProcessors = totalProcessors - healthyProcessors;
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Security Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time monitoring for {totalProcessors} payment processors
          </p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">{healthyProcessors}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Healthy Processors</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatUptime(healthyProcessors / totalProcessors)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">{unhealthyProcessors}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unhealthy Processors</p>
                <p className="text-2xl font-semibold text-gray-900">{unhealthyProcessors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">24h</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Transactions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {fraudStats.totalTransactions || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-semibold">!</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Fraud Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {fraudStats.blockRate ? fraudStats.blockRate.toFixed(2) : '0.00'}%
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Dashboard Controls</h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm text-gray-700">
                Refresh Interval:
                <select 
                  value={refreshInterval} 
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="ml-2 border border-gray-300 rounded px-2 py-1"
                >
                  <option value={10}>10s</option>
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={300}>5m</option>
                </select>
              </label>
              <button 
                onClick={refreshData}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh Now
              </button>
            </div>
          </div>
        </div>
        
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 10).map(alert => (
                <div key={alert.id} className="flex items-center p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex-shrink-0">
                    <span className="text-red-600">⚠️</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-800">{alert.message}</p>
                    <p className="text-xs text-red-600">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Processor Status Grid */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Processor Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GLOBAL_PAYMENT_METHODS.map(processor => {
              const status = healthStatus[processor] || {};
              const tierInfo = getProcessorTier(processor);
              
              return (
                <div 
                  key={processor}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProcessor === processor ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProcessor(selectedProcessor === processor ? null : processor)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${getHealthColor(status)}`}></div>
                      <span className="font-medium capitalize">{processor.replace('_', ' ')}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${tierInfo.color}`}>
                      T{tierInfo.tier}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Uptime:</span>
                      <span className="ml-1 font-medium">{formatUptime(status.uptime || 0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Response:</span>
                      <span className="ml-1 font-medium">{formatResponseTime(status.responseTime || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">Circuit Breaker:</span>
                    <span className={`ml-1 font-medium ${getCircuitBreakerColor(status.circuitBreakerState)}`}>
                      {status.circuitBreakerState || 'closed'}
                    </span>
                  </div>
                  
                  {status.consecutiveFailures > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      {status.consecutiveFailures} consecutive failures
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Detailed Processor Info */}
        {selectedProcessor && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedProcessor.replace('_', ' ').toUpperCase()} Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Health Status</h4>
                <div className="space-y-2 text-sm">
                  <div>Status: <span className={healthStatus[selectedProcessor]?.healthy ? 'text-green-600' : 'text-red-600'}>
                    {healthStatus[selectedProcessor]?.healthy ? 'Healthy' : 'Unhealthy'}
                  </span></div>
                  <div>Last Check: {healthStatus[selectedProcessor]?.lastCheck ? 
                    new Date(healthStatus[selectedProcessor].lastCheck).toLocaleString() : 'Never'}</div>
                  <div>Consecutive Failures: {healthStatus[selectedProcessor]?.consecutiveFailures || 0}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                <div className="space-y-2 text-sm">
                  <div>Response Time: {formatResponseTime(healthStatus[selectedProcessor]?.responseTime || 0)}</div>
                  <div>Uptime: {formatUptime(healthStatus[selectedProcessor]?.uptime || 0)}</div>
                  <div>Circuit Breaker: <span className={getCircuitBreakerColor(healthStatus[selectedProcessor]?.circuitBreakerState)}>
                    {healthStatus[selectedProcessor]?.circuitBreakerState || 'closed'}
                  </span></div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div>Tier: {getProcessorTier(selectedProcessor).label}</div>
                  <div>Security Level: {getProcessorTier(selectedProcessor).tier === 1 ? 'Maximum' : 
                    getProcessorTier(selectedProcessor).tier === 2 ? 'High' : 'Standard'}</div>
                  <div>Monitoring: Active</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🛡️ Payment Security Dashboard - Last updated: {new Date().toLocaleString()}</p>
          <p>Monitoring {totalProcessors} processors across 3 security tiers</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSecurityDashboard;

