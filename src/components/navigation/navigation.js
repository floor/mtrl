// src/components/navigation/index.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import {
  withEvents,
  withDisabled,
  withLifecycle,
  withVariant,
  withPosition // Import core position feature
} from '../../core/compose/features'
import { withAPI } from './api'
import { withNavItems } from './features/items'

/**
 * Creates a new Navigation component
 * @param {Object} config - Navigation configuration
 * @param {string} [config.variant='rail'] - Navigation type (rail/drawer/bar)
 * @param {string} [config.position='left'] - Navigation position
 * @param {Array} [config.items=[]] - Navigation items
 * @param {boolean} [config.disabled=false] - Is navigation disabled
 * @param {string} [config.class] - Additional CSS classes
 */
const createNavigation = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'nav',
    prefix: PREFIX
  }

  return pipe(
    createBase,
    // First add events system
    withEvents(),
    // Then add the element and other features
    withElement({
      tag: 'nav',
      role: 'navigation',
      'aria-label': config.ariaLabel || 'Main Navigation',
      componentName: 'nav',
      className: config.class
    }),
    withVariant(baseConfig),
    withPosition(baseConfig),
    withNavItems(baseConfig),
    withDisabled(),
    withLifecycle(),
    comp => withAPI({
      disabled: comp.disabled,
      lifecycle: comp.lifecycle
    })(comp)
  )(baseConfig)
}

export default createNavigation
