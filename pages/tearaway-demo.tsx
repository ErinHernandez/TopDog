/* eslint-disable react/no-unescaped-entities */
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
          <h2 className="text-2xl font-bold mb-4">Component Features</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✅ Dynamic styling based on picks away count</li>
            <li>✅ "ON THE CLOCK" text when picksAway is 0</li>
            <li>✅ Green border and glow effect for urgent state</li>
            <li>✅ Orange/amber warning for coming up soon (1-3 picks)</li>
            <li>✅ Torn edge effect for urgent states</li>
            <li>✅ Smooth transitions between states</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
