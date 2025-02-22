// src/core/compose/component.js
/**
 * @module core/compose/component
 * @description Core utilities for component composition and creation with built-in mobile support
 */

import { createElement } from '../dom/create'
import {
  normalizeEvent,
  hasTouchSupport,
  TOUCH_CONFIG,
  PASSIVE_EVENTS
} from '../utils/mobile'

/**
 * Creates helper functions for managing CSS class names with a prefix
 * @param {string} prefix - Prefix to apply to class names
 * @returns {Object} Class name utilities
 * @property {Function} getClass - Gets a class name with prefix
 * @property {Function} getModifierClass - Gets a modifier class with prefix
 * @property {Function} getElementClass - Gets an element class with prefix
 * @example
 * const { getClass } = withPrefix('mtrl');
 * getClass('button'); // Returns 'mtrl-button'
 */
const withPrefix = prefix => ({
  /**
   * Gets a prefixed class name
   * @param {string} name - Base class name
   * @returns {string} Prefixed class name
   */
  getClass: (name) => `${prefix}-${name}`,
  /**
   * Gets a prefixed modifier class name
   * @param {string} base - Base class name
   * @param {string} modifier - Modifier name
   * @returns {string} Prefixed modifier class
   */
  getModifierClass: (base, modifier) => `${base}--${modifier}`,
  /**
   * Gets a prefixed element class name
   * @param {string} base - Base class name
   * @param {string} element - Element name
   * @returns {string} Prefixed element class
   */
  getElementClass: (base, element) => `${base}-${element}`
})

/**
 * Creates a base component with configuration and prefix utilities.
 * This forms the foundation for all components in the system.
 *
 * @param {Object} config - Component configuration
 * @param {string} [config.prefix='mtrl'] - CSS class prefix
 * @param {string} [config.componentName] - Component name for class generation
 * @returns {Object} Base component with prefix utilities
 */
export const createBase = (config = {}) => ({
  config,
  componentName: config.componentName,
  ...withPrefix(config.prefix || 'mtrl'),

  /**
   * Manages the touch interaction state for the component.
   * This helps track touch gestures and interactions.
   */
  touchState: {
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    isTouching: false,
    activeTarget: null
  },

  /**
   * Updates the component's touch state based on user interactions.
   * Tracks touch position and timing for gesture recognition.
   */
  updateTouchState (event, status) {
    const normalized = normalizeEvent(event)

    if (status === 'start') {
      this.touchState = {
        startTime: Date.now(),
        startPosition: {
          x: normalized.clientX,
          y: normalized.clientY
        },
        isTouching: true,
        activeTarget: normalized.target
      }
    } else if (status === 'end') {
      this.touchState.isTouching = false
      this.touchState.activeTarget = null
    }
  }
})

/**
 * Higher-order function that adds a DOM element to a component
 * @param {Object} options - Element creation options
 * @param {string} [options.tag='div'] - HTML tag name
 * @param {string} [options.componentName] - Component name for class generation
 * @param {Object} [options.attrs] - HTML attributes
 * @param {string|string[]} [options.className] - Additional CSS classes
 * @param {Object} [options.forwardEvents] - Native events to forward to component events
 * @returns {Function} Component enhancer
 * @example
 * pipe(
 *   createBase,
 *   withElement({
 *     tag: 'button',
 *     componentName: 'button',
 *     attrs: { type: 'button' },
 *     forwardEvents: {
 *       click: component => !component.element.disabled
 *     }
 *   })
 * )({ prefix: 'app' })
 */
export const withElement = (options = {}) => (base) => {
  /**
   * Handles the start of a touch interaction.
   * Initializes touch tracking and provides visual feedback.
   */
  const handleTouchStart = (event) => {
    base.updateTouchState(event, 'start')
    element.classList.add(`${base.getClass('touch-active')}`)

    if (options.forwardEvents?.touchstart) {
      base.emit?.('touchstart', normalizeEvent(event))
    }
  }

  /**
   * Handles the end of a touch interaction.
   * Detects taps and cleans up touch state.
   */
  const handleTouchEnd = (event) => {
    if (!base.touchState.isTouching) return

    const touchDuration = Date.now() - base.touchState.startTime
    element.classList.remove(`${base.getClass('touch-active')}`)
    base.updateTouchState(event, 'end')

    // Emit tap event for short touches
    if (touchDuration < TOUCH_CONFIG.TAP_THRESHOLD) {
      base.emit?.('tap', normalizeEvent(event))
    }

    if (options.forwardEvents?.touchend) {
      base.emit?.('touchend', normalizeEvent(event))
    }
  }

  /**
   * Handles touch movement.
   * Detects swipes and other gesture-based interactions.
   */
  const handleTouchMove = (event) => {
    if (!base.touchState.isTouching) return

    const normalized = normalizeEvent(event)
    const deltaX = normalized.clientX - base.touchState.startPosition.x
    const deltaY = normalized.clientY - base.touchState.startPosition.y

    // Detect and emit swipe gestures
    if (Math.abs(deltaX) > TOUCH_CONFIG.SWIPE_THRESHOLD) {
      base.emit?.('swipe', {
        direction: deltaX > 0 ? 'right' : 'left',
        deltaX,
        deltaY
      })
    }

    if (options.forwardEvents?.touchmove) {
      base.emit?.('touchmove', { ...normalized, deltaX, deltaY })
    }
  }

  // Create the element with appropriate classes
  const element = createElement({
    ...options,
    className: [
      base.getClass(options.componentName || base.componentName || 'component'),
      hasTouchSupport() && options.interactive ? base.getClass('interactive') : null,
      options.className
    ].filter(Boolean),
    context: base
  })

  // Add event listeners only if touch is supported and the component is interactive
  if (hasTouchSupport() && options.interactive) {
    element.addEventListener('touchstart', handleTouchStart, PASSIVE_EVENTS)
    element.addEventListener('touchend', handleTouchEnd)
    element.addEventListener('touchmove', handleTouchMove, PASSIVE_EVENTS)
  }

  return {
    ...base,
    element,

    /**
     * Adds CSS classes to the element
     * @param {...string} classes - CSS classes to add
     * @returns {Object} Component instance for chaining
     */
    addClass (...classes) {
      element.classList.add(...classes.filter(Boolean))
      return this
    },

    /**
     * Removes the element and cleans up event listeners.
     * Ensures proper resource cleanup when the component is destroyed.
     */
    destroy () {
      if (hasTouchSupport() && options.interactive) {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchend', handleTouchEnd)
        element.removeEventListener('touchmove', handleTouchMove)
      }
      element.remove()
    }
  }
}
