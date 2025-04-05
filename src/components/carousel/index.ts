// src/components/carousel/index.ts

/**
 * Carousel Component Module
 * 
 * A Material Design 3 compatible carousel implementation that supports
 * various layout types and scroll behaviors to accommodate different
 * content presentation needs.
 * 
 * @module components/carousel
 * @category Components
 */

// Main factory function
export { default } from './carousel';

/**
 * Constants for carousel configuration
 * 
 * Use these constants instead of string literals for better
 * code completion, type safety, and to follow best practices.
 * 
 * @example
 * import { fCarousel, CAROUSEL_LAYOUTS } from 'mtrl';
 * 
 * const carousel = fCarousel({
 *   layout: CAROUSEL_LAYOUTS.MULTI_BROWSE,
 *   // Other configuration options...
 * });
 * 
 * @category Components
 */
export { 
  CAROUSEL_LAYOUTS, 
  CAROUSEL_SCROLL_BEHAVIORS, 
  CAROUSEL_TRANSITIONS, 
  CAROUSEL_EVENTS, 
  CAROUSEL_DEFAULTS,
  CAROUSEL_ITEM_SIZES
} from './constants';

/**
 * TypeScript types and interfaces for the Carousel component
 * 
 * These provide proper type checking and IntelliSense support
 * when using the carousel component in TypeScript projects.
 * 
 * @category Components
 */
export { 
  CarouselConfig, 
  CarouselComponent, 
  CarouselSlide,
  CarouselLayout,
  CarouselScrollBehavior
} from './types';