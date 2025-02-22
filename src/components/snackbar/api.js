// src/components/snackbar/api.js

/**
 * Enhances snackbar component with API methods
 * @param {Object} options - API configuration
 * @param {Object} options.lifecycle - Lifecycle handlers
 * @param {Object} options.queue - Snackbar queue manager
 */
export const withAPI = ({ lifecycle, queue }) => (component) => {
  if (!queue) {
    throw new Error('Snackbar queue is required')
  }

  let isVisible = false

  const enhancedComponent = {
    ...component,
    element: component.element,

    /**
     * Shows the snackbar with animation
     */
    show () {
      if (isVisible) return this
      isVisible = true

      queue.add({
        ...this,
        _show: () => {
          document.body.appendChild(component.element)

          // Force reflow for animation
          const _ = component.element.offsetHeight

          component.element.classList.add(`${component.getClass('snackbar')}--visible`)

          if (component.timer) {
            component.timer.start()
          }

          return this
        }
      })

      return this
    },

    /**
     * Hides the snackbar with animation and cleanup
     */
    hide () {
      if (!isVisible) return this
      isVisible = false

      if (component.timer) {
        component.timer.stop()
      }

      const handleTransitionEnd = (event) => {
        if (event.propertyName !== 'opacity') return

        component.element.removeEventListener('transitionend', handleTransitionEnd)
        if (component.element.parentNode) {
          component.element.remove()
        }
      }

      component.element.addEventListener('transitionend', handleTransitionEnd)
      component.element.classList.remove(`${component.getClass('snackbar')}--visible`)

      return this
    },

    setMessage (text) {
      component.text.setText(text)
      return this
    },

    getMessage () {
      return component.text.getText()
    },

    on: component.on,
    off: component.off,

    destroy () {
      if (isVisible) {
        component.element.remove()
      }
      if (component.timer) {
        component.timer.stop()
      }
      lifecycle.destroy()
    }
  }

  // Set up action button handler
  if (component.actionButton) {
    component.actionButton.addEventListener('click', () => {
      component.emit('action')
      component.emit('dismiss') // Emit dismiss to handle queue cleanup
    })
  }

  // Set up dismiss handler
  if (component.on) {
    // Store the handler reference so it can be properly removed
    const dismissHandler = () => {
      if (isVisible) {
        enhancedComponent.hide()
      }
    }

    component.on('dismiss', dismissHandler)

    // Add cleanup to lifecycle
    const originalDestroy = lifecycle.destroy
    lifecycle.destroy = () => {
      component.off('dismiss', dismissHandler)
      originalDestroy?.call(lifecycle)
    }
  }

  return enhancedComponent
}
