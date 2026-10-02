// src/core/compose/features/constants.ts

/**
 * Default configuration for the ripple effect. Only `duration` is an option:
 * the wave's motion and opacity come from the stylesheet (FLO-268), so 1.0
 * removed the timing and opacity defaults and their schema.
 */
export const RIPPLE_CONFIG = {
  duration: 450,
};
