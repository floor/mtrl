// src/components/menu/features/keyboard-navigation.js

/**
 * Adds keyboard navigation functionality to a menu component
 * @param {Object} config - Menu configuration
 * @returns {Function} Component enhancer
 */
export const withKeyboardNavigation = (config) => (component) => {
  // Store the component's existing methods
  const componentMethods = {
    show: component.show,
    hide: component.hide,
    destroy: component.lifecycle?.destroy
  }

  let keydownHandler = null

  /**
   * Handles keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeydown = (event) => {
    if (!component.isVisible?.()) return

    const focusedItem = document.activeElement
    const list = component.element.querySelector(`.${config.prefix}-menu-list`)
    const isMenuItem = focusedItem.classList?.contains(`${config.prefix}-menu-item`)
    const items = Array.from(list.querySelectorAll(`.${config.prefix}-menu-item:not([aria-disabled="true"])`))

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!isMenuItem) {
          items[0]?.focus()
        } else {
          const currentIndex = items.indexOf(focusedItem)
          const nextItem = items[currentIndex + 1] || items[0]
          nextItem.focus()
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        if (!isMenuItem) {
          items[items.length - 1]?.focus()
        } else {
          const currentIndex = items.indexOf(focusedItem)
          const prevItem = items[currentIndex - 1] || items[items.length - 1]
          prevItem.focus()
        }
        break

      case 'ArrowRight':
        if (isMenuItem && focusedItem.classList.contains(`${config.prefix}-menu-item--submenu`)) {
          event.preventDefault()
          const submenuEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          })
          focusedItem.dispatchEvent(submenuEvent)
        }
        break

      case 'ArrowLeft':
        if (config.parentItem) {
          event.preventDefault()
          component.hide()
          config.parentItem.focus()
        }
        break

      case 'Enter':
      case ' ':
        if (isMenuItem) {
          event.preventDefault()
          focusedItem.click()
        }
        break
    }
  }

  /**
   * Enables keyboard navigation
   */
  const enableKeyboardNavigation = () => {
    if (!keydownHandler) {
      keydownHandler = handleKeydown
      document.addEventListener('keydown', keydownHandler)
    }
  }

  /**
   * Disables keyboard navigation
   */
  const disableKeyboardNavigation = () => {
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler)
      keydownHandler = null
    }
  }

  // Enhanced component with navigation capabilities
  const enhancedComponent = {
    ...component,

    show () {
      const result = componentMethods.show.call(this)
      enableKeyboardNavigation()
      return result
    },

    hide () {
      disableKeyboardNavigation()
      return componentMethods.hide.call(this)
    }
  }

  // Add cleanup to lifecycle
  if (component.lifecycle) {
    component.lifecycle.destroy = () => {
      disableKeyboardNavigation()
      if (componentMethods.destroy) {
        componentMethods.destroy()
      }
    }
  }

  return enhancedComponent
}
