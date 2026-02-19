/**
 * VX2 Draft Logic - Timer Utils Tests
 *
 * Comprehensive unit tests for timer utility functions.
 * Tests all exported functions with zero values, boundary values, large values, and edge cases.
 */

import { TIMER_CONFIG } from '../constants';
import {
  formatTimer,
  formatTimerSeconds,
  getTimerUrgency,
  getTimerColor,
  shouldTimerPulse,
  getTimerProgress,
  getElapsedTime,
} from '../utils/timer';

// ============================================================================
// formatTimer() - Time Formatting M:SS
// ============================================================================

describe('formatTimer', () => {
  describe('zero and small values', () => {
    it('should format zero seconds as "0:00"', () => {
      expect(formatTimer(0)).toBe('0:00');
    });

    it('should format 1 second as "0:01"', () => {
      expect(formatTimer(1)).toBe('0:01');
    });

    it('should format 5 seconds as "0:05"', () => {
      expect(formatTimer(5)).toBe('0:05');
    });

    it('should format 9 seconds as "0:09"', () => {
      expect(formatTimer(9)).toBe('0:09');
    });
  });

  describe('boundary values', () => {
    it('should format 59 seconds as "0:59"', () => {
      expect(formatTimer(59)).toBe('0:59');
    });

    it('should format 60 seconds as "1:00"', () => {
      expect(formatTimer(60)).toBe('1:00');
    });

    it('should format 61 seconds as "1:01"', () => {
      expect(formatTimer(61)).toBe('1:01');
    });

    it('should format 119 seconds as "1:59"', () => {
      expect(formatTimer(119)).toBe('1:59');
    });

    it('should format 120 seconds as "2:00"', () => {
      expect(formatTimer(120)).toBe('2:00');
    });
  });

  describe('larger values', () => {
    it('should format 150 seconds as "2:30"', () => {
      expect(formatTimer(150)).toBe('2:30');
    });

    it('should format 300 seconds as "5:00"', () => {
      expect(formatTimer(300)).toBe('5:00');
    });

    it('should format 599 seconds as "9:59"', () => {
      expect(formatTimer(599)).toBe('9:59');
    });

    it('should format 600 seconds as "10:00"', () => {
      expect(formatTimer(600)).toBe('10:00');
    });

    it('should format 3599 seconds as "59:59"', () => {
      expect(formatTimer(3599)).toBe('59:59');
    });

    it('should format 3600 seconds as "60:00"', () => {
      expect(formatTimer(3600)).toBe('60:00');
    });
  });

  describe('negative values', () => {
    it('should convert negative value to zero', () => {
      expect(formatTimer(-1)).toBe('0:00');
    });

    it('should convert large negative value to zero', () => {
      expect(formatTimer(-100)).toBe('0:00');
    });

    it('should convert -5 to "0:00"', () => {
      expect(formatTimer(-5)).toBe('0:00');
    });
  });

  describe('decimal values', () => {
    it('should floor decimal seconds', () => {
      expect(formatTimer(30.7)).toBe('0:30');
    });

    it('should floor 0.1 to zero', () => {
      expect(formatTimer(0.1)).toBe('0:00');
    });

    it('should floor 59.9 to "0:59"', () => {
      expect(formatTimer(59.9)).toBe('0:59');
    });

    it('should floor 65.5 to "1:05"', () => {
      expect(formatTimer(65.5)).toBe('1:05');
    });
  });
});

// ============================================================================
// formatTimerSeconds() - Seconds Formatting SS
// ============================================================================

