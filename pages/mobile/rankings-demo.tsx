/**
 * New Mobile Rankings Demo Page
 * 
 * Demonstrates the new single-tab RankingsPageMobile component
 */

import React from 'react';
import RankingsPageMobile from '../../components/mobile/RankingsPageMobile';

export default function RankingsDemoPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-md mx-auto h-screen">
        <RankingsPageMobile />
      </div>
    </div>
  );
}
