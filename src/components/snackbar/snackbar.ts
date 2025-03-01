// src/components/snackbar/snackbar.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withActionButton, withDismissTimer } from './features';
import { withPosition } from './position';
import {
  withEvents,
  withText,
  withVariant,
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
      withVariant(baseConfig),
      withPosition(baseConfig),
      withText(getTextConfig(baseConfig)),
      withActionButton(baseConfig),
      withLifecycle(),
      // First apply timer
      withDismissTimer(baseConfig),
      // Then apply API which needs timer
      comp => withAPI(getApiConfig(comp, queue))(comp)
    )(baseConfig);

    return snackbar as SnackbarComponent;
  } catch (error) {
    console.error('Snackbar creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create snackbar: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createSnackbar;