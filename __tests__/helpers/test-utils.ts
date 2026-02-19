/**
 * Common test utilities for TopDog Studio
 */

/**
 * Tolerance comparison for floating-point math
 */
export function expectCloseTo(actual: number, expected: number, tolerance: number = 0.001): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `Expected ${actual} to be close to ${expected} (tolerance: ${tolerance}), ` +
      `but difference was ${Math.abs(actual - expected)}`
    );
  }
}

/**
 * Assert array contents are equal within tolerance
 */
export function expectArrayCloseTo(
  actual: number[] | Uint8ClampedArray,
  expected: number[] | Uint8ClampedArray,
  tolerance: number = 1
): void {
  if (actual.length !== expected.length) {
    throw new Error(`Array length mismatch: ${actual.length} vs ${expected.length}`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (Math.abs(actual[i] - expected[i]) > tolerance) {
      throw new Error(
        `Array mismatch at index ${i}: ${actual[i]} vs ${expected[i]} (tolerance: ${tolerance})`
      );
    }
  }
}

/**
 * Create a simple timer for performance testing
 */
export function createTimer(): { elapsed: () => number } {
  const start = performance.now();
  return {
    elapsed: () => performance.now() - start,
  };
}

/**
 * Wait for async operations to settle
 */
export function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Generate a random string for unique test IDs
 */
export function randomTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a test pixel buffer with known values
 * Each pixel has [R, G, B, A] at index (y * width + x) * 4
 */
export function createPixelBuffer(
  width: number,
  height: number,
  fillFn?: (x: number, y: number) => [number, number, number, number]
): Uint8ClampedArray {
  const buffer = new Uint8ClampedArray(width * height * 4);
  const fill = fillFn || (() => [0, 0, 0, 255] as [number, number, number, number]);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const [r, g, b, a] = fill(x, y);
      buffer[i] = r;
      buffer[i + 1] = g;
      buffer[i + 2] = b;
      buffer[i + 3] = a;
    }
  }

  return buffer;
}

/**
 * Get pixel value at specific coordinate from buffer
 */
export function getPixel(
  buffer: Uint8ClampedArray,
  width: number,
  x: number,
  y: number
): [number, number, number, number] {
  const i = (y * width + x) * 4;
  return [buffer[i], buffer[i + 1], buffer[i + 2], buffer[i + 3]];
}

/**
 * Count non-zero pixels in an alpha channel buffer
 */
export function countSelectedPixels(selectionData: Uint8ClampedArray): number {
  let count = 0;
  for (let i = 0; i < selectionData.length; i++) {
    if (selectionData[i] > 0) count++;
  }
  return count;
}

/**
 * Count fully selected pixels (value = 255) in selection data
 */
export function countFullySelectedPixels(selectionData: Uint8ClampedArray): number {
  let count = 0;
  for (let i = 0; i < selectionData.length; i++) {
    if (selectionData[i] === 255) count++;
  }
  return count;
}

/**
 * Assert that execution completes within time limit (ms)
 */
export async function assertPerformance(
  fn: () => void | Promise<void>,
  maxMs: number,
  label: string = 'operation'
): Promise<number> {
  const start = performance.now();
  await fn();
  const elapsed = performance.now() - start;
  if (elapsed > maxMs) {
    throw new Error(`${label} took ${elapsed.toFixed(1)}ms, exceeding limit of ${maxMs}ms`);
  }
  return elapsed;
}
