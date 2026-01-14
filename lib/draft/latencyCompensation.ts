/**
 * Draft Room Latency Compensation
 * 
 * Compensates for network latency in draft rooms to ensure fair timing
 * for all users, regardless of their location.
 * 
 * @module lib/draft/latencyCompensation
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LatencyMeasurement {
  /** Round-trip time in milliseconds */
  rtt: number;
  /** Timestamp when measurement was taken */
  timestamp: number;
  /** Server timestamp (if available) */
  serverTimestamp?: number;
}

export interface LatencyStats {
  /** Average latency */
  average: number;
  /** Minimum latency */
  min: number;
  /** Maximum latency */
  max: number;
  /** Current estimated latency */
  current: number;
  /** Number of measurements */
  count: number;
}

// ============================================================================
// LATENCY MEASUREMENT
// ============================================================================

/**
 * Measure latency to server
 * 
 * Sends a ping request and measures round-trip time.
 */
export const measureLatency = async (
  endpoint: string = '/api/health'
): Promise<LatencyMeasurement> => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-cache',
    });
    
    const endTime = performance.now();
    const rtt = endTime - startTime;
    
    // Try to get server timestamp from response
    const serverTimestamp = response.headers.get('X-Server-Time')
      ? parseInt(response.headers.get('X-Server-Time')!, 10)
      : undefined;
    
    return {
      rtt,
      timestamp: Date.now(),
      serverTimestamp,
    };
  } catch (error) {
    // If measurement fails, return high latency estimate
    return {
      rtt: 500, // Conservative estimate
      timestamp: Date.now(),
    };
  }
};

/**
 * Measure latency multiple times and calculate average
 */
export async function measureAverageLatency(
  endpoint: string = '/api/health',
  samples: number = 3
): Promise<number> {
  const measurements: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const measurement = await measureLatency(endpoint);
    measurements.push(measurement.rtt);
    
    // Small delay between measurements
    if (i < samples - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Calculate average, excluding outliers
  const sorted = measurements.sort((a, b) => a - b);
  const middle = sorted.slice(1, -1); // Remove min and max
  return middle.reduce((sum, val) => sum + val, 0) / middle.length;
}

// ============================================================================
// LATENCY TRACKING
// ============================================================================

/**
 * Latency tracker that maintains rolling average
 */
export class LatencyTracker {
  private measurements: LatencyMeasurement[] = [];
  private maxMeasurements: number = 10;
  
  constructor(maxMeasurements: number = 10) {
    this.maxMeasurements = maxMeasurements;
  }
  
  /**
   * Add a latency measurement
   */
  addMeasurement(measurement: LatencyMeasurement): void {
    this.measurements.push(measurement);
    
    // Keep only recent measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }
  }
  
  /**
   * Get current latency statistics
   */
  getStats(): LatencyStats {
    if (this.measurements.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        current: 0,
        count: 0,
      };
    }
    
    const rtts = this.measurements.map(m => m.rtt);
    const sum = rtts.reduce((a, b) => a + b, 0);
    const average = sum / rtts.length;
    const min = Math.min(...rtts);
    const max = Math.max(...rtts);
    const current = this.measurements[this.measurements.length - 1].rtt;
    
    return {
      average,
      min,
      max,
      current,
      count: this.measurements.length,
    };
  }
  
  /**
   * Get estimated current latency
   */
  getEstimatedLatency(): number {
    const stats = this.getStats();
    // Use weighted average (recent measurements weighted more)
    if (stats.count === 0) return 0;
    if (stats.count === 1) return stats.current;
    
    // Weight recent measurements more heavily
    const recent = this.measurements.slice(-3);
    const recentAvg = recent.reduce((sum, m) => sum + m.rtt, 0) / recent.length;
    const overallAvg = stats.average;
    
    // 70% weight on recent, 30% on overall
    return recentAvg * 0.7 + overallAvg * 0.3;
  }
  
  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = [];
  }
}

// ============================================================================
// TIMER COMPENSATION
// ============================================================================

/**
 * Compensate draft timer for latency
 * 
 * Adjusts the displayed timer to account for network latency,
 * ensuring all users see approximately the same time remaining.
 */
export function compensateTimer(
  serverTimeRemaining: number, // Time remaining according to server (ms)
  estimatedLatency: number // Estimated round-trip latency (ms)
): number {
  // Add half the latency to the timer (one-way delay)
  // This compensates for the delay in receiving the server time
  return serverTimeRemaining + (estimatedLatency / 2);
}

/**
 * Calculate safe pick submission time
 * 
 * Returns the latest time (in ms before deadline) when a pick should be submitted
 * to account for latency.
 */
export function calculateSafeSubmissionTime(
  timeRemaining: number, // Time remaining in ms
  estimatedLatency: number, // Estimated latency in ms
  buffer: number = 1000 // Safety buffer in ms (default 1 second)
): number {
  // Submit pick when this much time remains
  // Account for: round-trip latency + processing time + safety buffer
  return estimatedLatency + buffer;
}

// ============================================================================
// CLOCK SYNCHRONIZATION
// ============================================================================

/**
 * Calculate clock offset between client and server
 * 
 * Uses multiple measurements to account for network jitter.
 */
export async function calculateClockOffset(
  endpoint: string = '/api/health'
): Promise<number> {
  const measurements: Array<{ clientTime: number; serverTime: number; rtt: number }> = [];
  
  // Take multiple measurements
  for (let i = 0; i < 5; i++) {
    const clientSendTime = Date.now();
    const measurement = await measureLatency(endpoint);
    const clientReceiveTime = Date.now();
    
    if (measurement.serverTimestamp) {
      const rtt = measurement.rtt;
      const estimatedServerTime = measurement.serverTimestamp + (rtt / 2);
      const clientTime = clientSendTime + (rtt / 2);
      
      measurements.push({
        clientTime,
        serverTime: estimatedServerTime,
        rtt,
      });
    }
    
    // Small delay between measurements
    if (i < 4) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  if (measurements.length === 0) {
    return 0; // No offset if we can't measure
  }
  
  // Calculate offset (average difference)
  const offsets = measurements.map(m => m.serverTime - m.clientTime);
  const averageOffset = offsets.reduce((sum, offset) => sum + offset, 0) / offsets.length;
  
  return averageOffset;
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are declared inline above (export function/class)
