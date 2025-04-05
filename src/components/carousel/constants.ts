// src/components/carousel/constants.ts

/**
 * Carousel layout types as defined by Material Design 3
 * 
 * Material Design 3 defines specific layout patterns for carousels
 * to accommodate different content presentation needs.
 * 
 * @category Components
 * @see https://material.io/components/carousel
 */
export const CAROUSEL_LAYOUTS = {
  /** 
   * Multi-browse layout: Best for browsing many visual items at once 
   * Ideal for photo galleries, product collections, or event feeds
   * Shows multiple items in a single view with varying sizes
   */
  MULTI_BROWSE: 'multi-browse',
  
  /** 
   * Uncontained layout: For highly customized or text-heavy carousels 
   * Traditional horizontal scrolling behavior without special styling
   * Content can extend beyond viewport edges with consistent sizing
   */
  UNCONTAINED: 'uncontained',
  
  /** 
   * Hero layout: For spotlighting very large visual items
   * Highlights featured content with a large central item
   * Shows a partial preview of the next/previous items
   */
  HERO: 'hero',
  
  /** 
   * Full-screen layout: For immersive vertical-scrolling experiences
   * Takes up entire viewport with snap scrolling between items
   * Suited for immersive content or focused presentations
   */
  FULL_SCREEN: 'full-screen'
} as const;

/**
 * Carousel scroll behaviors
 * 
 * Controls how scrolling behaves when moving between items.
 * Each layout type has a recommended default behavior.
 * 
 * @category Components
 */
export const CAROUSEL_SCROLL_BEHAVIORS = {
  /** 
   * Default: Standard smooth scrolling without snapping
   * Users can stop at any position between items
   * Recommended for uncontained layouts and content browsing
   */
  DEFAULT: 'default',
  
  /** 
   * Snap: Items snap to predefined positions when scrolling
   * Ensures items are properly aligned for viewing
   * Recommended for multi-browse, hero, and full-screen layouts
   */
  SNAP: 'snap'
} as const;

/**
 * Carousel item size constants
 * 
 * Defines the available sizes for carousel items.
 * These are used to control the relative sizing of 
 * items within different carousel layouts.
 * 
 * @category Components
 */
export const CAROUSEL_ITEM_SIZES = {
  /** Large featured items (primary content) */
  LARGE: 'large',
  /** Medium-sized items (secondary content) */
  MEDIUM: 'medium',
  /** Small items (tertiary content or thumbnails) */
  SMALL: 'small'
} as const;

/**
 * Transition effects for carousel slides
 * 
 * Controls the visual transition when moving between slides.
 * 
 * @category Components
 */
export const CAROUSEL_TRANSITIONS = {
  /** Horizontal sliding animation (default) */
  SLIDE: 'slide',
  /** Fade in/out transition between slides */
  FADE: 'fade',
  /** No animation, immediate change */
  NONE: 'none'
} as const;

/**
 * Event names for the carousel component
 * 
 * These events can be listened to using the carousel's
 * `on()` method for custom behavior.
 * 
 * @example
 * carousel.on(CAROUSEL_EVENTS.SLIDE_CHANGED, (index) => {
 *   console.log(`Now showing slide ${index}`);
 * });
 * 
 * @category Components
 */
export const CAROUSEL_EVENTS = {
  /** Fired when a slide change begins */
  SLIDE_CHANGE: 'slide-change',
  /** Fired when a slide change completes */
  SLIDE_CHANGED: 'slide-changed',
  /** Fired when the carousel is resized */
  RESIZE: 'resize'
} as const;

/**
 * Default values for carousel configuration
 * 
 * These values will be used when not explicitly specified
 * in the configuration object passed to fCarousel().
 * 
 * @category Components
 */
export const CAROUSEL_DEFAULTS = {
  /** Start displaying from the first slide (index 0) */
  INITIAL_SLIDE: 0,
  /** Enable infinite looping by default */
  LOOP: true,
  /** Default transition effect is sliding */
  TRANSITION: CAROUSEL_TRANSITIONS.SLIDE,
  /** Transition duration in milliseconds */
  TRANSITION_DURATION: 300,
  /** Border radius for slides following Material Design 3 */
  BORDER_RADIUS: 16,
  /** Gap between slides in pixels */
  GAP: 8,
  /** Default layout is multi-browse for browsing visual content */
  LAYOUT: CAROUSEL_LAYOUTS.MULTI_BROWSE,
  /** Default scroll behavior is snap for controlled movement */
  SCROLL_BEHAVIOR: CAROUSEL_SCROLL_BEHAVIORS.SNAP,
  /** Small item width in pixels (40-56dp range per MD3 guidelines) */
  SMALL_ITEM_WIDTH: 48,
  
  /**
   * Item widths for different layouts in pixels
   * These values are optimized for each layout type
   * based on Material Design 3 guidelines
   */
  ITEM_WIDTHS: {
    // Multi-browse layout uses varying sizes
    [CAROUSEL_LAYOUTS.MULTI_BROWSE]: {
      LARGE: 240,  // Large featured items
      MEDIUM: 180, // Medium secondary items
      SMALL: 48    // Small thumbnail/preview items
    },
    // Uncontained layout uses consistent sizing
    [CAROUSEL_LAYOUTS.UNCONTAINED]: {
      LARGE: 240,  // All items same size
      MEDIUM: 240, // for consistent scrolling
      SMALL: 240   // experience
    },
    // Hero layout emphasizes the main item
    [CAROUSEL_LAYOUTS.HERO]: {
      LARGE: 300,  // Very large for hero spotlight
      MEDIUM: 240, // Medium for preview items
      SMALL: 48    // Small for navigation thumbnails
    },
    // Full-screen takes entire viewport width
    [CAROUSEL_LAYOUTS.FULL_SCREEN]: {
      LARGE: '100%',  // Full width immersive
      MEDIUM: '100%', // experience with all
      SMALL: '100%'   // items filling viewport
    }
  }
} as const;