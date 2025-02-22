// src/components/navigation/nav-item.js

/**
 * Creates an expand/collapse icon element
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Expand icon element
 */
const createExpandIcon = (prefix) => {
  const icon = document.createElement('span')
  icon.className = `${prefix}-nav-expand-icon`
  icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `
  return icon
}

/**
 * Creates a nested items container
 * @param {Array} items - Nested items configuration
 * @param {string} prefix - CSS class prefix
 * @param {Function} createItem - Item creation function
 * @returns {HTMLElement} Nested items container
 */
const createNestedContainer = (items, prefix, createItem) => {
  const container = document.createElement('div')
  container.className = `${prefix}-nav-nested-container`
  container.setAttribute('role', 'group')
  container.hidden = true

  items.forEach(itemConfig => {
    createItem(itemConfig, container, prefix)
  })

  return container
}

/**
 * Creates a navigation item element
 * @param {Object} config - Item configuration
 * @param {HTMLElement} container - Container element
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Created navigation item
 */
export const createNavItem = (config, container, prefix) => {
  const itemContainer = document.createElement('div')
  itemContainer.className = `${prefix}-nav-item-container`

  const item = document.createElement('button')
  item.className = `${prefix}-nav-item`
  item.setAttribute('role', config.items?.length ? 'button' : 'menuitem')
  item.setAttribute('aria-selected', 'false')

  if (config.id) {
    item.dataset.id = config.id
  }

  if (config.disabled) {
    item.disabled = true
    item.setAttribute('aria-disabled', 'true')
  }

  // Add icon if provided
  if (config.icon) {
    const icon = document.createElement('span')
    icon.className = `${prefix}-nav-item-icon`
    icon.innerHTML = config.icon
    item.appendChild(icon)
  }

  // Add label if provided
  if (config.label) {
    const label = document.createElement('span')
    label.className = `${prefix}-nav-item-label`
    label.textContent = config.label
    item.appendChild(label)
    item.setAttribute('aria-label', config.label)
  }

  // Add badge if provided
  if (config.badge) {
    const badge = document.createElement('span')
    badge.className = `${prefix}-nav-item-badge`
    badge.textContent = config.badge
    badge.setAttribute('aria-label', `${config.badge} notifications`)
    item.appendChild(badge)
  }

  itemContainer.appendChild(item)

  // Handle nested items - only for drawer variant
  if (config.items?.length && container.closest('.mtrl-nav--drawer, .mtrl-nav--drawer-modal, .mtrl-nav--drawer-standard')) {
    const expandIcon = createExpandIcon(prefix)
    item.appendChild(expandIcon)

    item.setAttribute('aria-expanded', config.expanded ? 'true' : 'false')
    item.setAttribute('aria-haspopup', 'true')

    const nestedContainer = createNestedContainer(config.items, prefix, createNavItem)
    nestedContainer.hidden = !config.expanded
    itemContainer.appendChild(nestedContainer)

    // Handle expand/collapse
    item.addEventListener('click', (event) => {
      event.stopPropagation()
      const isExpanded = item.getAttribute('aria-expanded') === 'true'
      item.setAttribute('aria-expanded', (!isExpanded).toString())
      nestedContainer.hidden = isExpanded

      // Toggle expand icon rotation
      expandIcon.style.transform = isExpanded ? '' : 'rotate(90deg)'
    })
  }

  container.appendChild(itemContainer)
  return item
}

/**
 * Recursively gets all nested items from a navigation item
 * @param {HTMLElement} item - Navigation item element
 * @param {string} prefix - CSS class prefix
 * @returns {Array<HTMLElement>} Array of all nested items
 */
export const getAllNestedItems = (item, prefix) => {
  const container = item.closest(`.${prefix}-nav-item-container`)
  if (!container) return []

  const nestedContainer = container.querySelector(`.${prefix}-nav-nested-container`)
  if (!nestedContainer) return []

  const items = Array.from(nestedContainer.querySelectorAll(`.${prefix}-nav-item`))
  return items.reduce((acc, nestedItem) => {
    return [...acc, nestedItem, ...getAllNestedItems(nestedItem, prefix)]
  }, [])
}
