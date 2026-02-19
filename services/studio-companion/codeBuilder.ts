/**
 * TopDog Studio — Code Builder Module
 *
 * Bridge between receiving code from the Studio and getting it into a running
 * native app. Handles the full build pipeline:
 *
 * iOS pipeline:
 *   1. Receive SwiftUI code string from Studio
 *   2. Write to TopDogViewer/Components/Generated_{componentId}.swift
 *   3. Run xcodebuild (incremental, ~2-5s for single file change)
 *   4. Install to running simulator: xcrun simctl install booted
 *   5. Launch/refresh: xcrun simctl launch --terminate-existing
 *   6. Wait for render (configurable delay)
 *   7. Return status to companion service
 *
 * Android pipeline:
 *   1. Receive Compose code string
 *   2. Write to TopDogViewer/app/src/main/java/Generated_{componentId}.kt
 *   3. Run ./gradlew installDebug (incremental)
 *   4. Launch activity via adb
 *   5. Return status
 *
 * Features:
 *   - Build caching (content hash → skip unchanged builds)
 *   - Incremental builds for fast iteration
 *   - Debounced builds to prevent rapid rebuilds
 *   - Structured error parsing from compilers
 *
 * @module services/studio-companion/codeBuilder
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
 * Supported build platforms
 */
export type BuildPlatform = 'ios' | 'android';

/**
 * Build request from the companion service
 */
export interface BuildRequest {
  /** Unique component identifier */
  readonly componentId: string;
  /** Language: 'swiftui' | 'compose' */
  readonly languageId: string;
  /** Source code to compile */
  readonly code: string;
  /** Target platform */
  readonly platform: BuildPlatform;
  /** Target device ID (simulator/emulator ID) */
  readonly deviceId: string;
}

/**
 * Structured build error
 */
