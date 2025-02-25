// src/components/menu/features/items-manager.js

import { createMenuItem } from '../menu-item'
import { MENU_EVENTS } from '../constants'
import createMenu from '../menu'

/**
 * Adds menu items management functionality to a component
 * @param {Object} config - Menu configuration
 * @returns {Function} Component enhancer
 */
export const withItemsManager = (config) => (component) => {
  const submenus = new Map()
  const itemsMap = new Map()
  let activeSubmenu = null

  // Create items container
  const list = document.createElement('ul')
  list.className = `${config.prefix}-menu-list`
  list.setAttribute('role', 'menu')
  component.element.appendChild(list)

  /**
   * Creates and shows a submenu for an item
   * @param {string} name - Item name
   * @param {HTMLElement} item - Menu item element
   */
  const showSubmenu = (name, item) => {
    // Close any currently open submenu
    if (activeSubmenu) {
      const activeItem = list.querySelector('[aria-expanded="true"]')
      if (activeItem && activeItem !== item) {
        activeItem.setAttribute('aria-expanded', 'false')
        activeSubmenu.hide()
      }
    }

    // If menu doesn't exist yet, create it
    if (!submenus.has(name)) {
      const itemConfig = itemsMap.get(name)
      if (!itemConfig?.items) return

      const submenu = createMenu({
        ...config,
        items: itemConfig.items,
        class: `${config.prefix}-menu--submenu`,
        parentItem: item
      })

      // Handle submenu selection
      submenu.on(MENU_EVENTS.SELECT, (detail) => {
        component.emit(MENU_EVENTS.SELECT, {
          name: `${name}:${detail.name}`,
          text: detail.text,
          path: [name, detail.name]
        })
      })

      submenus.set(name, submenu)
    }

    // Show the submenu
    const submenu = submenus.get(name)
    if (submenu) {
      activeSubmenu = submenu
      item.setAttribute('aria-expanded', 'true')

      // Position relative to parent item
      submenu.show().position(item, {
        align: 'right',
        vAlign: 'top',
        offsetX: 0,
        offsetY: 0
      })
    }
  }

  /**
   * Handles mouse enter for menu items
   * @param {Event} event - Mouse event
   */
  const handleMouseEnter = (event) => {
    // Find the submenu item that was entered
    const item = event.target.closest(`.${config.prefix}-menu-item--submenu`)
    if (!item) return

    // Get the name and show the submenu
    const name = item.getAttribute('data-name')
    if (name) {
      showSubmenu(name, item)
    }
  }

  /**
   * Handles mouse leave for the entire menu
   * @param {Event} event - Mouse event
   */
  const handleMouseLeave = (event) => {
    // Only process if we're leaving the menu itself, not moving between items
    if (event.target !== component.element) return

    // Close the active submenu
    if (activeSubmenu) {
      const activeItem = list.querySelector('[aria-expanded="true"]')
      if (activeItem) {
        activeItem.setAttribute('aria-expanded', 'false')
      }

      activeSubmenu.hide()
      activeSubmenu = null
    }
  }

  // Add event listeners for hover
  component.element.addEventListener('mouseenter', handleMouseEnter, true)
  component.element.addEventListener('mouseleave', handleMouseLeave)

  // Handle item clicks
  list.addEventListener('click', (event) => {
    const item = event.target.closest(`.${config.prefix}-menu-item`)
    if (!item || item.getAttribute('aria-disabled') === 'true') return

    // For submenu items, toggle the submenu
    if (item.classList.contains(`${config.prefix}-menu-item--submenu`)) {
      const name = item.getAttribute('data-name')

      // If the submenu is already open, close it
      if (item.getAttribute('aria-expanded') === 'true') {
        if (activeSubmenu) {
          activeSubmenu.hide()
          activeSubmenu = null
        }
        item.setAttribute('aria-expanded', 'false')
      } else {
        // Otherwise open it
        showSubmenu(name, item)
      }
      return
    }

    // Regular menu item
    const name = item.getAttribute('data-name')
    if (name) {
      component.emit(MENU_EVENTS.SELECT, { name, text: item.textContent })
      // Hide menu after selection unless configured otherwise
      if (!config.stayOpenOnSelect) {
        component.hide?.()
      }
    }
  })

  // Create initial items
  if (config.items) {
    config.items.forEach(itemConfig => {
      const item = createMenuItem(itemConfig, config.prefix)
      list.appendChild(item)

      // Store item config for later use
      if (itemConfig.name) {
        itemsMap.set(itemConfig.name, itemConfig)
      }
    })
  }

  // Add cleanup
  const originalDestroy = component.lifecycle?.destroy
  if (component.lifecycle) {
    component.lifecycle.destroy = () => {
      // Clean up all event listeners
      component.element.removeEventListener('mouseenter', handleMouseEnter, true)
      component.element.removeEventListener('mouseleave', handleMouseLeave)

      // Destroy all submenus
      submenus.forEach(submenu => submenu.destroy())
      submenus.clear()
      itemsMap.clear()

      if (originalDestroy) {
        originalDestroy()
      }
    }
  }

  return {
    ...component,

    /**
     * Closes any open submenus
     */
    closeSubmenus () {
      if (activeSubmenu) {
        activeSubmenu.hide()
        activeSubmenu = null

        const expandedItems = list.querySelectorAll('[aria-expanded="true"]')
        expandedItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false')
        })
      }
      return this
    },

    /**
     * Adds an item to the menu
     * @param {Object} itemConfig - Item configuration
     */
    addItem (itemConfig) {
      if (!itemConfig) return this

      const item = createMenuItem(itemConfig, config.prefix)
      list.appendChild(item)

      // Store item config for later use
      if (itemConfig.name) {
        itemsMap.set(itemConfig.name, itemConfig)
      }

      return this
    },

    /**
     * Removes an item from the menu
     * @param {string} name - Item name
     */
    removeItem (name) {
      if (!name) return this

      const item = list.querySelector(`[data-name="${name}"]`)
      if (item) {
        // Close any submenu associated with this item
        if (submenus.has(name)) {
          const submenu = submenus.get(name)
          submenu.destroy()
          submenus.delete(name)
        }

        item.remove()
        itemsMap.delete(name)
      }

      return this
    },

    /**
     * Gets all registered items
     * @returns {Map} Map of item names to configurations
     */
    getItems () {
      return new Map(itemsMap)
    }
  }
}
