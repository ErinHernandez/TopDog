/**
 * TopDog Studio — Hot Reload Module
 *
 * Provides sub-second code update capabilities by bypassing the full
 * xcodebuild/Gradle pipeline. Uses platform-specific strategies:
 *
 * iOS strategy:
 *   - Compile individual components to .dylib via `swiftc -emit-library`
 *   - The viewer app loads libraries at runtime with dlopen()
 *   - On code change: compile new .dylib, notify viewer to reload
 *   - Latency target: < 1 second from code change to screen update
 *
 * Android strategy:
 *   - Use Kotlin Script engine for simple components
 *   - For complex components, use Apply Changes API via ADB
 *   - Latency target: < 2 seconds
 *
 * The hot reload module sits alongside the CodeBuilder and is used
 * when the Studio sends a `hot-reload` message (vs. `inject-code`
 * which triggers a full build).
 *
 * @module services/studio-companion/hotReload
 */

import { exec } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hot reload result
 */
export interface HotReloadResult {
  readonly success: boolean;
  readonly componentId: string;
  readonly duration: number;
  readonly message: string;
  /** True if fell back to full rebuild */
  readonly fallbackUsed: boolean;
}

/**
 * Configuration for hot reload
 */
export interface HotReloadConfig {
  /** Directory for storing compiled dylibs */
  readonly buildDir: string;
  /** Directory for generated source files */
  readonly generatedDir: string;
  /** iOS SDK path (auto-detected if not provided) */
  readonly iosSdkPath?: string;
  /** Debounce interval in ms (default: 150) */
  readonly debounceMs: number;
  /** Compilation timeout in ms (default: 10000) */
  readonly compileTimeout: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOT RELOAD MANAGER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages hot reload for native components
 */
export class HotReloadManager {
  private config: HotReloadConfig;
  private buildCache: Map<string, string> = new Map(); // componentId → codeHash
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private iosSdkPath: string | null = null;
  private compileInProgress: Set<string> = new Set();

  constructor(config?: Partial<HotReloadConfig>) {
    const basePath = path.resolve(__dirname, 'native');
    this.config = {
      buildDir: config?.buildDir ?? path.join(basePath, '.build', 'dylibs'),
      generatedDir: config?.generatedDir ?? path.join(basePath, '.build', 'generated'),
      iosSdkPath: config?.iosSdkPath,
      debounceMs: config?.debounceMs ?? 150,
      compileTimeout: config?.compileTimeout ?? 10000,
    };
  }

  /**
   * Initialize the hot reload manager (create directories, detect SDK)
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.config.buildDir, { recursive: true });
    await fs.mkdir(this.config.generatedDir, { recursive: true });

    if (!this.config.iosSdkPath) {
      this.iosSdkPath = await this.detectIOSSdkPath();
    } else {
      this.iosSdkPath = this.config.iosSdkPath;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // iOS HOT RELOAD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Hot-reload a SwiftUI component by compiling to .dylib
   *
   * Pipeline:
   *   1. Hash code to check cache
   *   2. Write source to temp file
   *   3. Compile with `swiftc -emit-library`
   *   4. Notify viewer app to dlopen the new library
   *
   * @param componentId Unique component identifier
   * @param code SwiftUI source code
   * @param notifyViewer Callback to notify the viewer app (via WebSocket)
   */
  async hotReloadIOS(
    componentId: string,
    code: string,
    notifyViewer: (dylibPath: string) => void,
  ): Promise<HotReloadResult> {
    const startTime = Date.now();

    // Check cache
    const codeHash = this.hashCode(code);
    if (this.buildCache.get(componentId) === codeHash) {
      return {
        success: true,
        componentId,
        duration: 0,
        message: 'No changes detected (cached)',
        fallbackUsed: false,
      };
    }

    // Prevent concurrent compiles for same component
    if (this.compileInProgress.has(componentId)) {
      return {
        success: false,
        componentId,
        duration: 0,
        message: 'Compilation already in progress',
        fallbackUsed: false,
      };
    }

    this.compileInProgress.add(componentId);

    try {
      // Write source file
      const sourceFile = path.join(
        this.config.generatedDir,
        `HotReload_${componentId}.swift`,
      );
      await fs.writeFile(sourceFile, this.wrapSwiftCode(componentId, code), 'utf-8');

      // Compile to .dylib
      const dylibPath = path.join(
        this.config.buildDir,
        `Component_${componentId}.dylib`,
      );
      const compileResult = await this.compileSwiftToDylib(sourceFile, dylibPath);

      if (!compileResult.success) {
        return {
          success: false,
          componentId,
          duration: Date.now() - startTime,
          message: compileResult.error ?? 'Compilation failed',
          fallbackUsed: false,
        };
      }

      // Update cache
      this.buildCache.set(componentId, codeHash);

      // Notify viewer to reload
      notifyViewer(dylibPath);

      return {
        success: true,
        componentId,
        duration: Date.now() - startTime,
        message: `Hot reload successful (${Date.now() - startTime}ms)`,
        fallbackUsed: false,
      };
    } finally {
      this.compileInProgress.delete(componentId);
    }
  }