describe('formatTimerSeconds', () => {
  describe('zero and small values', () => {
    it('should format zero seconds as "00"', () => {
      expect(formatTimerSeconds(0)).toBe('00');
    });

    it('should format 1 second as "01"', () => {
      expect(formatTimerSeconds(1)).toBe('01');
    });

    it('should format 5 seconds as "05"', () => {
      expect(formatTimerSeconds(5)).toBe('05');
    });

    it('should format 9 seconds as "09"', () => {
      expect(formatTimerSeconds(9)).toBe('09');
    });
  });

  describe('boundary values', () => {
    it('should format 10 seconds as "10"', () => {
      expect(formatTimerSeconds(10)).toBe('10');
    });

    it('should format 59 seconds as "59"', () => {
      expect(formatTimerSeconds(59)).toBe('59');
    });
  });

  describe('larger values (beyond 59)', () => {
    it('should format 60 seconds as "60"', () => {
      expect(formatTimerSeconds(60)).toBe('60');
    });

    it('should format 61 seconds as "61"', () => {
      expect(formatTimerSeconds(61)).toBe('61');
    });

    it('should format 3599 seconds as "3599"', () => {
      expect(formatTimerSeconds(3599)).toBe('3599');
    });

    it('should format large numbers with padding', () => {
      expect(formatTimerSeconds(100)).toBe('100');
    });
  });

  describe('negative values', () => {
    it('should convert negative value to zero', () => {
      expect(formatTimerSeconds(-1)).toBe('00');
    });

    it('should convert large negative to zero', () => {
      expect(formatTimerSeconds(-100)).toBe('00');
    });
  });

  describe('decimal values', () => {
    it('should floor decimal seconds', () => {
      expect(formatTimerSeconds(30.7)).toBe('30');
    });

    it('should floor 0.5 to zero', () => {
      expect(formatTimerSeconds(0.5)).toBe('00');
    });

    it('should floor 59.9 to "59"', () => {
      expect(formatTimerSeconds(59.9)).toBe('59');
    });
  });
});

// ============================================================================
// getTimerUrgency() - Urgency Level Calculation
// ============================================================================

describe('getTimerUrgency', () => {
  describe('critical threshold', () => {
    it('should return "critical" at critical threshold', () => {
      expect(getTimerUrgency(TIMER_CONFIG.criticalThreshold)).toBe('critical');
    });

    it('should return "critical" below critical threshold', () => {
      expect(getTimerUrgency(TIMER_CONFIG.criticalThreshold - 1)).toBe('critical');
    });

    it('should return "critical" at 0 seconds', () => {
      expect(getTimerUrgency(0)).toBe('critical');
    });

    it('should return "critical" at 1 second', () => {
      expect(getTimerUrgency(1)).toBe('critical');
    });

    it('should return "critical" at 3 seconds (below 5)', () => {
      expect(getTimerUrgency(3)).toBe('critical');
    });
  });

  describe('warning threshold', () => {
    it('should return "warning" at warning threshold', () => {
      expect(getTimerUrgency(TIMER_CONFIG.warningThreshold)).toBe('warning');
    });

    it('should return "warning" between warning and critical', () => {
      expect(getTimerUrgency(TIMER_CONFIG.warningThreshold - 1)).toBe('warning');
    });

    it('should return "warning" at 9 seconds (below 10, above 5)', () => {
      expect(getTimerUrgency(9)).toBe('warning');
    });

    it('should return "warning" at 6 seconds', () => {
      expect(getTimerUrgency(6)).toBe('warning');
    });
  });

  describe('normal threshold', () => {
    it('should return "normal" above warning threshold', () => {
      expect(getTimerUrgency(TIMER_CONFIG.warningThreshold + 1)).toBe('normal');
    });

    it('should return "normal" at 11 seconds', () => {
      expect(getTimerUrgency(11)).toBe('normal');
    });

    it('should return "normal" at 30 seconds', () => {
      expect(getTimerUrgency(30)).toBe('normal');
    });

    it('should return "normal" at large values', () => {
      expect(getTimerUrgency(3600)).toBe('normal');
    });
  });

  describe('edge cases', () => {
    it('should handle negative values', () => {
      expect(getTimerUrgency(-1)).toBe('critical');
    });

    it('should handle very large values', () => {
      expect(getTimerUrgency(99999)).toBe('normal');
    });
  });
});

// ============================================================================
// getTimerColor() - Color Based on Time
// ============================================================================

