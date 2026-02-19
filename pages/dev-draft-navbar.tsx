import React from 'react';

import { DraftNavbar } from '../components/vx2/draft-room';

export default function DevDraftNavbar() {
  return (
    <div className="min-h-screen bg-gray-900">
      <DraftNavbar onLeave={() => window.history.back()} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            🎯 Draft Room Navbar Preview
          </h1>
          <p className="text-gray-300 mb-4">
            This is a preview of the new draft room navbar with:
          </p>
          <ul className="text-gray-300 space-y-2">
            <li>✅ Teal-gray stone background texture</li>
            <li>✅ TopDog.dog logo and text</li>
            <li>✅ Arrow dropdown on the right</li>
            <li>✅ Navigation options including &quot;Exit Draft&quot;</li>
            <li>✅ Clean, minimalist design for draft rooms</li>
          </ul>
          
          <div className="mt-6 p-4 bg-gray-700 rounded">
            <h3 className="text-lg font-semibold text-white mb-2">Instructions:</h3>
            <p className="text-gray-300">
              Click the arrow (▼) on the right side of the navbar to see the dropdown menu.
              The navbar uses the teal-gray stone texture you provided.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
