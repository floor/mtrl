// src/components/container/container.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import { withEvents, withLifecycle } from '../../core/compose/features'
import { withAPI } from './api'

/**
 * Creates a new Container component
 * @param {Object} config - Container configuration
 * @param {string} [config.variant] - Visual variant
 * @param {number} [config.elevation] - Elevation level
 * @param {string} [config.class] - Additional CSS classes
 */
const createContainer = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'container',
    prefix: PREFIX
  }

  try {
    return pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'container',
        className: [
          config.variant && `${PREFIX}-container--${config.variant}`,
          config.elevation && `${PREFIX}-container--elevation-${config.elevation}`,
          config.class
        ]
      }),
      withEvents(),
      withLifecycle(),
      comp => withAPI({
        lifecycle: comp.lifecycle
      })(comp)
    )(baseConfig)
  } catch (error) {
    throw new Error(`Failed to create container: ${error.message}`)
  }
}

export default createContainer
