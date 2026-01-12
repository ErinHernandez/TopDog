/**
 * Draft State Manager
 * 
 * Centralized state management for draft rooms with validation and atomic updates.
 * Provides a structured approach to managing draft room state to prevent race conditions
 * and ensure consistency.
 * 
 * Usage:
 * ```javascript
 * const stateManager = new DraftStateManager({
 *   roomId: 'room123',
 *   onStateChange: (state) => console.log('State updated:', state)
 * });
 * 
 * // Update state atomically
 * await stateManager.updateRoom({ status: 'active' });
 * await stateManager.addPick(pick);
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Draft room state structure
 */
export class DraftState {
  constructor(initialState = {}) {
    this.room = initialState.room || null;
    this.participants = initialState.participants || [];
    this.picks = initialState.picks || [];
    this.draftOrder = initialState.draftOrder || [];
    this.draftSettings = initialState.draftSettings || {
      timerSeconds: 30,
      totalRounds: 18,
    };
    this.status = initialState.status || 'waiting';
    this.currentPickNumber = initialState.currentPickNumber || 1;
    this.timer = initialState.timer || 30;
    this.queue = initialState.queue || [];
    this.lastUpdated = initialState.lastUpdated || Date.now();
  }

  /**
   * Clone state for immutable updates
   */
  clone() {
    return new DraftState({
      room: this.room ? { ...this.room } : null,
      participants: [...this.participants],
      picks: [...this.picks],
      draftOrder: [...this.draftOrder],
      draftSettings: { ...this.draftSettings },
      status: this.status,
      currentPickNumber: this.currentPickNumber,
      timer: this.timer,
      queue: [...this.queue],
      lastUpdated: Date.now(),
    });
  }

