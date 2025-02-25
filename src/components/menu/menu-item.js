// src/components/menu/menu-item.js

/**
 * Creates a menu item element
 * @param {Object} itemConfig - Item configuration
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Menu item element
 */
export const createMenuItem = (itemConfig, prefix) => {
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
    // We don't need to add a submenu indicator as it's handled by CSS ::after
  }

  return item
}
