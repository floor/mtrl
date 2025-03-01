// src/components/snackbar/queue.ts
import { QueuedSnackbar, SnackbarQueue } from './types';

/**
 * Creates a queue manager for snackbars
 * Ensures only one snackbar is visible at a time
 * @returns {SnackbarQueue} Queue manager with add/clear methods
 */
export const createSnackbarQueue = (): SnackbarQueue => {
  const queue: QueuedSnackbar[] = [];
  let isProcessing = false;

  const processQueue = (): void => {
    if (queue.length === 0) {
      isProcessing = false;
      return;
    }

    isProcessing = true;
    const snackbar = queue[0];

    const handleDismiss = (): void => {
      // Remove from queue
      queue.shift();
      // Remove listener and cleanup
      snackbar.off?.('dismiss', handleDismiss);
      // Reset processing state if queue is empty
      if (queue.length === 0) {
        isProcessing = false;
      } else {
        // Process next after a small delay
        setTimeout(processQueue, 200);
      }
    };

    // Handle both normal dismiss and action button dismissal
    snackbar.on?.('dismiss', handleDismiss);
    snackbar._show();
  };

  return {
    /**
     * Adds a snackbar to the queue
     * @param {QueuedSnackbar} snackbar - Snackbar instance with _show method
     */
    add(snackbar: QueuedSnackbar): void {
      if (!snackbar._show) {
        throw new Error('Snackbar must implement _show method');
      }

      queue.push(snackbar);

      // Only start processing if not already processing
      if (!isProcessing) {
        processQueue();
      }
    },

    /**
     * Clears all pending snackbars
     */
    clear(): void {
      // Remove all queued items
      queue.length = 0;
      isProcessing = false;
    },

    /**
     * Gets current queue length
     * @returns {number} Number of snackbars in queue
     */
    getLength(): number {
      return queue.length;
    }
  };
};