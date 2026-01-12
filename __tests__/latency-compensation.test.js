/**
 * Latency Compensation Tests
 * 
 * Tests for latency compensation functionality in draft rooms.
 */

import { 
  measureLatency, 
  LatencyTracker, 
  compensateTimer,
  calculateSafeSubmissionTime 
} from '../lib/draft/latencyCompensation';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Latency Compensation', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('measureLatency', () => {
    it('should measure latency successfully', async () => {
      const mockResponse = {
        headers: {
          get: jest.fn((header) => {
            if (header === 'X-Server-Time') {
              return Date.now().toString();
            }
            return null;
          }),
        },
      };

      fetch.mockResolvedValueOnce(mockResponse);

      const measurement = await measureLatency('/api/health');

      expect(measurement).toHaveProperty('rtt');
      expect(measurement).toHaveProperty('timestamp');
      expect(measurement.rtt).toBeGreaterThanOrEqual(0);
      expect(fetch).toHaveBeenCalledWith('/api/health', {
        method: 'GET',
        cache: 'no-cache',
      });
    });

    it('should handle fetch errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const measurement = await measureLatency('/api/health');

      expect(measurement.rtt).toBe(500); // Conservative estimate
      expect(measurement.timestamp).toBeDefined();
    });
  });

  describe('LatencyTracker', () => {
    let tracker;

    beforeEach(() => {
      tracker = new LatencyTracker(10);
    });

    it('should track measurements', () => {
      tracker.addMeasurement({ rtt: 100, timestamp: Date.now() });
      tracker.addMeasurement({ rtt: 150, timestamp: Date.now() });
      tracker.addMeasurement({ rtt: 200, timestamp: Date.now() });

      const stats = tracker.getStats();
      expect(stats.count).toBe(3);
      expect(stats.average).toBe(150);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(200);
    });

    it('should maintain max measurements', () => {
      for (let i = 0; i < 15; i++) {
        tracker.addMeasurement({ rtt: i * 10, timestamp: Date.now() });
      }

      const stats = tracker.getStats();
      expect(stats.count).toBe(10); // Should only keep last 10
    });

    it('should calculate estimated latency', () => {
      tracker.addMeasurement({ rtt: 100, timestamp: Date.now() });
      tracker.addMeasurement({ rtt: 120, timestamp: Date.now() });
      tracker.addMeasurement({ rtt: 110, timestamp: Date.now() });

      const estimated = tracker.getEstimatedLatency();
      expect(estimated).toBeGreaterThan(0);
      expect(estimated).toBeLessThanOrEqual(120);
    });

    it('should return zero stats when empty', () => {
      const stats = tracker.getStats();
      expect(stats.count).toBe(0);
      expect(stats.average).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
    });
  });

  describe('compensateTimer', () => {
    it('should compensate timer for latency', () => {
      const serverTimer = 30000; // 30 seconds in ms
      const latency = 200; // 200ms latency

      const compensated = compensateTimer(serverTimer, latency);
      
      // Should add half the latency (one-way delay)
      expect(compensated).toBe(serverTimer + (latency / 2));
      expect(compensated).toBe(30100);
    });

    it('should handle zero latency', () => {
      const serverTimer = 30000;
      const compensated = compensateTimer(serverTimer, 0);
      
      expect(compensated).toBe(serverTimer);
    });

    it('should handle high latency', () => {
      const serverTimer = 30000;
      const latency = 500; // 500ms latency

      const compensated = compensateTimer(serverTimer, latency);
      
      expect(compensated).toBe(30250); // 30s + 250ms
    });
  });

  describe('calculateSafeSubmissionTime', () => {
    it('should calculate safe submission time', () => {
      const timeRemaining = 5000; // 5 seconds
      const latency = 200;
      const buffer = 1000;

      const safeTime = calculateSafeSubmissionTime(timeRemaining, latency, buffer);
      
      // Should be latency + buffer
      expect(safeTime).toBe(latency + buffer);
      expect(safeTime).toBe(1200);
    });

    it('should use default buffer if not provided', () => {
      const timeRemaining = 5000;
      const latency = 200;

      const safeTime = calculateSafeSubmissionTime(timeRemaining, latency);
      
      // Default buffer is 1000ms
      expect(safeTime).toBe(1200);
    });
  });
});
