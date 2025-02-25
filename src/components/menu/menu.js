// src/components/menu/menu.js

import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import { withEvents, withLifecycle } from '../../core/compose/features'
import { withAPI } from './api'
import { withVisibility } from './features/visibility'
import { withItemsManager } from './features/items-manager'
import { withPositioning } from './features/positioning'
import { withKeyboardNavigation } from './features/keyboard-navigation'

/**
 * Creates a new Menu component
 * @param {Object} config - Menu configuration
 * @param {Array} [config.items] - Menu items
 * @param {string} [config.class] - Additional CSS classes
 * @param {HTMLElement} [config.target] - Target element for positioning
 * @param {boolean} [config.stayOpenOnSelect] - Whether to keep the menu open after an item is selected
 * @param {HTMLElement} [config.openingButton] - Button that opens the menu
 * @returns {Object} Menu component instance
 */
const createMenu = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'menu',
    prefix: PREFIX
  }

  return pipe(
    createBase,
    withEvents(),
    withElement({
      tag: 'div',
      componentName: 'menu',
      className: config.class,
      attrs: {
        role: 'menu',
        tabindex: '-1',
        'aria-hidden': 'true'
      }
    }),
    withLifecycle(),
    withItemsManager(baseConfig),
    withVisibility(baseConfig),
    withPositioning,
    withKeyboardNavigation(baseConfig),
    comp => withAPI({
      lifecycle: comp.lifecycle
    })(comp)
  )(baseConfig)
}

export default createMenu