describe('getTimerColor', () => {
  describe('critical color', () => {
    it('should return critical color when urgent', () => {
      expect(getTimerColor(TIMER_CONFIG.criticalThreshold)).toBe(TIMER_CONFIG.colors.critical);
    });

    it('should return critical color at 0 seconds', () => {
      expect(getTimerColor(0)).toBe(TIMER_CONFIG.colors.critical);
    });

    it('should return critical color at 1 second', () => {
      expect(getTimerColor(1)).toBe(TIMER_CONFIG.colors.critical);
    });

    it('should return critical color below critical threshold', () => {
      expect(getTimerColor(3)).toBe(TIMER_CONFIG.colors.critical);
    });
  });

  describe('warning color', () => {
    it('should return warning color at warning threshold', () => {
      expect(getTimerColor(TIMER_CONFIG.warningThreshold)).toBe(TIMER_CONFIG.colors.warning);
    });

    it('should return warning color at 9 seconds', () => {
      expect(getTimerColor(9)).toBe(TIMER_CONFIG.colors.warning);
    });

    it('should return warning color between thresholds', () => {
      expect(getTimerColor(7)).toBe(TIMER_CONFIG.colors.warning);
    });
  });

  describe('normal color', () => {
    it('should return normal color above warning threshold', () => {
      expect(getTimerColor(11)).toBe(TIMER_CONFIG.colors.normal);
    });

    it('should return normal color at 30 seconds', () => {
      expect(getTimerColor(30)).toBe(TIMER_CONFIG.colors.normal);
    });

    it('should return normal color at large values', () => {
      expect(getTimerColor(3600)).toBe(TIMER_CONFIG.colors.normal);
    });
  });

  describe('color values', () => {
    it('should return valid color hex for critical', () => {
      const color = getTimerColor(0);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#EF4444'); // Red
    });

    it('should return valid color hex for warning', () => {
      const color = getTimerColor(8);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#F59E0B'); // Amber
    });

    it('should return valid color hex for normal', () => {
      const color = getTimerColor(30);
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(color).toBe('#22C55E'); // Green
    });
  });
});

// ============================================================================
// shouldTimerPulse() - Pulse Animation Trigger
// ============================================================================

