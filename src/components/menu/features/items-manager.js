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
  let currentHoveredItem = null

  // Create items container
  const list = document.createElement('ul')
  list.className = `${config.prefix}-menu-list`
  list.setAttribute('role', 'menu')
  component.element.appendChild(list)

  /**
   * Creates a submenu for a menu item
   * @param {string} name - Item name
   * @param {HTMLElement} item - Menu item element
   * @returns {Object} Submenu component
   */
  const createSubmenu = (name, item) => {
    const itemConfig = itemsMap.get(name)
    if (!itemConfig?.items) return null

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

    return submenu
  }

  /**
   * Opens a submenu
   * @param {string} name - Item name
   * @param {HTMLElement} item - Menu item element
   */
  const openSubmenu = (name, item) => {
    // Close any open submenu that's different
    if (activeSubmenu && submenus.get(name) !== activeSubmenu) {
      const activeItem = list.querySelector('[aria-expanded="true"]')
      if (activeItem && activeItem !== item) {
        activeItem.setAttribute('aria-expanded', 'false')
      }
      activeSubmenu.hide()
      activeSubmenu = null
    }

    // If submenu doesn't exist yet, create it
    if (!submenus.has(name)) {
      const submenu = createSubmenu(name, item)
      if (submenu) {
        submenus.set(name, submenu)
      } else {
        return // No items to show
      }
    }

    // Get submenu and show it if not already showing
    const submenu = submenus.get(name)
    if (submenu && (activeSubmenu !== submenu || !item.getAttribute('aria-expanded') === 'true')) {
      item.setAttribute('aria-expanded', 'true')
      activeSubmenu = submenu

      // Position submenu relative to item
      submenu.show().position(item, {
        align: 'right',
        vAlign: 'top',
        offsetX: 0,
        offsetY: 0
      })
    }
  }

  /**
   * Closes a submenu
   * @param {string} name - Item name
   * @param {boolean} force - Whether to force close even if submenu is hovered
   */
  const closeSubmenu = (name, force = false) => {
    const submenu = submenus.get(name)
    if (!submenu || activeSubmenu !== submenu) return

    // Don't close if submenu is currently being hovered, unless forced
    if (!force && submenu.element && submenu.element.matches(':hover')) {
      return
    }

    const item = list.querySelector(`[data-name="${name}"][aria-expanded="true"]`)
    if (item) {
      item.setAttribute('aria-expanded', 'false')
    }

    submenu.hide()
    activeSubmenu = null
  }

  /**
   * Handles mouseenter for submenu items
   * @param {Event} event - Mouse event
   */
  const handleMouseEnter = (event) => {
    const item = event.target.closest(`.${config.prefix}-menu-item--submenu`)
    if (!item) return

    const name = item.getAttribute('data-name')
    if (name) {
      openSubmenu(name, item)
      currentHoveredItem = item
    }
  }

  /**
   * Handles mouseleave for submenu items
   * @param {Event} event - Mouse event
   */
  const handleMouseLeave = (event) => {
    const item = event.target.closest(`.${config.prefix}-menu-item--submenu`)
    if (!item) return

    const name = item.getAttribute('data-name')
    if (!name) return

    // Only close if we're not entering the submenu
    const submenu = submenus.get(name)
    if (submenu && submenu.element) {
      // Use setTimeout to allow checking if mouse moved to submenu
      setTimeout(() => {
        if (!submenu.element.matches(':hover') &&
            !item.matches(':hover')) {
          closeSubmenu(name)
        }
      }, 100)
    }

    currentHoveredItem = null
  }

  // Add hover handlers for all submenu items
  const addHoverHandlers = () => {
    // First remove any existing handlers to prevent duplicates
    list.querySelectorAll(`.${config.prefix}-menu-item--submenu`).forEach(item => {
      item.removeEventListener('mouseenter', handleMouseEnter)
      item.removeEventListener('mouseleave', handleMouseLeave)

      // Add the event listeners
      item.addEventListener('mouseenter', handleMouseEnter)
      item.addEventListener('mouseleave', handleMouseLeave)
    })
  }

  /**
   * Handles click events on menu items
   * @param {Event} event - Click event
   */
  const handleItemClick = (event) => {
    const item = event.target.closest(`.${config.prefix}-menu-item`)
    if (!item || item.getAttribute('aria-disabled') === 'true') return

    // For submenu items, toggle submenu
    if (item.classList.contains(`${config.prefix}-menu-item--submenu`)) {
      const name = item.getAttribute('data-name')
      if (!name) return

      // If expanded, close it
      if (item.getAttribute('aria-expanded') === 'true') {
        closeSubmenu(name, true) // Force close
      } else {
        // Otherwise open it
        openSubmenu(name, item)
      }
      return
    }

    // For regular items, emit select event
    const name = item.getAttribute('data-name')
    if (name) {
      component.emit(MENU_EVENTS.SELECT, { name, text: item.textContent })
      // Hide menu after selection unless configured otherwise
      if (!config.stayOpenOnSelect) {
        component.hide?.()
      }
    }
  }

  // Handle item clicks
  list.addEventListener('click', handleItemClick)

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

  // Add hover handlers after all items are created
  addHoverHandlers()

  // Override show method to reset state and ensure hover handlers
  const originalShow = component.show
  component.show = function (...args) {
    // Reset state when showing menu
    currentHoveredItem = null

    // Ensure all items have hover handlers
    setTimeout(addHoverHandlers, 0)

    return originalShow.apply(this, args)
  }

  // Override hide method to close all submenus
  const originalHide = component.hide
  component.hide = function (...args) {
    // Close all submenus
    if (activeSubmenu) {
      activeSubmenu.hide()
      activeSubmenu = null

      const expandedItems = list.querySelectorAll('[aria-expanded="true"]')
      expandedItems.forEach(item => {
        item.setAttribute('aria-expanded', 'false')
      })
    }

    // Reset state
    currentHoveredItem = null

    return originalHide.apply(this, args)
  }

  // Add cleanup
  const originalDestroy = component.lifecycle?.destroy
  if (component.lifecycle) {
    component.lifecycle.destroy = () => {
      // Remove hover handlers from all items
      list.querySelectorAll(`.${config.prefix}-menu-item--submenu`).forEach(item => {
        item.removeEventListener('mouseenter', handleMouseEnter)
        item.removeEventListener('mouseleave', handleMouseLeave)
      })

      // Remove click listener
      list.removeEventListener('click', handleItemClick)

      // Reset state
      currentHoveredItem = null

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

      // If it's a submenu item, add hover handlers
      if (itemConfig.items?.length) {
        item.addEventListener('mouseenter', handleMouseEnter)
        item.addEventListener('mouseleave', handleMouseLeave)
      }

      return this
    },

    /**
     * Removes an item from the menu
     * @param {string} name - Item name
     */
    removeItem (name) {
      if (!name) return this

      // First, ensure we remove the item from our internal map
      itemsMap.delete(name)

      // Now try to remove the item from the DOM
      const item = list.querySelector(`[data-name="${name}"]`)
      if (item) {
        // Remove event listeners
        item.removeEventListener('mouseenter', handleMouseEnter)
        item.removeEventListener('mouseleave', handleMouseLeave)

        // Close any submenu associated with this item
        if (submenus.has(name)) {
          const submenu = submenus.get(name)
          submenu.destroy()
          submenus.delete(name)
        }

        // Remove the item from the DOM
        item.remove()
      }

      return this
    },

    /**
     * Gets all registered items
     * @returns {Map} Map of item names to configurations
     */
    getItems () {
      return new Map(itemsMap)
    },

    /**
     * Refreshes all hover handlers
     * @returns {Object} Component instance
     */
    refreshHoverHandlers () {
      addHoverHandlers()
      return this
    }
  }
}
