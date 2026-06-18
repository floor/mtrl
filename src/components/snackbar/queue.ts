// src/components/snackbar/queue.ts
import {
  QueuedSnackbar,
  SnackbarQueue,
  SnackbarQueueAddOptions
} from './types';
import { SNACKBAR_DEFAULTS, SNACKBAR_QUEUE_BEHAVIORS } from './constants';

/**
 * Creates a queue manager for snackbars
 *
 * Ensures only one snackbar is visible at a time. Supports two behaviors when
 * a new snackbar is added (see {@link SnackbarQueueAddOptions}):
 * - `'queue'` (default): the snackbar waits its turn and is shown in order.
 * - `'replace'`: the snackbar evicts whatever is currently on screen, drops any
 *   still-pending snackbars, and shows immediately. This keeps rapid, repeated
 *   actions snappy instead of serializing a long backlog.
 *
 * @param {number} gap - Delay in ms between a dismissed snackbar and the next
 * @returns {SnackbarQueue} Queue manager with add/clear methods
 */
export const createSnackbarQueue = (
  gap: number = SNACKBAR_DEFAULTS.QUEUE_GAP
): SnackbarQueue => {
  const pending: QueuedSnackbar[] = [];
  let current: QueuedSnackbar | null = null;
  let currentDismiss: (() => void) | null = null;
  let advanceTimer: ReturnType<typeof setTimeout> | null = null;

  const clearAdvanceTimer = (): void => {
    if (advanceTimer !== null) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
  };

  /**
   * Detaches the active snackbar's dismiss listener without advancing the
   * queue. Used both on natural dismissal and on replace-eviction.
   */
  const releaseCurrent = (): void => {
    if (current && currentDismiss) {
      current.off?.('dismiss', currentDismiss);
    }
    current = null;
    currentDismiss = null;
  };

  const showNext = (): void => {
    clearAdvanceTimer();
    if (current || pending.length === 0) return;

    const snackbar = pending.shift() as QueuedSnackbar;
    current = snackbar;

    const handleDismiss = (): void => {
      releaseCurrent();
      // Process the next one after a small gap for visual separation.
      if (pending.length > 0) {
        advanceTimer = setTimeout(() => {
          advanceTimer = null;
          showNext();
        }, gap);
      }
    };

    currentDismiss = handleDismiss;
    snackbar.on?.('dismiss', handleDismiss);
    snackbar._show();
  };

  return {
    /**
     * Adds a snackbar to the queue
     * @param {QueuedSnackbar} snackbar - Snackbar instance with _show method
     * @param {SnackbarQueueAddOptions} [options] - Queue behavior options
     */
    add(snackbar: QueuedSnackbar, options: SnackbarQueueAddOptions = {}): void {
      if (!snackbar._show) {
        throw new Error('Snackbar must implement _show method');
      }

      const behavior = options.behavior ?? SNACKBAR_QUEUE_BEHAVIORS.QUEUE;

      if (behavior === SNACKBAR_QUEUE_BEHAVIORS.REPLACE) {
        // Drop everything still waiting and evict whatever is on screen, then
        // show this one immediately (no inter-snackbar gap).
        pending.length = 0;
        clearAdvanceTimer();
        if (current) {
          current._hide?.();
          releaseCurrent();
        }
        pending.push(snackbar);
        showNext();
        return;
      }

      pending.push(snackbar);
      if (!current) {
        showNext();
      }
    },

    /**
     * Clears all pending snackbars and dismisses the active one
     */
    clear(): void {
      pending.length = 0;
      clearAdvanceTimer();
      if (current) {
        current._hide?.();
        releaseCurrent();
      }
    },

    /**
     * Gets the current queue length, including the snackbar on screen
     * @returns {number} Number of snackbars queued or visible
     */
    getLength(): number {
      return pending.length + (current ? 1 : 0);
    }
  };
};