describe('shouldTimerPulse', () => {
  describe('should pulse in critical state', () => {
    it('should pulse at critical threshold', () => {
      expect(shouldTimerPulse(TIMER_CONFIG.criticalThreshold)).toBe(true);
    });

    it('should pulse at 1 second', () => {
      expect(shouldTimerPulse(1)).toBe(true);
    });

    it('should pulse at 3 seconds', () => {
      expect(shouldTimerPulse(3)).toBe(true);
    });

    it('should pulse below critical threshold', () => {
      expect(shouldTimerPulse(2)).toBe(true);
    });
  });

  describe('should not pulse when timer expired', () => {
    it('should not pulse at 0 seconds', () => {
      expect(shouldTimerPulse(0)).toBe(false);
    });

    it('should not pulse at negative seconds', () => {
      expect(shouldTimerPulse(-1)).toBe(false);
    });

    it('should not pulse at large negative', () => {
      expect(shouldTimerPulse(-100)).toBe(false);
    });
  });

  describe('should not pulse above critical threshold', () => {
    it('should not pulse above critical threshold', () => {
      expect(shouldTimerPulse(TIMER_CONFIG.criticalThreshold + 1)).toBe(false);
    });

    it('should not pulse at 6 seconds', () => {
      expect(shouldTimerPulse(6)).toBe(false);
    });

    it('should not pulse at 30 seconds', () => {
      expect(shouldTimerPulse(30)).toBe(false);
    });

    it('should not pulse at large values', () => {
      expect(shouldTimerPulse(3600)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should pulse at exactly critical threshold', () => {
      expect(shouldTimerPulse(5)).toBe(true);
    });

    it('should not pulse at just above critical threshold', () => {
      expect(shouldTimerPulse(5.1)).toBe(false);
    });

    it('should pulse at decimal below critical', () => {
      expect(shouldTimerPulse(4.9)).toBe(true);
    });
  });
});

// ============================================================================
// getTimerProgress() - Progress Percentage
// ============================================================================

describe('getTimerProgress', () => {
  describe('zero values', () => {
    it('should return 0 when total is 0', () => {
      expect(getTimerProgress(0, 0)).toBe(0);
    });

    it('should return 0 when remaining is 0', () => {
      expect(getTimerProgress(0, 30)).toBe(0);
    });

    it('should return 100 when remaining equals total', () => {
      expect(getTimerProgress(30, 30)).toBe(100);
    });
  });

  describe('boundary values', () => {
    it('should return 100 when time not elapsed', () => {
      expect(getTimerProgress(60, 60)).toBe(100);
    });

    it('should return 50 when half time remains', () => {
      expect(getTimerProgress(15, 30)).toBe(50);
    });

    it('should return 33.333... when one third remains', () => {
      const result = getTimerProgress(10, 30);
      expect(result).toBeCloseTo(33.333, 2);
    });

    it('should return 1 when almost expired', () => {
      const result = getTimerProgress(0.3, 30);
      expect(result).toBeCloseTo(1, 0);
    });
  });

  describe('various percentages', () => {
    it('should return 10 when 10% remains', () => {
      expect(getTimerProgress(3, 30)).toBe(10);
    });

    it('should return 25 when 25% remains', () => {
      expect(getTimerProgress(7.5, 30)).toBe(25);
    });

    it('should return 75 when 75% remains', () => {
      expect(getTimerProgress(22.5, 30)).toBe(75);
    });

    it('should return 99 when 99% remains', () => {
      expect(getTimerProgress(29.7, 30)).toBe(99);
    });
  });

  describe('large values', () => {
    it('should handle large total and remaining', () => {
      expect(getTimerProgress(5000, 10000)).toBe(50);
    });

    it('should handle very large values', () => {
      expect(getTimerProgress(50, 1000)).toBe(5);
    });

    it('should return 100 for very large same values', () => {
      expect(getTimerProgress(999999, 999999)).toBe(100);
    });
  });

  describe('clipping to 0-100', () => {
    it('should clamp negative remaining to 0', () => {
      expect(getTimerProgress(-10, 30)).toBe(0);
    });

    it('should clamp remaining > total to 100', () => {
      expect(getTimerProgress(50, 30)).toBe(100);
    });

    it('should clamp large overage to 100', () => {
      expect(getTimerProgress(1000, 30)).toBe(100);
    });
  });

  describe('negative total', () => {
    it('should return 0 when total is negative', () => {
      expect(getTimerProgress(10, -30)).toBe(0);
    });

    it('should return 0 when total is negative and remaining is positive', () => {
      expect(getTimerProgress(50, -100)).toBe(0);
    });
  });

  describe('decimal values', () => {
    it('should handle decimal remaining', () => {
      expect(getTimerProgress(15.5, 30)).toBeCloseTo(51.67, 1);
    });

    it('should handle decimal total', () => {
      expect(getTimerProgress(15, 30.5)).toBeCloseTo(49.18, 1);
    });

    it('should handle both decimal', () => {
      expect(getTimerProgress(15.5, 30.5)).toBeCloseTo(50.82, 1);
    });
  });
});

// ============================================================================
// getElapsedTime() - Elapsed Time Calculation
// ============================================================================

describe('getElapsedTime', () => {
  describe('zero values', () => {
    it('should return 0 when no time elapsed', () => {
      expect(getElapsedTime(30, 30)).toBe(0);
    });

    it('should return 0 when remaining equals total', () => {
      expect(getElapsedTime(60, 60)).toBe(0);
    });

    it('should return 0 when both are zero', () => {
      expect(getElapsedTime(0, 0)).toBe(0);
    });
  });

  describe('standard cases', () => {
    it('should return total when remaining is 0', () => {
      expect(getElapsedTime(0, 30)).toBe(30);
    });

    it('should return 15 when half time elapsed', () => {
      expect(getElapsedTime(15, 30)).toBe(15);
    });

    it('should return 27 when 27 seconds elapsed from 30', () => {
      expect(getElapsedTime(3, 30)).toBe(27);
    });

    it('should return 60 when full minute elapsed', () => {
      expect(getElapsedTime(0, 60)).toBe(60);
    });
  });

  describe('boundary values', () => {
    it('should return 1 when 1 second elapsed', () => {
      expect(getElapsedTime(29, 30)).toBe(1);
    });

    it('should return 29 when 29 seconds elapsed from 30', () => {
      expect(getElapsedTime(1, 30)).toBe(29);
    });
  });

  describe('large values', () => {
    it('should handle large totals', () => {
      expect(getElapsedTime(0, 10000)).toBe(10000);
    });

    it('should handle large remaining and total', () => {
      expect(getElapsedTime(5000, 10000)).toBe(5000);
    });

    it('should handle very large values', () => {
      expect(getElapsedTime(1000, 1000000)).toBe(999000);
    });
  });

  describe('negative handling', () => {
    it('should clamp negative result to 0', () => {
      expect(getElapsedTime(50, 30)).toBe(0);
    });

    it('should clamp when remaining > total', () => {
      expect(getElapsedTime(100, 30)).toBe(0);
    });

    it('should handle negative remaining as time "beyond total"', () => {
      // When remaining is negative, elapsed = total - remaining will be > total
      // Only the case where result would be negative gets clamped to 0
      // Example: if total=30 and remaining=-10, elapsed = 30-(-10) = 40
      expect(getElapsedTime(-10, 30)).toBe(40);
    });
  });

  describe('decimal values', () => {
    it('should handle decimal remaining', () => {
      expect(getElapsedTime(15.5, 30)).toBe(14.5);
    });

    it('should handle decimal total', () => {
      expect(getElapsedTime(15, 30.5)).toBe(15.5);
    });

    it('should handle both decimal', () => {
      expect(getElapsedTime(15.5, 30.5)).toBe(15);
    });
  });

  describe('mathematical correctness', () => {
    it('should satisfy: elapsed + remaining = total', () => {
      const total = 30;
      const remaining = 12;
      const elapsed = getElapsedTime(remaining, total);
      expect(elapsed + remaining).toBe(total);
    });

    it('should satisfy formula for various inputs', () => {
      const testCases = [
        { total: 60, remaining: 30 },
        { total: 100, remaining: 75 },
        { total: 45, remaining: 10 },
        { total: 1000, remaining: 250 },
      ];

      testCases.forEach(({ total, remaining }) => {
        const elapsed = getElapsedTime(remaining, total);
        expect(elapsed + remaining).toBe(total);
      });
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Timer functions integration', () => {
  describe('formatting consistency', () => {
    it('formatTimer and formatTimerSeconds should be consistent for small values', () => {
      for (let i = 0; i < 10; i++) {
        const fullFormat = formatTimer(i);
        const secondsFormat = formatTimerSeconds(i);
        const [, secs] = fullFormat.split(':');
        expect(secs).toBe(secondsFormat);
      }
    });

    it('formatTimer should pad seconds correctly for all values', () => {
      const testCases = [0, 1, 5, 9, 10, 30, 59, 60, 150, 300];
      testCases.forEach((seconds) => {
        const formatted = formatTimer(seconds);
        const [, secs] = formatted.split(':');
        expect(secs.length).toBe(2);
        expect(/^\d{2}$/.test(secs)).toBe(true);
      });
    });
  });

  describe('urgency and color relationship', () => {
    it('critical urgency should have critical color', () => {
      const urgency = getTimerUrgency(3);
      const color = getTimerColor(3);
      expect(urgency).toBe('critical');
      expect(color).toBe(TIMER_CONFIG.colors.critical);
    });

    it('warning urgency should have warning color', () => {
      const urgency = getTimerUrgency(8);
      const color = getTimerColor(8);
      expect(urgency).toBe('warning');
      expect(color).toBe(TIMER_CONFIG.colors.warning);
    });

    it('normal urgency should have normal color', () => {
      const urgency = getTimerUrgency(30);
      const color = getTimerColor(30);
      expect(urgency).toBe('normal');
      expect(color).toBe(TIMER_CONFIG.colors.normal);
    });
  });

  describe('pulse and urgency relationship', () => {
    it('should pulse only when critical and not expired', () => {
      const seconds = TIMER_CONFIG.criticalThreshold;
      const urgency = getTimerUrgency(seconds);
      const shouldPulse = shouldTimerPulse(seconds);
      expect(urgency).toBe('critical');
      expect(shouldPulse).toBe(true);
    });

    it('should not pulse when above critical threshold', () => {
      const seconds = TIMER_CONFIG.criticalThreshold + 1;
      const shouldPulse = shouldTimerPulse(seconds);
      expect(shouldPulse).toBe(false);
    });

    it('should not pulse when expired', () => {
      const shouldPulse = shouldTimerPulse(0);
      expect(shouldPulse).toBe(false);
    });
  });

  describe('progress and elapsed time relationship', () => {
    it('progress and elapsed should be mathematically consistent', () => {
      const total = 30;
      const remaining = 12;
      const progress = getTimerProgress(remaining, total);
      const elapsed = getElapsedTime(remaining, total);

      // elapsed / total should equal 1 - (progress / 100)
      const elapsedPercent = (elapsed / total) * 100;
      expect(elapsedPercent).toBeCloseTo(100 - progress, 5);
    });

    it('progress should reflect time remaining correctly', () => {
      const testCases = [
        { total: 30, remaining: 30, expectedProgress: 100 },
        { total: 30, remaining: 15, expectedProgress: 50 },
        { total: 30, remaining: 0, expectedProgress: 0 },
      ];

      testCases.forEach(({ total, remaining, expectedProgress }) => {
        const progress = getTimerProgress(remaining, total);
        const elapsed = getElapsedTime(remaining, total);
        expect(progress).toBe(expectedProgress);
        expect(elapsed + remaining).toBe(total);
      });
    });
  });

  describe('real-world usage scenarios', () => {
    it('should handle a typical pick timer countdown', () => {
      const pickTime = 30;

      // Timer full
      expect(formatTimer(pickTime)).toBe('0:30');
      expect(getTimerUrgency(pickTime)).toBe('normal');
      expect(shouldTimerPulse(pickTime)).toBe(false);
      expect(getTimerProgress(pickTime, pickTime)).toBe(100);

      // 15 seconds remaining
      expect(formatTimer(15)).toBe('0:15');
      expect(getTimerUrgency(15)).toBe('normal');
      expect(shouldTimerPulse(15)).toBe(false);
      expect(getTimerProgress(15, pickTime)).toBe(50);

      // Warning threshold
      expect(formatTimer(10)).toBe('0:10');
      expect(getTimerUrgency(10)).toBe('warning');
      expect(shouldTimerPulse(10)).toBe(false);
      expect(getTimerProgress(10, pickTime)).toBeCloseTo(33.33, 1);

      // Critical threshold
      expect(formatTimer(5)).toBe('0:05');
      expect(getTimerUrgency(5)).toBe('critical');
      expect(shouldTimerPulse(5)).toBe(true);
      expect(getTimerProgress(5, pickTime)).toBeCloseTo(16.67, 1);

      // 1 second left
      expect(formatTimer(1)).toBe('0:01');
      expect(getTimerUrgency(1)).toBe('critical');
      expect(shouldTimerPulse(1)).toBe(true);
      expect(getTimerProgress(1, pickTime)).toBeCloseTo(3.33, 1);

      // Expired
      expect(formatTimer(0)).toBe('0:00');
      expect(getTimerUrgency(0)).toBe('critical');
      expect(shouldTimerPulse(0)).toBe(false);
      expect(getTimerProgress(0, pickTime)).toBe(0);
    });

    it('should handle a longer timer period', () => {
      const totalSeconds = 300; // 5 minutes

      // Full time
      expect(formatTimer(300)).toBe('5:00');
      expect(getTimerProgress(300, totalSeconds)).toBe(100);

      // Half time
      expect(formatTimer(150)).toBe('2:30');
      expect(getTimerProgress(150, totalSeconds)).toBe(50);

      // 1 minute
      expect(formatTimer(60)).toBe('1:00');
      expect(getTimerProgress(60, totalSeconds)).toBe(20);

      // Critical
      expect(formatTimer(3)).toBe('0:03');
      expect(getTimerUrgency(3)).toBe('critical');
      expect(shouldTimerPulse(3)).toBe(true);
    });
  });

  describe('config usage', () => {
    it('should use correct thresholds from TIMER_CONFIG', () => {
      expect(TIMER_CONFIG.criticalThreshold).toBe(5);
      expect(TIMER_CONFIG.warningThreshold).toBe(10);

      const urgency5 = getTimerUrgency(5);
      const urgency4 = getTimerUrgency(4);
      expect(urgency5).toBe('critical');
      expect(urgency4).toBe('critical');

      const urgency10 = getTimerUrgency(10);
      const urgency9 = getTimerUrgency(9);
      expect(urgency10).toBe('warning');
      expect(urgency9).toBe('warning');
    });

    it('should use correct colors from TIMER_CONFIG', () => {
      const criticalColor = getTimerColor(0);
      const warningColor = getTimerColor(7);
      const normalColor = getTimerColor(30);

      expect(criticalColor).toBe(TIMER_CONFIG.colors.critical);
      expect(warningColor).toBe(TIMER_CONFIG.colors.warning);
      expect(normalColor).toBe(TIMER_CONFIG.colors.normal);
    });
  });
});
