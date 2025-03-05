// src/components/carousel/constants.ts

/**
 * Transition effects for carousel slides
 */
export const CAROUSEL_TRANSITIONS = {
  SLIDE: 'slide',
  FADE: 'fade',
  NONE: 'none'
};

/**
 * Event names for the carousel component
 */
export const CAROUSEL_EVENTS = {
  SLIDE_CHANGE: 'slide-change',
  SLIDE_CHANGED: 'slide-changed'
};

/**
 * Default values for carousel configuration
 */
export const CAROUSEL_DEFAULTS = {
  INITIAL_SLIDE: 0,
  LOOP: true,
  TRANSITION: CAROUSEL_TRANSITIONS.SLIDE,
  TRANSITION_DURATION: 300,
  BORDER_RADIUS: 16,
  GAP: 8
};