/**
 * Timeout Manager for List Manager
 * Centralizes timeout handling and related state flags
 */

export interface TimeoutManagerState {
  justJumpedToPage: boolean;
  isPreloadingPages: boolean;
  isPageJumpLoad: boolean;
  isScrollJumpInProgress: boolean;
}

export interface TimeoutManagerTimeouts {
  pageJumpTimeout: number | null;
  scrollStopTimeout: NodeJS.Timeout | null;
  scrollJumpDebounceTimer: NodeJS.Timeout | null;
}

/**
 * Creates a timeout manager for handling various timeout operations
 * @returns Timeout manager functions and state
 */
export const createTimeoutManager = () => {
  // State flags
  const state: TimeoutManagerState = {
    justJumpedToPage: false,
    isPreloadingPages: false,
    isPageJumpLoad: false,
    isScrollJumpInProgress: false,
  };

  // Timeout references
  const timeouts: TimeoutManagerTimeouts = {
    pageJumpTimeout: null,
    scrollStopTimeout: null,
    scrollJumpDebounceTimer: null,
  };

  /**
   * Get current state flags
   */
  const getState = (): TimeoutManagerState => ({ ...state });

  /**
   * Get current timeouts
   */
  const getTimeouts = (): TimeoutManagerTimeouts => ({ ...timeouts });

  /**
   * Update state flags
   */
  const updateState = (updates: Partial<TimeoutManagerState>): void => {
    Object.assign(state, updates);
  };

  /**
   * Set a timeout with automatic cleanup
   */
  const setManagedTimeout = (
    key: keyof TimeoutManagerTimeouts,
    callback: () => void,
    delay: number
  ): void => {
    // Clear existing timeout
    if (timeouts[key] !== null) {
      clearManagedTimeout(key);
    }

    // Set new timeout
    timeouts[key] = window.setTimeout(() => {
      callback();
      timeouts[key] = null;
    }, delay) as any;
  };

  /**
   * Clear a specific timeout
   */
  const clearManagedTimeout = (key: keyof TimeoutManagerTimeouts): void => {
    if (timeouts[key] !== null) {
      window.clearTimeout(timeouts[key] as any);
      timeouts[key] = null;
    }
  };

  /**
   * Clear all timeouts
   */
  const clearAllTimeouts = (): void => {
    Object.keys(timeouts).forEach((key) => {
      clearManagedTimeout(key as keyof TimeoutManagerTimeouts);
    });
  };

  /**
   * Set page jump state with automatic reset
   */
  const setPageJumpState = (delay: number = 500): void => {
    state.justJumpedToPage = true;
    state.isPageJumpLoad = true;

    setManagedTimeout(
      "pageJumpTimeout",
      () => {
        state.justJumpedToPage = false;
        state.isPageJumpLoad = false;
      },
      delay
    );
  };

  /**
   * Set scroll jump state with automatic reset
   */
  const setScrollJumpState = (
    callback: () => void,
    delay: number = 200
  ): void => {
    state.isScrollJumpInProgress = true;

    setManagedTimeout(
      "scrollJumpDebounceTimer",
      () => {
        callback();
        state.isScrollJumpInProgress = false;
      },
      delay
    );
  };

  /**
   * Cleanup all timeouts and reset state
   */
  const cleanup = (): void => {
    clearAllTimeouts();
    Object.assign(state, {
      justJumpedToPage: false,
      isPreloadingPages: false,
      isPageJumpLoad: false,
      isScrollJumpInProgress: false,
    });
  };

  return {
    // State management
    getState,
    getTimeouts,
    updateState,

    // Timeout management
    setTimeout: setManagedTimeout,
    clearTimeout: clearManagedTimeout,
    clearAllTimeouts,

    // Convenience methods
    setPageJumpState,
    setScrollJumpState,

    // Cleanup
    cleanup,
  };
};
