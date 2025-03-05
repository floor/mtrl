// src/components/carousel/index.ts
/**
 * Carousel Component - Material Design 3 compatible carousel implementation
 * 
 * This module exports a carousel component with four layout types:
 * - Multi-browse: For browsing many visual items at once (photos, event feeds)
 * - Uncontained: For highly customized or text-heavy carousels (traditional behavior)
 * - Hero: For spotlighting very large visual items (featured content)
 * - Full-screen: For immersive vertical-scrolling experiences
 * 
 * And two scroll behaviors:
 * - Default: Standard scrolling without snapping, recommended for uncontained layouts
 * - Snap: Items snap to carousel layout, recommended for multi-browse, hero, and full-screen layouts
 * 
 * @module Carousel
 */

// Main factory function
export { default } from './carousel';

// Constants for use with the carousel
export { 
  CAROUSEL_LAYOUTS, 
  CAROUSEL_SCROLL_BEHAVIORS, 
  CAROUSEL_TRANSITIONS, 
  CAROUSEL_EVENTS, 
  CAROUSEL_DEFAULTS,
  CAROUSEL_ITEM_SIZES
} from './constants';

// TypeScript interfaces for proper type checking
export { 
  CarouselConfig, 
  CarouselComponent, 
  CarouselSlide,
  CarouselLayout,
  CarouselScrollBehavior
} from './types';