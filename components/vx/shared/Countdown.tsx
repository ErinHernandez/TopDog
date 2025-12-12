/**
 * VX Countdown Component
 * 
 * Visual countdown timers for drafts and events.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TEXT_COLORS, BG_COLORS, BRAND_COLORS } from '../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface CountdownProps {
  /** Target date/time */
  targetDate?: Date;
  /** Seconds remaining (alternative to targetDate) */
  seconds?: number;
  /** Format to display */
  format?: 'full' | 'compact' | 'minimal';
  /** Size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show when time is up */
  expiredText?: string;
  /** Callback when countdown ends */
  onComplete?: () => void;
  /** Warning threshold (seconds) */
  warningThreshold?: number;
  /** Danger threshold (seconds) */
  dangerThreshold?: number;
  /** Custom className */
  className?: string;
}

export interface DraftTimerProps {
  /** Seconds remaining */
  seconds: number;
  /** Whether it's user's turn */
  isUserTurn?: boolean;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show progress ring */
  showRing?: boolean;
  /** Total time for ring */
  totalTime?: number;
  /** Custom className */
  className?: string;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES = {
  sm: { fontSize: '14px', labelSize: '10px', gap: '4px' },
  md: { fontSize: '20px', labelSize: '11px', gap: '6px' },
  lg: { fontSize: '28px', labelSize: '12px', gap: '8px' },
  xl: { fontSize: '40px', labelSize: '14px', gap: '12px' },
};

// ============================================================================
// HELPERS
// ============================================================================

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: Math.floor(difference / 1000),
  };
}

function padNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

// ============================================================================
// COUNTDOWN COMPONENT
// ============================================================================

export default function Countdown({
  targetDate,
  seconds: initialSeconds,
  format = 'full',
  size = 'md',
  expiredText = 'Time Up',
  onComplete,
  warningThreshold = 30,
  dangerThreshold = 10,
  className = '',
}: CountdownProps): React.ReactElement {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => {
    if (targetDate) {
      return calculateTimeLeft(targetDate);
    }
    if (initialSeconds !== undefined) {
      return {
        days: 0,
        hours: Math.floor(initialSeconds / 3600),
        minutes: Math.floor((initialSeconds % 3600) / 60),
        seconds: initialSeconds % 60,
        total: initialSeconds,
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  });

  const sizeStyle = SIZE_STYLES[size];

  useEffect(() => {
    const timer = setInterval(() => {
      if (targetDate) {
        const newTimeLeft = calculateTimeLeft(targetDate);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft.total <= 0) {
          clearInterval(timer);
          onComplete?.();
        }
      } else if (initialSeconds !== undefined) {
        setTimeLeft(prev => {
          if (prev.total <= 0) {
            clearInterval(timer);
            onComplete?.();
            return prev;
          }
          const newTotal = prev.total - 1;
          return {
            days: 0,
            hours: Math.floor(newTotal / 3600),
            minutes: Math.floor((newTotal % 3600) / 60),
            seconds: newTotal % 60,
            total: newTotal,
          };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, initialSeconds, onComplete]);

  const getColor = useCallback(() => {
    if (timeLeft.total <= dangerThreshold) return '#EF4444';
    if (timeLeft.total <= warningThreshold) return '#F59E0B';
    return TEXT_COLORS.primary;
  }, [timeLeft.total, dangerThreshold, warningThreshold]);

  if (timeLeft.total <= 0) {
    return (
      <div
        className={`font-bold ${className}`}
        style={{ fontSize: sizeStyle.fontSize, color: '#EF4444' }}
      >
        {expiredText}
      </div>
    );
  }

  // Minimal format: just seconds or MM:SS
  if (format === 'minimal') {
    const display = timeLeft.total >= 60 
      ? `${Math.floor(timeLeft.total / 60)}:${padNumber(timeLeft.total % 60)}`
      : `${timeLeft.total}`;
    
    return (
      <div
        className={`font-bold tabular-nums ${className}`}
        style={{ fontSize: sizeStyle.fontSize, color: getColor() }}
      >
        {display}
      </div>
    );
  }

  // Compact format: HH:MM:SS or MM:SS
  if (format === 'compact') {
    const parts = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(padNumber(timeLeft.hours));
    parts.push(padNumber(timeLeft.minutes));
    parts.push(padNumber(timeLeft.seconds));
    
    return (
      <div
        className={`font-bold tabular-nums ${className}`}
        style={{ fontSize: sizeStyle.fontSize, color: getColor() }}
      >
        {parts.join(':')}
      </div>
    );
  }

  // Full format: labeled units
  const units = [];
  if (timeLeft.days > 0) units.push({ value: timeLeft.days, label: 'Days' });
  if (timeLeft.hours > 0 || timeLeft.days > 0) units.push({ value: timeLeft.hours, label: 'Hrs' });
  units.push({ value: timeLeft.minutes, label: 'Min' });
  units.push({ value: timeLeft.seconds, label: 'Sec' });

  return (
    <div className={`flex items-center ${className}`} style={{ gap: sizeStyle.gap }}>
      {units.map((unit, index) => (
        <React.Fragment key={unit.label}>
          <div className="flex flex-col items-center">
            <div
              className="font-bold tabular-nums"
              style={{ fontSize: sizeStyle.fontSize, color: getColor() }}
            >
              {padNumber(unit.value)}
            </div>
            <div
              className="uppercase tracking-wider"
              style={{ fontSize: sizeStyle.labelSize, color: TEXT_COLORS.muted }}
            >
              {unit.label}
            </div>
          </div>
          {index < units.length - 1 && (
            <div
              className="font-bold"
              style={{ fontSize: sizeStyle.fontSize, color: TEXT_COLORS.muted }}
            >
              :
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// DRAFT TIMER (Circular progress variant)
// ============================================================================

export function DraftTimer({
  seconds,
  isUserTurn = false,
  size = 'md',
  showRing = true,
  totalTime = 30,
  className = '',
}: DraftTimerProps): React.ReactElement {
  const ringSize = size === 'sm' ? 48 : size === 'md' ? 64 : 80;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const fontSize = size === 'sm' ? '16px' : size === 'md' ? '22px' : '28px';

  const radius = (ringSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(100, (seconds / totalTime) * 100);
  const offset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    if (seconds <= 5) return '#EF4444';
    if (seconds <= 10) return '#F59E0B';
    if (isUserTurn) return BRAND_COLORS.primary;
    return TEXT_COLORS.primary;
  };

  if (!showRing) {
    return (
      <div
        className={`font-bold tabular-nums ${className}`}
        style={{ fontSize, color: getColor() }}
      >
        {seconds}
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: ringSize, height: ringSize }}
    >
      <svg className="transform -rotate-90" width={ringSize} height={ringSize}>
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div
        className="absolute font-bold tabular-nums"
        style={{ fontSize, color: getColor() }}
      >
        {seconds}
      </div>
    </div>
  );
}

// ============================================================================
// SIMPLE TIMER (Just seconds display)
// ============================================================================

export interface SimpleTimerProps {
  seconds: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export function SimpleTimer({
  seconds,
  size = 'lg',
  color,
  className = '',
}: SimpleTimerProps): React.ReactElement {
  const sizeStyle = SIZE_STYLES[size];
  
  const getColor = () => {
    if (color) return color;
    if (seconds <= 5) return '#EF4444';
    if (seconds <= 10) return '#F59E0B';
    return TEXT_COLORS.primary;
  };

  return (
    <div
      className={`font-bold tabular-nums ${className}`}
      style={{ fontSize: sizeStyle.fontSize, color: getColor() }}
    >
      {seconds}
    </div>
  );
}

