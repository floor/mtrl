// src/core/build/constants.js

/**
 * Animation timing functions for ripple effect
 * @enum {string}
 */
export const RIPPLE_TIMING = {
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  MATERIAL: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
}

/**
 * Default configuration for ripple effect
 * @type {Object}
 */
export const RIPPLE_CONFIG = {
  duration: 375,
  timing: RIPPLE_TIMING.LINEAR,
  opacity: ['1', '0.3']
}

/**
 * Validation schema for ripple configuration
 * @type {Object}
 */
export const RIPPLE_SCHEMA = {
  duration: {
    type: 'number',
    minimum: 0,
    default: RIPPLE_CONFIG.duration
  },
  timing: {
    type: 'string',
    enum: Object.values(RIPPLE_TIMING),
    default: RIPPLE_CONFIG.timing
  },
  opacity: {
    type: 'array',
    items: {
      type: 'string',
      pattern: '^[0-1](\\.\\d+)?$'
    },
    minItems: 2,
    maxItems: 2,
    default: RIPPLE_CONFIG.opacity
  }
}
