// src/components/snackbar/snackbar.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withActionButton, withCloseButton, withDismissTimer } from './features';
import { withPosition } from './position';
import {
  withEvents,
  withText,
  withLifecycle
} from '../../core/compose/features';
import { withAPI } from './api';
import { createSnackbarQueue } from './queue';
import { SnackbarConfig, SnackbarComponent, SnackbarQueue } from './types';
import {
  createBaseConfig,
  getElementConfig,
  getTextConfig,
  getApiConfig
} from './config';

// Create a single queue instance to be shared across all snackbars
const queue: SnackbarQueue = createSnackbarQueue();

/**
 * Creates a new Snackbar component
 * @param {SnackbarConfig} config - Snackbar configuration
 * @returns {SnackbarComponent} Snackbar component instance
 */
const createSnackbar = (config: SnackbarConfig): SnackbarComponent => {
  if (!config.message) {
    throw new Error('Snackbar message is required');
  }

  const baseConfig = createBaseConfig(config);

  try {
    const snackbar = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withPosition(baseConfig),
      withText(getTextConfig(baseConfig)),
      withActionButton(baseConfig),
      withCloseButton(baseConfig),
      withLifecycle(),
      withDismissTimer(baseConfig),
      comp => withAPI(getApiConfig(comp, queue, baseConfig))(comp)
    )(baseConfig);

    return snackbar as SnackbarComponent;
  } catch (error) {
    console.error('Snackbar creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create snackbar: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Dismisses the snackbar on screen and drops the ones still waiting.
 *
 * Messages belong to the thing that raised them: a drawer that closes, an
 * account that signs out. Without this the queue outlives them, so a message
 * about a list nobody is looking at any more stays on screen, and, because the
 * queue shows one at a time, the next message waits behind it.
 */
export const clearSnackbars = (): void => queue.clear();

export default createSnackbar;
