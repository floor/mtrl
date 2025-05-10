// src/core/build/constants.ts

/**
 * Animation timing functions for ripple effect
 */
export enum RIPPLE_TIMING {
  LINEAR = 'linear',
  EASE = 'ease',
  EASE_IN = 'ease-in',
  EASE_OUT = 'ease-out',
  EASE_IN_OUT = 'ease-in-out',
  MATERIAL = 'cubic-bezier(0.4, 0.0, 0.2, 1)'
}

/**
 * Default configuration for ripple effect
 * Enhanced for better visibility
 */
export const RIPPLE_CONFIG = {
  duration: 450,                        // Slightly longer duration
  timing: RIPPLE_TIMING.MATERIAL,       // Material Design timing function
  opacity: ['0.4', '0'] as [string, string]  // Higher initial opacity for better visibility
};

/**
 * Validation schema for ripple configuration
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
};