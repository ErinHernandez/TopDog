/**
 * TopDog Studio Companion — Device Discovery
 *
 * Enumerates running iOS Simulators and Android Emulators on the developer's
 * machine. Called when the Studio client sends a `list-devices` message.
 *
 * Discovery sources:
 * - iOS:     `xcrun simctl list devices --json`
 * - Android: `adb devices -l`
 *
 * Both commands are run in parallel. If one fails (e.g. no Xcode installed),
 * the other still returns results. If both fail, an empty array is returned.
 *
 * @module services/studio-companion/deviceDiscovery
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface DeviceInfo {
  readonly id: string;
  readonly name: string;
  readonly platform: 'ios' | 'android' | 'web';
  readonly osVersion: string;
  readonly isRunning: boolean;
  /** Whether this is a physical device (vs. simulator/emulator) */
  readonly isPhysical: boolean;
  /** Connection type for physical devices */
  readonly connectionType?: 'usb' | 'wifi' | 'simulator' | 'emulator';
}

// ─────────────────────────────────────────────────────────────────────────────
// simctl JSON types (subset of what `xcrun simctl list devices --json` returns)
// ─────────────────────────────────────────────────────────────────────────────

interface SimctlDevice {
  readonly udid: string;
  readonly name: string;
  readonly state: string;            // "Booted" | "Shutdown" | ...
  readonly isAvailable: boolean;
  readonly deviceTypeIdentifier?: string;
}