  /**
   * Hot-reload with debouncing — used during rapid editing
   */
  async hotReloadIOSDebounced(
    componentId: string,
    code: string,
    notifyViewer: (dylibPath: string) => void,
  ): Promise<HotReloadResult> {
    return new Promise((resolve, reject) => {
      const existing = this.debounceTimers.get(componentId);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(async () => {
        this.debounceTimers.delete(componentId);
        try {
          const result = await this.hotReloadIOS(componentId, code, notifyViewer);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.config.debounceMs);

      this.debounceTimers.set(componentId, timer);
    });
  }

  /**
   * Compile a Swift source file to a dynamic library (.dylib)
   *
   * Uses `swiftc -emit-library` for fast incremental compilation.
   * The resulting .dylib can be loaded by the viewer app at runtime.
   */
  private async compileSwiftToDylib(
    sourceFile: string,
    outputPath: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.iosSdkPath) {
      return { success: false, error: 'iOS SDK path not available' };
    }

    const cmd = [
      'xcrun swiftc',
      '-emit-library',
      `-o "${outputPath}"`,
      '-module-name TopDogComponent',
      '-framework SwiftUI',
      `-sdk "${this.iosSdkPath}"`,
      '-target arm64-apple-ios17.0-simulator',
      // Optimization: skip debug info for faster compilation
      '-Onone',
      '-parse-as-library',
      `"${sourceFile}"`,
    ].join(' ');

    try {
      await execAsync(cmd, { timeout: this.config.compileTimeout });
      return { success: true };
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr ?? '';
      return {
        success: false,
        error: stderr.trim() || `swiftc exited with error`,
      };
    }
  }

  /**
   * Wrap user-provided SwiftUI code with the necessary boilerplate
   * for dynamic library loading.
   *
   * The wrapper:
   *   - Imports SwiftUI
   *   - Creates an @_cdecl exported function that returns an AnyView
   *   - This function is looked up by the viewer app via dlsym()
   */
  private wrapSwiftCode(componentId: string, code: string): string {
    const exportName = `createComponent_${componentId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    return `
import SwiftUI

// ─── User Component Code ───

${code}

// ─── Dynamic Library Entry Point ───
// This function is loaded by the viewer app via dlsym()

@_cdecl("${exportName}")
public func ${exportName}() -> UnsafeMutableRawPointer {
    let view = AnyView(TopDogComponent())
    let boxed = Unmanaged.passRetained(view as AnyObject)
    return boxed.toOpaque()
}
`.trimStart();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANDROID HOT RELOAD
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Hot-reload a Compose component using Apply Changes API
   *
   * Android strategy:
   *   1. Write updated code
   *   2. Use `adb shell cmd activity apply-changes` for quick swap
   *   3. Fall back to full rebuild if Apply Changes fails
   */
  async hotReloadAndroid(
    componentId: string,
    code: string,
    deviceId: string,
  ): Promise<HotReloadResult> {
    const startTime = Date.now();

    // Check cache
    const codeHash = this.hashCode(code);
    if (this.buildCache.get(componentId) === codeHash) {
      return {
        success: true,
        componentId,
        duration: 0,
        message: 'No changes detected (cached)',
        fallbackUsed: false,
      };
    }

    // Write source file
    const sourceFile = path.join(
      this.config.generatedDir,
      `HotReload_${componentId}.kt`,
    );
    await fs.writeFile(sourceFile, code, 'utf-8');

    // Try Apply Changes first (fast path)
    try {
      await execAsync(
        `adb -s "${deviceId}" shell cmd activity apply-changes`,
        { timeout: 5000 },
      );

      this.buildCache.set(componentId, codeHash);

      return {
        success: true,
        componentId,
        duration: Date.now() - startTime,
        message: `Hot reload via Apply Changes (${Date.now() - startTime}ms)`,
        fallbackUsed: false,
      };
    } catch {
      // Apply Changes failed — would need full rebuild (handled by CodeBuilder)
      return {
        success: false,
        componentId,
        duration: Date.now() - startTime,
        message: 'Apply Changes not available. Use full build instead.',
        fallbackUsed: true,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Detect the iOS Simulator SDK path
   */
  private async detectIOSSdkPath(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        'xcrun --sdk iphonesimulator --show-sdk-path',
        { timeout: 5000 },
      );
      return stdout.trim();
    } catch {
      console.warn('[HotReload] Could not detect iOS SDK path. Xcode may not be installed.');
      return null;
    }
  }

  /**
   * SHA-256 hash of code content
   */
  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Clear build cache
   */
  clearCache(componentId?: string): void {
    if (componentId) {
      this.buildCache.delete(componentId);
    } else {
      this.buildCache.clear();
    }
  }

  /**
   * Clean all build artifacts
   */
  async cleanBuildDirectory(): Promise<void> {
    await fs.rm(this.config.buildDir, { recursive: true, force: true });
    await fs.rm(this.config.generatedDir, { recursive: true, force: true });
    await fs.mkdir(this.config.buildDir, { recursive: true });
    await fs.mkdir(this.config.generatedDir, { recursive: true });
    this.buildCache.clear();
  }
}
