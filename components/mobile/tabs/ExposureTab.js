/**
 * ExposureTab - Mobile Exposure Report Tab
 * 
 * Wrapper component for ExposureReportMobile to maintain
 * consistent tab component structure across all mobile tabs.
 */

import React from 'react';
import ExposureReportMobile from '../ExposureReportMobile';

export default function ExposureTab() {
  return (
    <div className="h-full">
      <ExposureReportMobile />
    </div>
  );
}