interface SimctlOutput {
  readonly devices: Record<string, SimctlDevice[]>;
  // Key format: "com.apple.CoreSimulator.SimRuntime.iOS-17-0"
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DISCOVERY FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discover all iOS Simulators and Android Emulators.
 *
 * Runs both discovery commands in parallel. Failures are caught silently —
 * a developer with only Xcode will still see iOS devices even if `adb` is
 * missing, and vice versa.
 *
 * @returns Combined array of all discovered devices, sorted by:
 *          1. Running devices first
 *          2. Platform (ios, android)
 *          3. Name alphabetically
 */
export async function discoverDevices(): Promise<readonly DeviceInfo[]> {
  const [iosDevices, androidDevices, physicalIOSDevices] = await Promise.all([
    discoverIOSDevices().catch(() => [] as DeviceInfo[]),
    discoverAndroidDevices().catch(() => [] as DeviceInfo[]),
    discoverPhysicalIOSDevices().catch(() => [] as DeviceInfo[]),
  ]);

  const all = [...iosDevices, ...androidDevices, ...physicalIOSDevices];

  // Sort: running first, then by platform, then by name
  return all.sort((a, b) => {
    // Running devices first
    if (a.isRunning !== b.isRunning) return a.isRunning ? -1 : 1;
    // Then by platform
    if (a.platform !== b.platform) return a.platform.localeCompare(b.platform);
    // Then by name
    return a.name.localeCompare(b.name);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// iOS SIMULATOR DISCOVERY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discover iOS Simulators via `xcrun simctl list devices --json`.
 *
 * Parses the JSON output which groups devices by runtime:
 *   { devices: { "com.apple.CoreSimulator.SimRuntime.iOS-17-0": [...] } }
 *
 * We extract the OS version from the runtime key and flatten into DeviceInfo[].
 * Only available (non-broken) devices are returned.
 */
async function discoverIOSDevices(): Promise<DeviceInfo[]> {
  const { stdout } = await execFileAsync('xcrun', [
    'simctl', 'list', 'devices', '--json',
  ], {
    timeout: 10_000,
  });

  const parsed: SimctlOutput = JSON.parse(stdout);
  const devices: DeviceInfo[] = [];

  for (const [runtimeKey, runtimeDevices] of Object.entries(parsed.devices)) {
    // Extract OS version from runtime key
    // e.g. "com.apple.CoreSimulator.SimRuntime.iOS-17-0" → "17.0"
    const osVersion = extractIOSVersion(runtimeKey);

    for (const device of runtimeDevices) {
      if (!device.isAvailable) continue;

      devices.push({
        id: device.udid,
        name: device.name,
        platform: 'ios',
        osVersion,
        isRunning: device.state === 'Booted',
        isPhysical: false,
        connectionType: 'simulator',
      });
    }
  }

  return devices;
}

/**
 * Extract iOS version from a simctl runtime key.
 *
 * Input:  "com.apple.CoreSimulator.SimRuntime.iOS-17-0"
 * Output: "17.0"
 *
 * Input:  "com.apple.CoreSimulator.SimRuntime.iOS-16-4"
 * Output: "16.4"
 *
 * Falls back to "unknown" if the format doesn't match or version parts are invalid.
 */
function extractIOSVersion(runtimeKey: string): string {
  // Match "iOS-17-0", "iOS-16-4", "tvOS-17-0", "watchOS-10-0", etc.
  const match = runtimeKey.match(/(?:iOS|tvOS|watchOS|visionOS)-(\d+)-(\d+)/);
  if (match) {
    const major = Number(match[1]);
    const minor = Number(match[2]);
    // Validate that both parts are valid finite numbers
    if (Number.isFinite(major) && Number.isFinite(minor)) {
      return `${major}.${minor}`;
    }
  }
  return 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// ANDROID EMULATOR DISCOVERY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discover Android Emulators via `adb devices -l`.
 *
 * Output format:
 *   List of devices attached
 *   emulator-5554          device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 transport_id:1
 *   emulator-5556          offline
 *
 * We parse each line to extract the serial, status, and model name.
 * Only "device" status entries are considered running.
 */
async function discoverAndroidDevices(): Promise<DeviceInfo[]> {
  const { stdout } = await execFileAsync('adb', ['devices', '-l'], {
    timeout: 10_000,
  });

  const devices: DeviceInfo[] = [];
  const lines = stdout.split('\n');

  for (const line of lines) {
    // Skip header and empty lines
    if (line.startsWith('List of') || line.trim() === '') continue;

    const parsed = parseAdbDeviceLine(line);
    if (parsed) {
      devices.push(parsed);
    }
  }

  // For running emulators, try to get the Android version
  // Wrap each device query in a 5-second timeout to prevent one slow device from blocking all discovery
  const enriched = await Promise.all(
    devices.map(async (device) => {
      if (device.isRunning && device.osVersion === 'unknown') {
        try {
          const version = await Promise.race([
            getAndroidVersion(device.id),
            new Promise<never>((_, rej) =>
              setTimeout(() => rej(new Error('Device query timeout')), 5000),
            ),
          ]);
          return { ...device, osVersion: version };
        } catch {
          // Timeout or query failed; keep osVersion as 'unknown'
          return device;
        }
      }
      return device;
    }),
  );

  return enriched;
}

/**
 * Parse a single line from `adb devices -l` output.
 *
 * Example lines:
 *   "emulator-5554          device product:sdk_gphone64_arm64 model:Pixel_8 transport_id:1"
 *   "emulator-5556          offline"
 *   "192.168.1.100:5555     device product:flame model:Pixel_4 transport_id:3"
 */
function parseAdbDeviceLine(line: string): DeviceInfo | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Split on first whitespace group only to properly extract serial and status
  // This prevents issues if device name/model contains spaces
  const match = trimmed.match(/^(\S+)\s+(\S+)\s*(.*)/);
  if (!match || !match[1] || !match[2]) return null;

  const serial = match[1];
  const status = match[2];
  const remainder = match[3] || '';

  // Only include actual devices/emulators (skip "unauthorized", etc.)
  const isRunning = status === 'device';
  const isEmulator = serial.startsWith('emulator-');

  // Extract model from "model:Pixel_8" if present
  const modelMatch = trimmed.match(/model:(\S+)/);
  const model = modelMatch && modelMatch[1]
    ? modelMatch[1].replace(/_/g, ' ')
    : (isEmulator ? `Android Emulator (${serial})` : serial);

  // Determine connection type
  const isNetworkDevice = serial.includes(':');
  const connectionType = isEmulator
    ? 'emulator' as const
    : (isNetworkDevice ? 'wifi' as const : 'usb' as const);

  return {
    id: serial,
    name: model,
    platform: 'android',
    osVersion: 'unknown', // Will be enriched later for running devices
    isRunning,
    isPhysical: !isEmulator,
    connectionType,
  };
}

/**
 * Get the Android version from a running device/emulator.
 * Uses `adb shell getprop ro.build.version.release`.
 *
 * @returns Version string (e.g. "14") or "unknown" on failure
 */
async function getAndroidVersion(deviceId: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('adb', [
      '-s', deviceId,
      'shell', 'getprop', 'ro.build.version.release',
    ], {
      timeout: 5_000,
    });
    const version = stdout.trim();
    return version || 'unknown';
  } catch {
    return 'unknown';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICAL iOS DEVICE DISCOVERY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interface for xcrun devicectl JSON output (Xcode 15+)
 */
interface DeviceCtlDevice {
  readonly identifier: string;
  readonly deviceProperties: {
    readonly name: string;
    readonly osVersionNumber: string;
  };
  readonly connectionProperties: {
    readonly transportType: string; // "wired" | "network"
  };
  readonly hardwareProperties: {
    readonly platform: string; // "iOS" | "iPadOS" | "watchOS" | etc.
  };
}

interface DeviceCtlOutput {
  readonly result: {
    readonly devices: DeviceCtlDevice[];
  };
}

/**
 * Discover physical iOS devices via `xcrun devicectl list devices`.
 *
 * Requires Xcode 15+ which provides the `devicectl` command.
 * Falls back gracefully if Xcode 15 is not installed.
 *
 * Physical devices require:
 *   - Apple Developer Program membership for code signing
 *   - Device paired via USB or on the same Wi-Fi network
 *   - Developer Mode enabled on the device (iOS 16+)
 */
async function discoverPhysicalIOSDevices(): Promise<DeviceInfo[]> {
  try {
    const { stdout } = await execFileAsync('xcrun', [
      'devicectl', 'list', 'devices', '--json-output', '-',
    ], {
      timeout: 10_000,
    });

    const parsed: DeviceCtlOutput = JSON.parse(stdout);
    const devices: DeviceInfo[] = [];

    for (const device of parsed.result.devices) {
      // Only include iOS/iPadOS devices
      const platform = device.hardwareProperties.platform.toLowerCase();
      if (platform !== 'ios' && platform !== 'ipados') continue;

      const connectionType = device.connectionProperties.transportType === 'wired'
        ? 'usb' as const
        : 'wifi' as const;

      devices.push({
        id: device.identifier,
        name: device.deviceProperties.name,
        platform: 'ios',
        osVersion: device.deviceProperties.osVersionNumber,
        isRunning: true, // Physical devices listed by devicectl are always available
        isPhysical: true,
        connectionType,
      });
    }

    return devices;
  } catch {
    // devicectl not available (pre-Xcode 15) — try legacy approach
    return discoverPhysicalIOSDevicesLegacy();
  }
}

/**
 * Legacy physical iOS device discovery via `instruments -s devices`.
 * Used when xcrun devicectl is not available (pre-Xcode 15).
 *
 * Output format:
 *   John's iPhone (17.2) [00008110-000A1234ABCD5678]
 */
async function discoverPhysicalIOSDevicesLegacy(): Promise<DeviceInfo[]> {
  try {
    const { stdout } = await execFileAsync('xcrun', [
      'xctrace', 'list', 'devices',
    ], {
      timeout: 10_000,
    });

    const devices: DeviceInfo[] = [];
    const lines = stdout.split('\n');

    // Format: DeviceName (OSVersion) [UDID]
    const deviceRegex = /^(.+?)\s+\((\d+\.\d+(?:\.\d+)?)\)\s+\[([A-Fa-f0-9-]+)\]/;

    for (const line of lines) {
      const match = line.trim().match(deviceRegex);
      if (!match || !match[1] || !match[2] || !match[3]) continue;

      const name = match[1].trim();
      const osVersion = match[2];
      const udid = match[3];

      // Skip simulators (they have "(Simulator)" in the name)
      if (name.includes('Simulator')) continue;

      devices.push({
        id: udid,
        name,
        platform: 'ios',
        osVersion,
        isRunning: true,
        isPhysical: true,
        connectionType: 'usb', // Legacy approach only sees USB devices
      });
    }

    return devices;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHYSICAL iOS DEVICE CAPTURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Capture a screenshot from a physical iOS device.
 *
 * Uses `xcrun devicectl device capture screenshot` (Xcode 15+).
 * Falls back to `idevicescreenshot` from libimobiledevice if available.
 *
 * @param deviceId The UDID of the physical device
 * @param outputPath Path to save the screenshot
 * @returns Whether the capture was successful
 */
export async function capturePhysicalIOSDevice(
  deviceId: string,
  outputPath: string,
): Promise<boolean> {
  // Try devicectl first (Xcode 15+)
  try {
    await execFileAsync('xcrun', [
      'devicectl', 'device', 'capture', 'screenshot',
      '--device', deviceId,
      '--output', outputPath,
    ], {
      timeout: 10_000,
    });
    return true;
  } catch {
    // Fall back to idevicescreenshot
  }

  // Try idevicescreenshot (libimobiledevice)
  try {
    await execFileAsync('idevicescreenshot', [
      '-u', deviceId,
      outputPath,
    ], {
      timeout: 10_000,
    });
    return true;
  } catch {
    return false;
  }
}
