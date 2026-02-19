import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer(): React.ReactElement {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Target date: 5 weeks before NFL Draft 2026 (estimated April 23, 2026 - 5 weeks = March 19, 2026)
  const targetDate = new Date('2026-03-19T00:00:00Z');

  useEffect(() => {
    const calculateTimeLeft = (): void => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- targetDate is a constant, no need to re-run
  }, []);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <div className="text-red-500 font-bold text-sm">
        ⚠️ LAUNCH TARGET REACHED
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-300">
      <div className="font-semibold mb-1" style={{
        background: 'url(/wr_blue.png) no-repeat center center',
        backgroundSize: 'cover',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🚀 Launch Countdown
      </div>
      <div className="flex space-x-1">
        <span
          className="bg-gray-800 px-1 rounded text-xs"
          style={{ fontFamily: 'Monocraft, monospace' }}
        >
          {String(timeLeft.days).padStart(2, '0')}d
        </span>
        <span
          className="bg-gray-800 px-1 rounded text-xs"
          style={{ fontFamily: 'Monocraft, monospace' }}
        >
          {String(timeLeft.hours).padStart(2, '0')}h
        </span>
        <span
          className="bg-gray-800 px-1 rounded text-xs"
          style={{ fontFamily: 'Monocraft, monospace' }}
        >
          {String(timeLeft.minutes).padStart(2, '0')}m
        </span>
        <span
          className="bg-gray-800 px-1 rounded text-xs"
          style={{ fontFamily: 'Monocraft, monospace' }}
        >
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        to NFL Draft 2026
      </div>
    </div>
  );
}
