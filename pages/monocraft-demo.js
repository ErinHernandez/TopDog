import React from 'react';
import CountdownTimer from '../components/CountdownTimer';
import SevenSegmentCountdown from '../components/SevenSegmentCountdown';

export default function MonocraftDemo() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ fontFamily: 'Monocraft, monospace' }}>
          Monocraft Font Countdown Timer Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Original Countdown Timer */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Original Countdown Timer</h2>
            <CountdownTimer />
          </div>
          
          {/* Seven Segment Display */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Seven Segment Display</h2>
            <div className="flex flex-col space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Original SVG Version:</p>
                <SevenSegmentCountdown initialSeconds={30} />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Monocraft Text Version:</p>
                <SevenSegmentCountdown initialSeconds={30} useMonocraft={true} />
              </div>
            </div>
          </div>
          
          {/* Monocraft Typography Examples */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Monocraft Typography</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Large Display:</p>
                <div 
                  className="text-6xl font-bold text-green-400"
                  style={{ fontFamily: 'Monocraft, monospace' }}
                >
                  12:34:56
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Medium Display:</p>
                <div 
                  className="text-3xl font-semibold text-blue-400"
                  style={{ fontFamily: 'Monocraft, monospace' }}
                >
                  COUNTDOWN
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Small Display:</p>
                <div 
                  className="text-lg text-yellow-400"
                  style={{ fontFamily: 'Monocraft, monospace' }}
                >
                  Time Remaining
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom Countdown Styles */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Custom Countdown Styles</h2>
            <div className="space-y-4">
              <div className="bg-black p-4 rounded border border-red-500">
                <div 
                  className="text-4xl font-bold text-red-500 text-center"
                  style={{ fontFamily: 'Monocraft, monospace' }}
                >
                  29
                </div>
                <div className="text-center text-sm text-gray-400 mt-2">Seconds</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 rounded">
                <div 
                  className="text-3xl font-bold text-white text-center"
                  style={{ fontFamily: 'Monocraft, monospace' }}
                >
                  15:42
                </div>
                <div className="text-center text-sm text-gray-300 mt-2">Time Left</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Font Features */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Monocraft Font Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Monospaced</h3>
              <div 
                className="text-lg bg-gray-700 p-3 rounded font-mono"
                style={{ fontFamily: 'Monocraft, monospace' }}
              >
                <div>1234567890</div>
                <div>ABCDEFGHIJ</div>
                <div>abcdefghij</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Programming Ligatures</h3>
              <div 
                className="text-lg bg-gray-700 p-3 rounded font-mono"
                style={{ fontFamily: 'Monocraft, monospace' }}
              >
                <div>== != &lt;= &gt;=</div>
                <div>-&gt; &lt;- =&gt; &lt;=</div>
                <div>&amp;&amp; || ++ --</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Minecraft Style</h3>
              <div 
                className="text-lg bg-gray-700 p-3 rounded"
                style={{ fontFamily: 'Monocraft, monospace' }}
              >
                <div>⚔️ SWORD</div>
                <div>🛡️ SHIELD</div>
                <div>🏰 CASTLE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 