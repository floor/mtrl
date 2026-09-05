// src/components/carousel/constants.ts

/**
 * Material 3 carousel layouts (m3.material.io carousel specs)
 */
export const CAROUSEL_VARIANTS = {
  /** At least one large, one medium and one small item; the default */
  MULTI_BROWSE: "multi-browse",
  /** Items keep one size and run off the trailing edge */
  UNCONTAINED: "uncontained",
  /** One large item and a small preview of the next */
  HERO: "hero",
  /** One large item centred between two small ones */
  HERO_CENTER: "hero-center",
  /** One edge-to-edge item at a time, scrolling vertically */
  FULL_SCREEN: "full-screen",
} as const;

export const CAROUSEL_EVENTS = {
  /** The snapped item changed; detail carries the index */
  CHANGE: "change",
} as const;

/**
 * Defaults from the Compose Material 3 carousel (CarouselDefaults) and the
 * carousel specs: 8dp between items, 16dp container padding, 28dp corners,
 * small items between 40 and 56dp, 10dp anchors just outside the container.
 */
export const CAROUSEL_DEFAULTS = {
  VARIANT: CAROUSEL_VARIANTS.MULTI_BROWSE,
  /** Preferred width of a large item; hero layouts use it as a maximum */
  ITEM_WIDTH: 280,
  GAP: 8,
  /** Full-screen layouts space items 16dp apart */
  GAP_FULL_SCREEN: 16,
  PADDING: 16,
  CORNER_RADIUS: 28,
  MIN_SMALL_ITEM_WIDTH: 40,
  MAX_SMALL_ITEM_WIDTH: 56,
  ANCHOR_SIZE: 10,
  MEDIUM_LARGE_THRESHOLD: 0.85,
  INITIAL_SLIDE: 0,
} as const;
