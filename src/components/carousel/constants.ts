// src/components/carousel/constants.ts

/**
 * Carousel layout types as defined by Material Design 3
 */
export const CAROUSEL_LAYOUTS = {
  /** Best for browsing many visual items at once (photos, event feeds) */
  MULTI_BROWSE: 'multi-browse',
  
  /** For highly customized or text-heavy carousels (traditional behavior) */
  UNCONTAINED: 'uncontained',
  
  /** For spotlighting very large visual items (featured content) */
  HERO: 'hero',
  
  /** For immersive vertical-scrolling experiences */
  FULL_SCREEN: 'full-screen'
} as const;

/**
 * Carousel scroll behaviors
 */
export const CAROUSEL_SCROLL_BEHAVIORS = {
  /** Standard scrolling without snapping */
  DEFAULT: 'default',
  
  /** Items snap to carousel layout */
  SNAP: 'snap'
} as const;

/**
 * Carousel item sizes
 */
export const CAROUSEL_ITEM_SIZES = {
  LARGE: 'large',
  MEDIUM: 'medium',
  SMALL: 'small'
} as const;

/**
 * Transition effects for carousel slides
 */
export const CAROUSEL_TRANSITIONS = {
  SLIDE: 'slide',
  FADE: 'fade',
  NONE: 'none'
} as const;

/**
 * Event names for the carousel component
 */
export const CAROUSEL_EVENTS = {
  SLIDE_CHANGE: 'slide-change',
  SLIDE_CHANGED: 'slide-changed',
  RESIZE: 'resize'
} as const;

/**
 * Default values for carousel configuration
 */
export const CAROUSEL_DEFAULTS = {
  INITIAL_SLIDE: 0,
  LOOP: true,
  TRANSITION: CAROUSEL_TRANSITIONS.SLIDE,
  TRANSITION_DURATION: 300,
  BORDER_RADIUS: 16,
  GAP: 8,
  LAYOUT: CAROUSEL_LAYOUTS.MULTI_BROWSE,
  SCROLL_BEHAVIOR: CAROUSEL_SCROLL_BEHAVIORS.SNAP,
  SMALL_ITEM_WIDTH: 48, // 40-56dp range as per MD3
  
  // Item widths for different layouts in px
  ITEM_WIDTHS: {
    [CAROUSEL_LAYOUTS.MULTI_BROWSE]: {
      LARGE: 240,
      MEDIUM: 180,
      SMALL: 48
    },
    [CAROUSEL_LAYOUTS.UNCONTAINED]: {
      LARGE: 240,
      MEDIUM: 240,
      SMALL: 240 // All same size in uncontained
    },
    [CAROUSEL_LAYOUTS.HERO]: {
      LARGE: 300,
      MEDIUM: 240,
      SMALL: 48
    },
    [CAROUSEL_LAYOUTS.FULL_SCREEN]: {
      LARGE: '100%', // Full width
      MEDIUM: '100%',
      SMALL: '100%'
    }
  }
} as const;