export interface BuildError {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Build result
 */
export interface BuildResult {
  readonly success: boolean;
  readonly componentId: string;
  readonly languageId: string;
  readonly duration: number;
  readonly errors: readonly BuildError[];
}

/**
 * Configuration for the code builder
 */
export interface CodeBuilderConfig {
  /** Path to the iOS viewer project */
  readonly iosProjectPath: string;
  /** Path to the Android viewer project */
  readonly androidProjectPath: string;
  /** Render delay in ms after launching app (default: 500) */
  readonly renderDelay: number;
  /** Build timeout in ms (default: 60000) */
  readonly buildTimeout: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CODE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manages code compilation and deployment to native devices
 */
export class CodeBuilder {
  private config: CodeBuilderConfig;
  private buildCache: Map<string, string> = new Map(); // componentId → codeHash
  private buildInProgress: Map<string, boolean> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: Partial<CodeBuilderConfig>) {
    const basePath = path.resolve(__dirname, 'native');
    this.config = {
      iosProjectPath: config?.iosProjectPath ?? path.join(basePath, 'ios', 'TopDogViewer'),
      androidProjectPath: config?.androidProjectPath ?? path.join(basePath, 'android', 'TopDogViewer'),
      renderDelay: config?.renderDelay ?? 500,
      buildTimeout: config?.buildTimeout ?? 60000,
      ...config,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build and deploy a component to a native device.
   *
   * This is the main entry point called by the companion service
   * when an `inject-code` message is received.
   */
  async build(request: BuildRequest): Promise<BuildResult> {
    const startTime = Date.now();

    // Check build cache
    const codeHash = this.hashCode(request.code);
    if (this.buildCache.get(request.componentId) === codeHash) {
      return {
        success: true,
        componentId: request.componentId,
        languageId: request.languageId,
        duration: 0,
        errors: [],
      };
    }

    // Prevent concurrent builds for same component
    if (this.buildInProgress.get(request.componentId)) {
      return {
        success: false,
        componentId: request.componentId,
        languageId: request.languageId,
        duration: 0,
        errors: [{
          file: 'codeBuilder.ts',
          line: 0,
          column: 0,
          message: 'Build already in progress for this component',
          severity: 'error',
        }],
      };
    }

    this.buildInProgress.set(request.componentId, true);

    try {
      let result: BuildResult;

      switch (request.platform) {
        case 'ios':
          result = await this.buildIOS(request, startTime);
          break;
        case 'android':
          result = await this.buildAndroid(request, startTime);
          break;
        default:
          result = {
            success: false,
            componentId: request.componentId,
            languageId: request.languageId,
            duration: Date.now() - startTime,
            errors: [{
              file: 'codeBuilder.ts',
              line: 0,
              column: 0,
              message: `Unsupported platform: ${request.platform}`,
              severity: 'error',
            }],
          };
      }

      // Update cache on success
      if (result.success) {
        this.buildCache.set(request.componentId, codeHash);
      }

      return result;
    } finally {
      this.buildInProgress.delete(request.componentId);
    }
  }

  /**
   * Build with debouncing — for use during rapid code editing.
   * Waits for a pause in edits before triggering the build.
   */
  async buildDebounced(request: BuildRequest, debounceMs: number = 300): Promise<BuildResult> {
    return new Promise((resolve, reject) => {
      // Cancel previous pending build for this component
      const existing = this.debounceTimers.get(request.componentId);
      if (existing) {
        clearTimeout(existing);
      }

      const timer = setTimeout(async () => {
        this.debounceTimers.delete(request.componentId);
        try {
          const result = await this.build(request);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);

      this.debounceTimers.set(request.componentId, timer);
    });
  }

  /**
   * Clear build cache, forcing recompilation on next build
   */
  clearCache(componentId?: string): void {
    if (componentId) {
      this.buildCache.delete(componentId);
    } else {
      this.buildCache.clear();
    }
  }

  /**
   * Check if a build is currently in progress for a component
   */
  isBuildInProgress(componentId: string): boolean {
    return this.buildInProgress.get(componentId) === true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // iOS BUILD PIPELINE
  // ─────────────────────────────────────────────────────────────────────────

  private async buildIOS(request: BuildRequest, startTime: number): Promise<BuildResult> {
    const { componentId, languageId, code, deviceId } = request;

    // Step 1: Write source file
    const generatedDir = path.join(this.config.iosProjectPath, 'TopDogViewer', 'Generated');
    await fs.mkdir(generatedDir, { recursive: true });

    const sourceFile = path.join(generatedDir, `Generated_${componentId}.swift`);
    await fs.writeFile(sourceFile, code, 'utf-8');

    // Step 2: Build with xcodebuild (incremental)
    try {
      const buildResult = await this.runXcodeBuild();
      if (!buildResult.success) {
        return {
          success: false,
          componentId,
          languageId,
          duration: Date.now() - startTime,
          errors: buildResult.errors,
        };
      }
    } catch (error) {
      return {
        success: false,
        componentId,
        languageId,
        duration: Date.now() - startTime,
        errors: [{
          file: sourceFile,
          line: 0,
          column: 0,
          message: `Build failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        }],
      };
    }

    // Step 3: Install to simulator
    try {
      await this.installToSimulator(deviceId);
    } catch (error) {
      return {
        success: false,
        componentId,
        languageId,
        duration: Date.now() - startTime,
        errors: [{
          file: 'codeBuilder.ts',
          line: 0,
          column: 0,
          message: `Install failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        }],
      };
    }

    // Step 4: Launch app
    try {
      await this.launchOnSimulator(deviceId, componentId);
    } catch (error) {
      return {
        success: false,
        componentId,
        languageId,
        duration: Date.now() - startTime,
        errors: [{
          file: 'codeBuilder.ts',
          line: 0,
          column: 0,
          message: `Launch failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        }],
      };
    }

    // Step 5: Wait for render
    await this.delay(this.config.renderDelay);

    return {
      success: true,
      componentId,
      languageId,
      duration: Date.now() - startTime,
      errors: [],
    };
  }

  /**
   * Run xcodebuild for the iOS viewer project (incremental)
   */
  private async runXcodeBuild(): Promise<{ success: boolean; errors: BuildError[] }> {
    const projectPath = this.config.iosProjectPath;

    try {
      await execAsync(
        `cd "${projectPath}" && xcrun xcodebuild build ` +
        '-scheme TopDogViewer ' +
        '-sdk iphonesimulator ' +
        '-destination "generic/platform=iOS Simulator" ' +
        '-configuration Debug ' +
        'ONLY_ACTIVE_ARCH=YES ' +
        'BUILD_DIR="$(pwd)/build"',
        { timeout: this.config.buildTimeout },
      );

      return { success: true, errors: [] };
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr ?? '';
      return {
        success: false,
        errors: this.parseXcodeBuildErrors(stderr),
      };
    }
  }

  /**
   * Install the built app to a simulator
   */
  private async installToSimulator(deviceId: string): Promise<void> {
    const appPath = path.join(
      this.config.iosProjectPath,
      'build',
      'Build',
      'Products',
      'Debug-iphonesimulator',
      'TopDogViewer.app',
    );

    await execAsync(
      `xcrun simctl install "${deviceId}" "${appPath}"`,
      { timeout: 30000 },
    );
  }

  /**
   * Launch the viewer app on a simulator
   */
  private async launchOnSimulator(deviceId: string, componentId: string): Promise<void> {
    await execAsync(
      `xcrun simctl launch --terminate-existing "${deviceId}" com.topdog.viewer ` +
      `--componentId "${componentId}"`,
      { timeout: 10000 },
    );
  }

  /**
   * Parse xcodebuild error output into structured BuildError objects
   */
  private parseXcodeBuildErrors(stderr: string): BuildError[] {
    const errors: BuildError[] = [];
    const lines = stderr.split('\n');

    // xcodebuild error format: /path/to/file.swift:line:column: error: message
    const errorRegex = /^(.+?):(\d+):(\d+):\s*(error|warning):\s*(.+)$/;

    for (const line of lines) {
      const match = line.match(errorRegex);
      if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
        errors.push({
          file: path.basename(match[1]),
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          message: match[5],
          severity: match[4] as 'error' | 'warning',
        });
      }
    }

    // If no structured errors found, create a generic one from the full output
    if (errors.length === 0 && stderr.trim().length > 0) {
      errors.push({
        file: 'xcodebuild',
        line: 0,
        column: 0,
        message: stderr.trim().slice(0, 500),
        severity: 'error',
      });
    }

    return errors;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANDROID BUILD PIPELINE
  // ─────────────────────────────────────────────────────────────────────────

  private async buildAndroid(request: BuildRequest, startTime: number): Promise<BuildResult> {
    const { componentId, languageId, code, deviceId } = request;

    // Step 1: Write source file
    const generatedDir = path.join(
      this.config.androidProjectPath,
      'app',
      'src',
      'main',
      'java',
      'com',
      'topdog',
      'viewer',
      'generated',
    );
    await fs.mkdir(generatedDir, { recursive: true });

    const sourceFile = path.join(generatedDir, `Generated_${componentId}.kt`);
    await fs.writeFile(sourceFile, code, 'utf-8');

    // Step 2: Build with Gradle (incremental)
    try {
      const buildResult = await this.runGradleBuild();
      if (!buildResult.success) {
        return {
          success: false,
          componentId,
          languageId,
          duration: Date.now() - startTime,
          errors: buildResult.errors,
        };
      }
    } catch (error) {
      return {
        success: false,
        componentId,
        languageId,
        duration: Date.now() - startTime,
        errors: [{
          file: sourceFile,
          line: 0,
          column: 0,
          message: `Build failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        }],
      };
    }

    // Step 3: Install and launch
    try {
      await execAsync(
        `adb -s "${deviceId}" install -r ` +
        `"${path.join(this.config.androidProjectPath, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')}"`,
        { timeout: 30000 },
      );

      await execAsync(
        `adb -s "${deviceId}" shell am start -n ` +
        `com.topdog.viewer/.MainActivity --es componentId "${componentId}"`,
        { timeout: 10000 },
      );
    } catch (error) {
      return {
        success: false,
        componentId,
        languageId,
        duration: Date.now() - startTime,
        errors: [{
          file: 'codeBuilder.ts',
          line: 0,
          column: 0,
          message: `Deploy failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        }],
      };
    }

    // Step 4: Wait for render
    await this.delay(this.config.renderDelay);

    return {
      success: true,
      componentId,
      languageId,
      duration: Date.now() - startTime,
      errors: [],
    };
  }

  /**
   * Run Gradle build for the Android viewer project
   */
  private async runGradleBuild(): Promise<{ success: boolean; errors: BuildError[] }> {
    const projectPath = this.config.androidProjectPath;

    try {
      await execAsync(
        `cd "${projectPath}" && ./gradlew installDebug --daemon`,
        { timeout: this.config.buildTimeout },
      );

      return { success: true, errors: [] };
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr ?? '';
      return {
        success: false,
        errors: this.parseGradleErrors(stderr),
      };
    }
  }

  /**
   * Parse Gradle/kotlinc error output into structured errors
   */
  private parseGradleErrors(stderr: string): BuildError[] {
    const errors: BuildError[] = [];
    const lines = stderr.split('\n');

    // Kotlin compiler format: e: file.kt:line:column: message
    const errorRegex = /^([ew]):\s+(.+?):(\d+):(\d+):\s*(.+)$/;

    for (const line of lines) {
      const match = line.match(errorRegex);
      if (match && match[1] && match[2] && match[3] && match[4] && match[5]) {
        errors.push({
          file: path.basename(match[2]),
          line: parseInt(match[3], 10),
          column: parseInt(match[4], 10),
          message: match[5],
          severity: match[1] === 'e' ? 'error' : 'warning',
        });
      }
    }

    if (errors.length === 0 && stderr.trim().length > 0) {
      errors.push({
        file: 'gradlew',
        line: 0,
        column: 0,
        message: stderr.trim().slice(0, 500),
        severity: 'error',
      });
    }

    return errors;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Compute SHA-256 hash of code content for cache comparison
   */
  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Promise-based delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
