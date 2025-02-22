// src/components/snackbar/snackbar.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import { withActionButton, withDismissTimer } from './features'
import { withPosition } from './position'
import {
  withEvents,
  withText,
  withVariant,
  withLifecycle
} from '../../core/compose/features'
import { withAPI } from './api'
import { createSnackbarQueue } from './queue'
import { SNACKBAR_VARIANTS, SNACKBAR_POSITIONS } from './constants'

// Create a single queue instance to be shared across all snackbars
const queue = createSnackbarQueue()

/**
 * Creates a new Snackbar component
 * @param {Object} config - Snackbar configuration
 * @param {string} config.message - Message to display
 * @param {string} [config.action] - Action button text
 * @param {string} [config.variant='basic'] - Snackbar variant
 * @param {string} [config.position='center'] - Display position
 * @param {number} [config.duration=4000] - Display duration in ms
 * @param {string} [config.class] - Additional CSS classes
 */
const createSnackbar = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'snackbar',
    prefix: PREFIX,
    variant: config.variant || SNACKBAR_VARIANTS.BASIC,
    position: config.position || SNACKBAR_POSITIONS.CENTER,
    duration: config.duration ?? 4000 // Use nullish coalescing to allow 0
  }

  try {
    return pipe(
      createBase,
      withEvents(),
      withElement({
        tag: 'div',
        componentName: 'snackbar',
        className: config.class
      }),
      withVariant(baseConfig),
      withPosition(baseConfig),
      withText({
        ...baseConfig,
        text: config.message
      }),
      withActionButton(baseConfig),
      withLifecycle(),
      // First apply timer
      withDismissTimer(baseConfig),
      // Then apply API which needs timer
      comp => withAPI({
        lifecycle: comp.lifecycle,
        queue
      })(comp)
    )(baseConfig)
  } catch (error) {
    throw new Error(`Failed to create snackbar: ${error.message}`)
  }
}

export default createSnackbar
