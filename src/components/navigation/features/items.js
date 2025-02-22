// src/components/navigation/features/items.js
import { createNavItem, getAllNestedItems } from '../nav-item'

export const withNavItems = (config) => (component) => {
  const items = new Map()
  let activeItem = null

  /**
   * Recursively stores items in the items Map
   * @param {Object} itemConfig - Item configuration
   * @param {HTMLElement} item - Created item element
   */
  const storeItem = (itemConfig, item) => {
    items.set(itemConfig.id, { element: item, config: itemConfig })

    if (itemConfig.items?.length) {
      itemConfig.items.forEach(nestedConfig => {
        const container = item.closest(`.${config.prefix}-nav-item-container`)
        const nestedContainer = container.querySelector(`.${config.prefix}-nav-nested-container`)
        const nestedItem = nestedContainer.querySelector(`[data-id="${nestedConfig.id}"]`)
        storeItem(nestedConfig, nestedItem)
      })
    }
  }

  // Create initial items
  if (config.items) {
    config.items.forEach(itemConfig => {
      const item = createNavItem(itemConfig, component.element, config.prefix)
      storeItem(itemConfig, item)

      if (itemConfig.active) {
        activeItem = { element: item, config: itemConfig }
        item.classList.add(`${config.prefix}-nav-item--active`)
        item.setAttribute('aria-selected', 'true')
      }
    })
  }

  // Handle item clicks
  component.element.addEventListener('click', (event) => {
    const item = event.target.closest(`.${config.prefix}-nav-item`)
    if (!item || item.disabled || item.getAttribute('aria-haspopup') === 'true') return

    const id = item.dataset.id
    const itemData = items.get(id)
    if (!itemData) return

    // Store previous item before updating
    const previousItem = activeItem

    // Update active state
    if (activeItem) {
      activeItem.element.classList.remove(`${config.prefix}-nav-item--active`)
      activeItem.element.setAttribute('aria-selected', 'false')
    }

    item.classList.add(`${config.prefix}-nav-item--active`)
    item.setAttribute('aria-selected', 'true')
    activeItem = itemData

    // Emit change event with item data
    component.emit('change', {
      id,
      item: itemData,
      previousItem,
      path: getItemPath(id)
    })
  })

  /**
   * Gets the path to an item (parent IDs)
   * @param {string} id - Item ID to get path for
   * @returns {Array<string>} Array of parent item IDs
   */
  const getItemPath = (id) => {
    const path = []
    let currentItem = items.get(id)

    while (currentItem) {
      const parentContainer = currentItem.element.closest(`.${config.prefix}-nav-nested-container`)
      if (!parentContainer) break

      const parentItem = parentContainer.previousElementSibling
      if (!parentItem) break

      const parentId = parentItem.dataset.id
      if (!parentId) break

      path.unshift(parentId)
      currentItem = items.get(parentId)
    }

    return path
  }

  // Clean up when component is destroyed
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy
    component.lifecycle.destroy = () => {
      items.clear()
      originalDestroy?.()
    }
  }

  return {
    ...component,
    items,

    addItem (itemConfig) {
      if (items.has(itemConfig.id)) return this

      const item = createNavItem(itemConfig, component.element, config.prefix)
      storeItem(itemConfig, item)

      if (itemConfig.active) {
        this.setActive(itemConfig.id)
      }

      component.emit('itemAdded', {
        id: itemConfig.id,
        item: { element: item, config: itemConfig }
      })
      return this
    },

    removeItem (id) {
      const item = items.get(id)
      if (!item) return this

      // Remove all nested items first
      const nestedItems = getAllNestedItems(item.element, config.prefix)
      nestedItems.forEach(nestedItem => {
        const nestedId = nestedItem.dataset.id
        if (nestedId) items.delete(nestedId)
      })

      if (activeItem?.config.id === id) {
        activeItem = null
      }

      // Remove the entire item container
      const container = item.element.closest(`.${config.prefix}-nav-item-container`)
      container?.remove()
      items.delete(id)

      component.emit('itemRemoved', { id, item })
      return this
    },

    getItem: (id) => items.get(id),
    getAllItems: () => Array.from(items.values()),
    getActive: () => activeItem,
    getItemPath: (id) => getItemPath(id),

    setActive (id) {
      const item = items.get(id)
      if (!item || item.config.disabled) return this

      if (activeItem) {
        activeItem.element.classList.remove(`${config.prefix}-nav-item--active`)
        activeItem.element.setAttribute('aria-selected', 'false')
      }

      item.element.classList.add(`${config.prefix}-nav-item--active`)
      item.element.setAttribute('aria-selected', 'true')
      activeItem = item

      // Ensure all parent items are expanded
      const path = getItemPath(id)
      path.forEach(parentId => {
        const parentItem = items.get(parentId)
        if (parentItem) {
          const parentButton = parentItem.element
          const nestedContainer = parentButton.closest(`.${config.prefix}-nav-item-container`)
            .querySelector(`.${config.prefix}-nav-nested-container`)

          parentButton.setAttribute('aria-expanded', 'true')
          nestedContainer.hidden = false
        }
      })

      component.emit('activeChanged', {
        id,
        item,
        previousItem: activeItem,
        path: getItemPath(id)
      })
      return this
    }
  }
}
