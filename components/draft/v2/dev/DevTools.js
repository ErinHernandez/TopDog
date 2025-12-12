import React, { useState } from 'react';
import { useDraft } from '../providers/DraftProvider';
import { getAvailableComponents, registerComponent } from '../elements/ElementRenderer';

/**
 * DevTools - Development tools for testing and debugging
 */
export default function DevTools({ 
  showElementEditor = true, 
  showPerformanceMetrics = true 
}) {
  const [activeTab, setActiveTab] = useState('elements');
  const { room, picks, availablePlayers, participants } = useDraft();

  const tabs = [
    { id: 'elements', label: 'Elements', enabled: showElementEditor },
    { id: 'performance', label: 'Performance', enabled: showPerformanceMetrics },
    { id: 'data', label: 'Data', enabled: true },
    { id: 'testing', label: 'Testing', enabled: true }
  ].filter(tab => tab.enabled);

  const availableComponents = getAvailableComponents();

  return (
    <div className="bg-purple-900/20 border border-purple-500 rounded-lg">
      <div className="p-4 border-b border-purple-500">
        <h3 className="text-lg font-bold text-purple-300 mb-2">
          🛠️ Development Tools
        </h3>
        
        {/* Tab Navigation */}
        <div className="flex space-x-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-sm rounded ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-800 text-purple-300 hover:bg-purple-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Elements Tab */}
        {activeTab === 'elements' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-purple-300 mb-2">Available Components</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {availableComponents.map(component => (
                  <div key={component} className="p-2 bg-purple-900/30 rounded">
                    <code className="text-purple-200">{component}</code>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-purple-300 mb-2">Layout Configuration</h4>
              <pre className="text-xs bg-purple-900/30 p-2 rounded overflow-auto">
                {JSON.stringify(room?.layoutConfig || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-purple-300 mb-2">Performance Metrics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-2 bg-purple-900/30 rounded">
                  <div className="text-purple-300">Players Loaded</div>
                  <div className="text-white font-mono">{availablePlayers.length}</div>
                </div>
                <div className="p-2 bg-purple-900/30 rounded">
                  <div className="text-purple-300">Picks Made</div>
                  <div className="text-white font-mono">{picks.length}</div>
                </div>
                <div className="p-2 bg-purple-900/30 rounded">
                  <div className="text-purple-300">Participants</div>
                  <div className="text-white font-mono">{participants.length}</div>
                </div>
                <div className="p-2 bg-purple-900/30 rounded">
                  <div className="text-purple-300">Memory Usage</div>
                  <div className="text-white font-mono">
                    {(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-purple-300 mb-2">Room Data</h4>
              <pre className="text-xs bg-purple-900/30 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(room || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-purple-300 mb-2">Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                  Simulate Pick
                </button>
                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                  Clear Queue
                </button>
                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                  Toggle Timer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}