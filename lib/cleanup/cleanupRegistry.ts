/**
 * Centralized resource cleanup registry.
 *
 * Components register cleanup functions (intervals, listeners, connections)
 * and the registry ensures all are called on page unload or explicit shutdown.
 *
 * Prevents memory leaks from orphaned intervals, Firestore listeners,
 * and other long-lived resources.
 *
 * Standalone version — no external dependencies (uses console for logging).
 */

type CleanupFn = () => void | Promise<void>;

interface CleanupEntry {
  id: string;
  cleanup: CleanupFn;
  registeredAt: number;
  category: 'interval' | 'listener' | 'connection' | 'other';
}

class CleanupRegistry {
  private entries: Map<string, CleanupEntry> = new Map();
  private isShuttingDown = false;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor() {
    this.registerPageUnload();
  }

  /**
   * Register a cleanup function
   */
  register(id: string, cleanup: CleanupFn, category: CleanupEntry['category'] = 'other'): void {
    if (this.isShuttingDown) {
      console.warn('[CleanupRegistry] Cannot register cleanup during shutdown:', id);
      return;
    }

    this.entries.set(id, {
      id,
      cleanup,
      registeredAt: Date.now(),
      category,
    });
  }

  /**
   * Unregister a cleanup function
   */
  unregister(id: string): void {
    this.entries.delete(id);
  }

  /**
   * Execute all cleanup functions
   */
  async cleanupAll(): Promise<{ succeeded: number; failed: number; errors: Error[] }> {
    if (this.isShuttingDown) {
      return { succeeded: 0, failed: 0, errors: [] };
    }

    this.isShuttingDown = true;
    const errors: Error[] = [];
    let succeeded = 0;
    let failed = 0;

    // Execute cleanups in reverse registration order (LIFO)
    const entries = Array.from(this.entries.values()).reverse();

    for (const entry of entries) {
      try {
        await entry.cleanup();
        succeeded++;
      } catch (error) {
        failed++;
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(new Error(`Cleanup '${entry.id}' (${entry.category}) failed: ${err.message}`));
        console.error(`[CleanupRegistry] Cleanup failed: ${entry.id}`, err);
      }
    }

    this.entries.clear();
    this.isShuttingDown = false;

    if (errors.length > 0) {
      console.warn(`[CleanupRegistry] ${failed}/${succeeded + failed} cleanups failed`);
    }

    return { succeeded, failed, errors };
  }

  /**
   * Get count of registered cleanups
   */
  getRegisteredCount(): number {
    return this.entries.size;
  }

  /**
   * Get registered cleanup IDs (for debugging)
   */
  getRegisteredIds(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Register page unload handler
   */
  private registerPageUnload(): void {
    if (typeof window === 'undefined') return;

    this.beforeUnloadHandler = () => {
      // Use synchronous cleanup for beforeunload
      for (const entry of this.entries.values()) {
        try {
          const result = entry.cleanup();
          // Can't await in beforeunload, but try-catch prevents errors
          if (result instanceof Promise) {
            result.catch(() => {});
          }
        } catch {
          // Ignore errors during page unload
        }
      }
      this.entries.clear();
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  /**
   * Destroy the registry itself
   */
  destroy(): void {
    if (typeof window !== 'undefined' && this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    this.entries.clear();
  }
}

/** Global cleanup registry singleton */
export const cleanupRegistry = new CleanupRegistry();

export default CleanupRegistry;
