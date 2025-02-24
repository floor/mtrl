// src/components/menu/menu.js

import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import { withAPI } from './api'
import {
  withEvents,
  withLifecycle
} from '../../core/compose/features'

/**
 * Menu item type definition
 * @typedef {Object} MenuItem
 * @property {string} [name] - Item identifier
 * @property {string} [text] - Display text
 * @property {string} [class] - Additional CSS classes
 * @property {boolean} [disabled] - Whether item is disabled
 * @property {MenuItem[]} [items] - Submenu items
 */

/**
 * Creates a menu item element
 * @param {MenuItem} itemConfig - Item configuration
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Menu item element
 */
const createMenuItem = (itemConfig, prefix) => {
  const item = document.createElement('li')
  item.className = `${prefix}-menu-item`

  if (itemConfig.type === 'divider') {
    item.className = `${prefix}-menu-divider`
    return item
  }

  if (itemConfig.class) {
    item.className += ` ${itemConfig.class}`
  }

  if (itemConfig.disabled) {
    item.setAttribute('aria-disabled', 'true')
    item.className += ` ${prefix}-menu-item--disabled`
  }

  if (itemConfig.name) {
    item.setAttribute('data-name', itemConfig.name)
  }

  item.textContent = itemConfig.text || ''

  if (itemConfig.items?.length) {
    item.className += ` ${prefix}-menu-item--submenu`
    item.setAttribute('aria-haspopup', 'true')
    item.setAttribute('aria-expanded', 'false')
  }

  return item
}

/**
 * Adds menu items management to component
 */
const withMenuItems = (config) => (component) => {
  const submenus = new Map()
  let activeSubmenu = null

  // Create items container
  const list = document.createElement('ul')
  list.className = `${config.prefix}-menu-list`
  list.setAttribute('role', 'menu')
  component.element.appendChild(list)

  // Handle item clicks
  list.addEventListener('click', (event) => {
    const item = event.target.closest(`.${config.prefix}-menu-item`)
    if (!item || item.getAttribute('aria-disabled') === 'true') return

    const name = item.getAttribute('data-name')
    if (name) {
      component.emit('select', { name, text: item.textContent })
    }
  })

  // Handle submenu hover
  let hoverTimeout = null
  list.addEventListener('mouseenter', (event) => {
    const item = event.target.closest(`.${config.prefix}-menu-item--submenu`)
    if (!item) return

    clearTimeout(hoverTimeout)
    hoverTimeout = setTimeout(() => {
      const name = item.getAttribute('data-name')
      const itemConfig = config.items?.find(i => i.name === name)
      if (!itemConfig?.items) return

      // Close any open submenu
      if (activeSubmenu) {
        activeSubmenu.hide()
      }

      // Create new submenu
      const submenu = createMenu({
        ...config,
        items: itemConfig.items,
        class: `${config.prefix}-menu--submenu`
      })

      submenus.set(name, submenu)
      activeSubmenu = submenu

      // Position submenu relative to parent item
      submenu.element.style.position = 'absolute'
      item.setAttribute('aria-expanded', 'true')

      submenu.show().position(item, {
        align: 'right',
        vAlign: 'top',
        offsetX: 0,
        offsetY: 0
      })

      // Handle submenu selection
      submenu.on('select', (detail) => {
        component.emit('select', {
          name: `${name}:${detail.name}`,
          text: detail.text
        })
      })
    }, 100)
  }, true)

  // Create initial items
  if (config.items) {
    config.items.forEach(itemConfig => {
      const item = createMenuItem(itemConfig, config.prefix)
      list.appendChild(item)
    })
  }

  // Add cleanup
  const originalDestroy = component.lifecycle.destroy
  component.lifecycle.destroy = () => {
    clearTimeout(hoverTimeout)
    submenus.forEach(submenu => submenu.destroy())
    submenus.clear()
    originalDestroy()
  }

  return {
    ...component,

    /**
     * Shows the menu
     */
    show () {
      // Make sure the element is in the DOM
      if (!component.element.parentNode) {
        document.body.appendChild(component.element)
      }
      // Force a reflow before adding the visible class for animation
      component.element.offsetHeight
      component.element.classList.add(`${config.prefix}-menu--visible`)
      return this
    },

    /**
     * Hides the menu
     */
    hide () {
      // First hide any open submenu
      if (activeSubmenu) {
        activeSubmenu.hide()
        activeSubmenu = null
      }
      component.element.classList.remove(`${config.prefix}-menu--visible`)
      return this
    },

    /**
     * Positions the menu relative to a target element
     */
    position (target, position) {
      if (!target) return this

      const targetRect = target.getBoundingClientRect()
      const menuRect = component.element.getBoundingClientRect()

      // Calculate position based on alignment
      const { align = 'left', vAlign = 'bottom' } = position || {}
      let left = targetRect.left
      let top = targetRect.bottom

      if (align === 'right') {
        left = targetRect.right - menuRect.width
      } else if (align === 'center') {
        left = targetRect.left + (targetRect.width - menuRect.width) / 2
      }

      if (vAlign === 'top') {
        top = targetRect.top - menuRect.height
      }

      // Adjust for viewport boundaries
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (left + menuRect.width > viewportWidth) {
        left = viewportWidth - menuRect.width
      }
      if (left < 0) left = 0

      if (top + menuRect.height > viewportHeight) {
        top = targetRect.top - menuRect.height
      }
      if (top < 0) top = 0

      // Apply position
      component.element.style.left = `${left}px`
      component.element.style.top = `${top}px`

      return this
    }
  }
}

/**
 * Creates a new Menu component
 * @param {Object} config - Menu configuration
 * @param {MenuItem[]} [config.items] - Menu items
 * @param {string} [config.class] - Additional CSS classes
 * @param {HTMLElement} [config.target] - Target element for positioning
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
        style: 'display: none;'
      }
    }),
    withLifecycle(),
    withMenuItems(baseConfig),
    withAPI({
      lifecycle: {
        destroy: () => {
          component?.element?.remove?.()
        }
      }
    })
  )(baseConfig)
}

export default createMenu
