import React, { useState, useEffect } from 'react';

/**
 * Test Error Boundary Page
 * 
 * Temporary test page to verify GlobalErrorBoundary functionality.
 * ⚠️ DELETE THIS FILE AFTER TESTING
 * 
 * Note: In Next.js development mode, you may see the Next.js error overlay
 * first. The error boundary should still catch the error and display its
 * fallback UI. To see the error boundary UI, you may need to dismiss the
 * Next.js overlay or test in production mode.
 */

function BrokenComponent() {
  // Throw error during render - error boundaries catch render errors
  throw new Error('Test error: This component always crashes');
}

function BrokenComponentWithEffect() {
  // Alternative: Throw error in useEffect (also caught by error boundaries)
  useEffect(() => {
    throw new Error('Test error: This component crashes in useEffect');
  }, []);
  
  return <div>This component will crash</div>;
}

export default function TestErrorBoundary() {
  const [showBroken, setShowBroken] = useState(false);
  const [errorType, setErrorType] = useState('render');

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Error Boundary Test Page</h1>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <p className="text-yellow-300 text-sm">
              <strong>Development Mode Note:</strong> Next.js may show its error overlay first.
              The GlobalErrorBoundary should still catch the error. To see the error boundary UI,
              dismiss the Next.js overlay or test in production mode.
            </p>
          </div>
        )}
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="mb-4 text-gray-300">
            This page tests the GlobalErrorBoundary component. Click the button below to trigger
            an error and verify the error boundary catches it and displays the fallback UI.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Error Type:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="render"
                  checked={errorType === 'render'}
                  onChange={(e) => setErrorType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-300">Render Error</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="effect"
                  checked={errorType === 'effect'}
                  onChange={(e) => setErrorType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-300">useEffect Error</span>
              </label>
            </div>
          </div>
          
          <button
            onClick={() => setShowBroken(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold 
                     hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 
                     focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
          >
            Trigger Error
          </button>
          {showBroken && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded">
              <p className="text-red-300 mb-2">
                ⚠️ Error triggered! The component below will crash and should be caught by the error boundary.
              </p>
              {errorType === 'render' ? <BrokenComponent /> : <BrokenComponentWithEffect />}
            </div>
          )}
        </div>

        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Test Checklist</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Click "Trigger Error" button</li>
            <li>Verify fallback UI appears (full screen error message)</li>
            <li>Verify Error ID is displayed</li>
            <li>Check console for structured error log with errorId</li>
            <li>Test "Try Again" button (should reset error state)</li>
            <li>Test "Go Home" button (should navigate to /)</li>
            <li>Test "Reload Page" button (should refresh)</li>
            <li>Trigger error 4 times to verify retry limit (3 max)</li>
            <li>After 3 retries, verify "Try Again" button disappears</li>
            <li>In development, verify error details are visible in collapsible section</li>
          </ul>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>⚠️ <strong>Remember:</strong> Delete this file after testing.</p>
        </div>
      </div>
    </div>
  );
}
