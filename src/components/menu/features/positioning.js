// src/components/menu/features/positioning.js

/**
 * Positions a menu element relative to a target element
 * @param {HTMLElement} menuElement - Menu element to position
 * @param {HTMLElement} target - Target element to position against
 * @param {Object} options - Positioning options
 * @param {string} [options.align='left'] - Horizontal alignment: 'left', 'right', 'center'
 * @param {string} [options.vAlign='bottom'] - Vertical alignment: 'top', 'bottom', 'middle'
 * @param {number} [options.offsetX=0] - Horizontal offset in pixels
 * @param {number} [options.offsetY=0] - Vertical offset in pixels
 * @returns {Object} The final position {left, top}
 */
export const positionMenu = (menuElement, target, options = {}) => {
  if (!target || !menuElement) return { left: 0, top: 0 }

  // Force the menu to be visible temporarily to get accurate dimensions
  const originalDisplay = menuElement.style.display
  const originalVisibility = menuElement.style.visibility
  const originalOpacity = menuElement.style.opacity

  menuElement.style.display = 'block'
  menuElement.style.visibility = 'hidden'
  menuElement.style.opacity = '0'

  const targetRect = target.getBoundingClientRect()
  const menuRect = menuElement.getBoundingClientRect()

  // Restore original styles
  menuElement.style.display = originalDisplay
  menuElement.style.visibility = originalVisibility
  menuElement.style.opacity = originalOpacity

  const {
    align = 'left',
    vAlign = 'bottom',
    offsetX = 0,
    offsetY = 0
  } = options

  let left = targetRect.left + offsetX
  let top = targetRect.bottom + offsetY

  // Handle horizontal alignment
  if (align === 'right') {
    left = targetRect.right - menuRect.width + offsetX
  } else if (align === 'center') {
    left = targetRect.left + (targetRect.width - menuRect.width) / 2 + offsetX
  }

  // Handle vertical alignment
  if (vAlign === 'top') {
    top = targetRect.top - menuRect.height + offsetY
  } else if (vAlign === 'middle') {
    top = targetRect.top + (targetRect.height - menuRect.height) / 2 + offsetY
  }

  // Determine if this is a submenu
  const isSubmenu = menuElement.classList.contains('mtrl-menu--submenu')

  // Special positioning for submenus
  if (isSubmenu) {
    // By default, position to the right of the parent item
    left = targetRect.right + 2 // Add a small gap
    top = targetRect.top

    // Check if submenu would go off-screen to the right
    const viewportWidth = window.innerWidth
    if (left + menuRect.width > viewportWidth) {
      // Position to the left of the parent item instead
      left = targetRect.left - menuRect.width - 2
    }

    // Check if submenu would go off-screen at the bottom
    const viewportHeight = window.innerHeight
    if (top + menuRect.height > viewportHeight) {
      // Align with bottom of viewport
      top = Math.max(0, viewportHeight - menuRect.height)
    }
  } else {
    // Standard menu positioning and boundary checking
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (left + menuRect.width > viewportWidth) {
      left = Math.max(0, viewportWidth - menuRect.width)
    }

    if (left < 0) left = 0

    if (top + menuRect.height > viewportHeight) {
      top = Math.max(0, targetRect.top - menuRect.height + offsetY)
    }

    if (top < 0) top = 0
  }

  // Apply position
  menuElement.style.left = `${left}px`
  menuElement.style.top = `${top}px`

  return { left, top }
}

/**
 * Adds positioning functionality to a menu component
 * @param {Object} component - Menu component
 * @returns {Object} Enhanced component with positioning methods
 */
export const withPositioning = (component) => {
  return {
    ...component,

    /**
     * Positions the menu relative to a target element
     * @param {HTMLElement} target - Target element
     * @param {Object} options - Position options
     * @returns {Object} Component instance
     */
    position (target, options) {
      positionMenu(component.element, target, options)
      return this
    }
  }
}
