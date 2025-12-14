// Payment Security Dashboard Page
import React, { useState, useEffect } from 'react';
import PaymentSecurityDashboard from '../components/PaymentSecurityDashboard';
import { paymentSystem } from '../lib/paymentSystemIntegration';

export default function PaymentSecurityDashboardPage() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user has admin access (in production, implement proper auth)
    const isAdmin = process.env.NODE_ENV === 'development' || 
                   (typeof window !== 'undefined' && window.location.search.includes('admin=true'));
    
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    // Initialize system status
    try {
      const status = paymentSystem.getSystemStatus();
      setSystemStatus(status);
      setLoading(false);
    } catch (err) {
      setError('Failed to load payment system status');
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Payment Security Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* System Status Banner */}
      {systemStatus && (
        <div className={`w-full p-3 text-center text-sm font-medium ${
          systemStatus.initialized && systemStatus.processors.healthPercentage > 90
            ? 'bg-green-100 text-green-800'
            : systemStatus.processors.healthPercentage > 70
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          🛡️ Payment System Status: {systemStatus.initialized ? 'OPERATIONAL' : 'INITIALIZING'} | 
          {systemStatus.processors.healthy}/{systemStatus.processors.total} Processors Healthy ({systemStatus.processors.healthPercentage.toFixed(1)}%) |
          {systemStatus.activeTransactions} Active Transactions |
          Fraud Rate: {systemStatus.fraud.blockRate?.toFixed(2) || '0.00'}%
        </div>
      )}
      
      {/* Main Dashboard */}
      <PaymentSecurityDashboard />
      
      {/* Development Notice */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg text-sm">
          <div className="flex items-center">
            <span className="mr-2">🔧</span>
            <div>
              <div className="font-medium">Development Mode</div>
              <div className="text-blue-200">Security dashboard active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

