// src/core/build/ripple.js

import { RIPPLE_CONFIG } from './constants'

const DEFAULT_CONFIG = RIPPLE_CONFIG

/**
 * Creates a ripple effect instance
 * @param {Object} [config] - Ripple configuration
 * @param {number} [config.duration] - Animation duration in ms
 * @param {string} [config.timing] - Animation timing function
 * @param {string[]} [config.opacity] - Start and end opacity values
 * @returns {Object} Ripple controller instance
 */
export const createRipple = (config = {}) => {
  // Make sure we fully merge the config options
  const options = {
    ...DEFAULT_CONFIG,
    ...config,
    // Handle nested objects like opacity array
    opacity: config.opacity || DEFAULT_CONFIG.opacity
  }

  const getEndCoordinates = (bounds) => {
    const size = Math.max(bounds.width, bounds.height)
    const top = bounds.height > bounds.width
      ? -bounds.height / 2
      : -(bounds.width - bounds.height / 2)

    return {
      size: `${size * 2}px`,
      top: `${top}px`,
      left: `${size / -2}px`
    }
  }

  const createRippleElement = () => {
    const ripple = document.createElement('div')
    ripple.className = 'ripple'
    // Initial styles already set in CSS
    ripple.style.transition = `all ${options.duration}ms ${options.timing}`
    return ripple
  }

  // Store document event listeners for cleanup
  let documentListeners = []

  // Safe document event handling
  const addDocumentListener = (event, handler) => {
    if (typeof document.addEventListener === 'function') {
      document.addEventListener(event, handler)
      documentListeners.push({ event, handler })
    }
  }

  const removeDocumentListener = (event, handler) => {
    if (typeof document.removeEventListener === 'function') {
      document.removeEventListener(event, handler)
      documentListeners = documentListeners.filter(
        listener => !(listener.event === event && listener.handler === handler)
      )
    }
  }

  const animate = (event, container) => {
    if (!container) return

    const bounds = container.getBoundingClientRect()
    const ripple = createRippleElement()

    // Set initial position and state
    Object.assign(ripple.style, {
      left: `${event.offsetX || bounds.width / 2}px`,
      top: `${event.offsetY || bounds.height / 2}px`,
      transform: 'scale(0)',
      opacity: options.opacity[0]
    })

    container.appendChild(ripple)

    // Force reflow
    // eslint-disable-next-line no-unused-expressions
    ripple.offsetHeight

    // Animate to end position
    const end = getEndCoordinates(bounds)
    Object.assign(ripple.style, {
      ...end,
      transform: 'scale(1)',
      opacity: options.opacity[1]
    })

    const cleanup = () => {
      ripple.style.opacity = '0'

      // Use setTimeout to remove element after animation
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple)
        }
      }, options.duration)

      removeDocumentListener('mouseup', cleanup)
      removeDocumentListener('mouseleave', cleanup)
    }

    addDocumentListener('mouseup', cleanup)
    addDocumentListener('mouseleave', cleanup)
  }

  return {
    mount: (element) => {
      if (!element) return

      // Ensure proper positioning context
      const currentPosition = window.getComputedStyle(element).position
      if (currentPosition === 'static') {
        element.style.position = 'relative'
      }
      element.style.overflow = 'hidden'

      // Store the mousedown handler to be able to remove it later
      const mousedownHandler = (e) => animate(e, element)

      // Store handler reference on the element
      if (!element.__rippleHandlers) {
        element.__rippleHandlers = []
      }
      element.__rippleHandlers.push(mousedownHandler)

      element.addEventListener('mousedown', mousedownHandler)
    },

    unmount: (element) => {
      if (!element) return

      // Clear document event listeners
      documentListeners.forEach(({ event, handler }) => {
        removeDocumentListener(event, handler)
      })
      documentListeners = []

      // Remove event listeners
      if (element.__rippleHandlers) {
        element.__rippleHandlers.forEach(handler => {
          element.removeEventListener('mousedown', handler)
        })
        element.__rippleHandlers = []
      }

      // Remove all ripple elements
      const ripples = element.querySelectorAll('.ripple')
      ripples.forEach(ripple => {
        // Call remove directly to match the test expectation
        ripple.remove()
      })
    }
  }
}
