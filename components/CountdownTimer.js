import React from 'react';
import SevenSegmentCountdown from './SevenSegmentCountdown';

export default function CountdownTimer({ initialSeconds = 30 }) {
  return <SevenSegmentCountdown initialSeconds={initialSeconds} />;
} 