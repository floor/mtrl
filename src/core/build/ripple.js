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
  const options = { ...DEFAULT_CONFIG, ...config }

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

  const animate = (event, container) => {
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
    ripple.offsetHeight // Force reflow

    // Animate to end position
    const end = getEndCoordinates(bounds)
    Object.assign(ripple.style, {
      ...end,
      transform: 'scale(1)',
      opacity: options.opacity[1]
    })

    const cleanup = () => {
      ripple.style.opacity = '0'
      setTimeout(() => ripple.remove(), options.duration)
      document.removeEventListener('mouseup', cleanup)
      document.removeEventListener('mouseleave', cleanup)
    }

    document.addEventListener('mouseup', cleanup)
    document.addEventListener('mouseleave', cleanup)
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

      element.addEventListener('mousedown', (e) => animate(e, element))
    },

    unmount: (element) => {
      if (!element) return
      element.querySelectorAll('.ripple').forEach(ripple => ripple.remove())
    }
  }
}
