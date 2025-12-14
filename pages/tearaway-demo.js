import React from 'react';
import PicksAwayCalendar from '../components/PicksAwayCalendar';

export default function TearawayDemo() {
  return (
    <div className="min-h-screen bg-[#000F55] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Picks Away Calendar Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* On The Clock */}
          <div className="bg-white/10 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold mb-4">On The Clock</h2>
            <div className="flex justify-center">
              <PicksAwayCalendar picksAway={0} />
            </div>
            <p className="text-sm text-gray-300 mt-4">Shows "ON THE CLOCK" text, green border, glow</p>
          </div>

          {/* Coming Up Soon */}
          <div className="bg-white/10 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold mb-4">Coming Up Soon</h2>
            <div className="flex justify-center">
              <PicksAwayCalendar picksAway={2} />
            </div>
            <p className="text-sm text-gray-300 mt-4">Orange/amber warning</p>
          </div>

          {/* Multiple Picks Away */}
          <div className="bg-white/10 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold mb-4">Multiple Picks</h2>
            <div className="flex justify-center">
              <PicksAwayCalendar picksAway={7} />
            </div>
            <p className="text-sm text-gray-300 mt-4">White border, calm state</p>
          </div>

          {/* Many Picks Away */}
          <div className="bg-white/10 p-6 rounded-lg text-center">
            <h2 className="text-lg font-semibold mb-4">Many Picks</h2>
            <div className="flex justify-center">
              <PicksAwayCalendar picksAway={15} />
            </div>
            <p className="text-sm text-gray-300 mt-4">No torn edge effect</p>
          </div>
        </div>

        <div className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Design Features</h2>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• <strong>Calendar Binding:</strong> Brown spiral binding at the top with ring holes</li>
            <li>• <strong>Paper Texture:</strong> White calendar page with subtle texture lines</li>
            <li>• <strong>Perforation Line:</strong> Dotted line at top simulating tear line</li>
            <li>• <strong>Torn Edge:</strong> Shows previous page underneath when countdown starts</li>
            <li>• <strong>Dynamic Colors:</strong> Changes based on picks away (Green=0, Orange=1-3, White=4+)</li>
            <li>• <strong>Urgency Animation:</strong> Slight rotation when it's your turn (0 picks away)</li>
            <li>• <strong>Typography:</strong> Classic serif font for authentic calendar feel</li>
            <li>• <strong>Internal Labels:</strong> "PICKS AWAY" text integrated inside the calendar</li>
            <li>• <strong>Shadows & Glow:</strong> Appropriate visual feedback for different pick states</li>
          </ul>
        </div>

        <div className="bg-white/10 p-6 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-4">Integration</h2>
          <p className="text-sm text-gray-300 mb-4">
            This component can be easily integrated into the "Picks Away" container by replacing 
            the current number display. The component accepts a simple picksAway prop:
          </p>
          <div className="bg-gray-800 p-4 rounded">
            <code className="text-green-400">
              &lt;PicksAwayCalendar picksAway={'{calculatedPicksAway}'} /&gt;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}