  /**
   * Validate state consistency
   */
  validate() {
    const errors = [];

    // Validate pick numbers are sequential
    const sortedPicks = [...this.picks].sort((a, b) => a.pickNumber - b.pickNumber);
    for (let i = 0; i < sortedPicks.length; i++) {
      const expectedPickNumber = i + 1;
      const actualPickNumber = sortedPicks[i]?.pickNumber;
      if (actualPickNumber !== expectedPickNumber) {
        errors.push(`Pick number mismatch: expected ${expectedPickNumber}, got ${actualPickNumber}`);
      }
    }

    // Validate current pick number
    const expectedCurrentPick = this.picks.length + 1;
    if (this.currentPickNumber !== expectedCurrentPick && this.picks.length > 0) {
      errors.push(`Current pick number mismatch: expected ${expectedCurrentPick}, got ${this.currentPickNumber}`);
    }

    // Validate draft order matches participants
    if (this.draftOrder.length > 0 && this.participants.length > 0) {
      const orderSet = new Set(this.draftOrder);
      const participantsSet = new Set(this.participants);
      if (orderSet.size !== participantsSet.size || 
          ![...orderSet].every(p => participantsSet.has(p))) {
        errors.push('Draft order does not match participants');
      }
    }

    // Validate queue doesn't contain picked players
    const pickedPlayerNames = new Set(this.picks.map(p => p.player?.name || p.name));
    const queuePlayerNames = this.queue.map(q => q.name || q);
    const duplicateInQueue = queuePlayerNames.some(name => pickedPlayerNames.has(name));
    if (duplicateInQueue) {
      errors.push('Queue contains already picked players');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// STATE MANAGER
// ============================================================================

export class DraftStateManager {
  constructor(options = {}) {
    this.roomId = options.roomId;
    this.state = new DraftState(options.initialState);
    this.subscribers = new Set();
    this.updateQueue = [];
    this.isProcessing = false;
    this.onStateChange = options.onStateChange || null;
    this.validationEnabled = options.validationEnabled !== false; // Default true
  }

  /**
   * Get current state (clone to prevent mutations)
   */
  getState() {
    return this.state.clone();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify subscribers of state change
   */
  notifySubscribers() {
    const currentState = this.getState();
    this.subscribers.forEach(callback => {
      try {
        callback(currentState);
      } catch (error) {
        console.error('[DraftStateManager] Subscriber error:', error);
      }
    });

    if (this.onStateChange) {
      try {
        this.onStateChange(currentState);
      } catch (error) {
        console.error('[DraftStateManager] onStateChange error:', error);
      }
    }
  }

  /**
   * Update state atomically
   */
  async updateState(updater, options = {}) {
    const { validate = this.validationEnabled, skipNotify = false } = options;

    // Clone current state
    const newState = this.state.clone();

    // Apply update function
    if (typeof updater === 'function') {
      updater(newState);
    } else {
      // If updater is an object, merge it into state
      Object.assign(newState, updater);
    }

    // Validate state if enabled
    if (validate) {
      const validation = newState.validate();
      if (!validation.isValid) {
        console.warn('[DraftStateManager] State validation failed:', validation.errors);
        if (options.strictValidation) {
          throw new Error(`State validation failed: ${validation.errors.join(', ')}`);
        }
      }
    }

    // Update state
    this.state = newState;

    // Notify subscribers
    if (!skipNotify) {
      this.notifySubscribers();
    }

    return this.getState();
  }

  /**
   * Update room data
   */
  async updateRoom(roomData) {
    return this.updateState((state) => {
      state.room = { ...state.room, ...roomData };
      if (roomData.status !== undefined) {
        state.status = roomData.status;
      }
      if (roomData.participants !== undefined) {
        state.participants = [...roomData.participants];
      }
      if (roomData.draftOrder !== undefined) {
        state.draftOrder = [...roomData.draftOrder];
      }
      if (roomData.settings !== undefined) {
        state.draftSettings = { ...state.draftSettings, ...roomData.settings };
      }
    });
  }

  /**
   * Add a pick (validates pick number and player availability)
   */
  async addPick(pick, options = {}) {
    return this.updateState((state) => {
      // Validate pick number
      const expectedPickNumber = state.picks.length + 1;
      if (pick.pickNumber !== expectedPickNumber && !options.allowGap) {
        console.warn(
          `[DraftStateManager] Pick number mismatch: expected ${expectedPickNumber}, got ${pick.pickNumber}`
        );
      }

      // Add pick
      state.picks.push({ ...pick });
      state.currentPickNumber = expectedPickNumber + 1;

      // Remove player from queue if present
      if (pick.player?.name || pick.name) {
        const playerName = pick.player?.name || pick.name;
        state.queue = state.queue.filter(
          q => (q.name || q) !== playerName
        );
      }
    }, { strictValidation: options.strictValidation });
  }

  /**
   * Remove pick (for corrections)
   */
  async removePick(pickNumber) {
    return this.updateState((state) => {
      state.picks = state.picks.filter(p => p.pickNumber !== pickNumber);
      // Recalculate current pick number
      if (state.picks.length === 0) {
        state.currentPickNumber = 1;
      } else {
        const sortedPicks = [...state.picks].sort((a, b) => a.pickNumber - b.pickNumber);
        state.currentPickNumber = sortedPicks[sortedPicks.length - 1].pickNumber + 1;
      }
    });
  }

  /**
   * Update timer
   */
  async updateTimer(seconds) {
    return this.updateState((state) => {
      state.timer = Math.max(0, Math.floor(seconds));
    }, { skipNotify: true }); // Timer updates too frequently for notifications
  }

  /**
   * Update queue
   */
  async updateQueue(queue) {
    return this.updateState((state) => {
      // Validate queue doesn't contain picked players
      const pickedPlayerNames = new Set(state.picks.map(p => p.player?.name || p.name));
      state.queue = queue.filter(q => {
        const playerName = q.name || q;
        return !pickedPlayerNames.has(playerName);
      });
    });
  }

  /**
   * Add to queue
   */
  async addToQueue(player) {
    return this.updateState((state) => {
      const playerName = player.name || player;
      // Check if already picked
      const isPicked = state.picks.some(p => (p.player?.name || p.name) === playerName);
      if (!isPicked) {
        // Check if already in queue
        const isInQueue = state.queue.some(q => (q.name || q) === playerName);
        if (!isInQueue) {
          state.queue.push(player);
        }
      }
    });
  }

  /**
   * Remove from queue
   */
  async removeFromQueue(player) {
    return this.updateState((state) => {
      const playerName = player.name || player;
      state.queue = state.queue.filter(q => (q.name || q) !== playerName);
    });
  }

  /**
   * Clear all picks (for room reset)
   */
  async clearPicks() {
    return this.updateState((state) => {
      state.picks = [];
      state.currentPickNumber = 1;
      state.queue = []; // Clear queue when picks cleared
    });
  }

  /**
   * Calculate derived state (current picker, round, etc.)
   */
  getDerivedState() {
    const state = this.state;
    const totalRounds = state.draftSettings?.totalRounds || 18;
    const effectiveDraftOrder = state.draftOrder.length > 0 
      ? state.draftOrder 
      : state.participants;
    const totalPicks = totalRounds * effectiveDraftOrder.length;
    const currentPickNumber = state.currentPickNumber || state.picks.length + 1;
    const currentRound = Math.ceil(currentPickNumber / effectiveDraftOrder.length);
    const isSnakeRound = currentRound % 2 === 0;
    const pickIndex = (currentPickNumber - 1) % effectiveDraftOrder.length;
    const currentPicker = isSnakeRound
      ? effectiveDraftOrder[effectiveDraftOrder.length - 1 - pickIndex]
      : effectiveDraftOrder[pickIndex];

    return {
      currentPickNumber,
      currentRound,
      currentPicker,
      isSnakeRound,
      pickIndex,
      totalPicks,
      effectiveDraftOrder,
      isDraftActive: state.status === 'active',
      isDraftComplete: state.picks.length >= totalPicks,
      isOnTheClock: currentPickNumber === state.picks.length + 1,
    };
  }

  /**
   * Batch update multiple state changes atomically
   */
  async batchUpdate(updaters) {
    return this.updateState((state) => {
      updaters.forEach(updater => {
        if (typeof updater === 'function') {
          updater(state);
        } else {
          Object.assign(state, updater);
        }
      });
    });
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a state manager instance
 */
export function createDraftStateManager(options) {
  return new DraftStateManager(options);
}

/**
 * Validate draft state
 */
export function validateDraftState(state) {
  const draftState = state instanceof DraftState ? state : new DraftState(state);
  return draftState.validate();
}
