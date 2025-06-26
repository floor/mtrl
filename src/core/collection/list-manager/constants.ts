/**
 * List Manager Constants
 * Centralized configuration values to avoid hardcoded numbers throughout the codebase
 */

/**
 * Rendering and Visibility Constants
 */
export const RENDERING = {
  /** Default item height in pixels */
  DEFAULT_ITEM_HEIGHT: 84,

  /** Legacy default item height for compatibility */
  LEGACY_ITEM_HEIGHT: 48,

  /** Number of extra items to render outside viewport (render buffer) */
  DEFAULT_RENDER_BUFFER_SIZE: 5,

  /** Number of items to keep in DOM but invisible (overscan) */
  DEFAULT_OVERSCAN_COUNT: 3,

  /** Default container height when actual height is 0 */
  DEFAULT_CONTAINER_HEIGHT: 400,

  /** Pool size limit for element recycling to prevent memory leaks */
  RECYCLING_POOL_LIMIT: 50,
} as const;

/**
 * Pagination and Loading Constants
 */
export const PAGINATION = {
  /** Default number of items per page */
  DEFAULT_PAGE_SIZE: 20,

  /** Default page number for initial load */
  INITIAL_PAGE: 1,

  /** Second page number for next loads */
  SECOND_PAGE: 2,

  /** Number of initial ranges/pages to fetch during list creation for smoother scrolling */
  INITIAL_RANGES_TO_FETCH: 2,

  /** Number of ranges/pages to fetch around target page during scroll jumps for smoother scrolling */
  SCROLL_JUMP_RANGES_TO_FETCH: 2,

  /** Threshold in pixels for loading previous page when near top */
  LOAD_PREVIOUS_THRESHOLD: 200,

  /** Distance in pixels from bottom of current page to trigger next page load */
  LOAD_NEXT_THRESHOLD: 100,

  /** Default fallback total item count when API doesn't provide it */
  FALLBACK_TOTAL_COUNT: 1000000,

  /** Adjacent page difference threshold (for boundary loads) */
  ADJACENT_PAGE_DIFF: 1,

  /** Large scroll jump detection threshold (number of pages) */
  LARGE_SCROLL_JUMP_THRESHOLD: 5,
} as const;

/**
 * Scroll and Performance Constants
 */
export const SCROLL = {
  /** Minimum scroll change in pixels to process scroll events */
  SCROLL_THRESHOLD: 5,

  /** Default throttle time for scroll events in milliseconds */
  DEFAULT_THROTTLE_MS: 16,

  /** Minimum time between load operations in milliseconds */
  LOAD_THROTTLE_MS: 100,

  /** Default load threshold as fraction (0-1) of total height */
  DEFAULT_LOAD_THRESHOLD: 0.8,

  /** Reset scroll position */
  RESET_SCROLL_TOP: 0,

  /** Debounce delay for scroll stop detection in milliseconds */
  SCROLL_STOP_DEBOUNCE: 300,
} as const;

/**
 * Boundary Detection Constants
 */
export const BOUNDARIES = {
  /** Number of item heights to use as boundary threshold */
  BOUNDARY_THRESHOLD_MULTIPLIER: 2,

  /** Delay in milliseconds before resetting page jump flag */
  PAGE_JUMP_RESET_DELAY: 500,

  /** Delay in milliseconds for data processing after page load */
  DATA_PROCESSING_DELAY: 100,

  /** Debounce delay for boundary page loads in milliseconds */
  BOUNDARY_LOAD_DEBOUNCE: 150,

  /** Debounce delay for large scroll jump page loads in milliseconds */
  SCROLL_JUMP_LOAD_DEBOUNCE: 200,

  /** Debounce delay for adjacent page loads in milliseconds */
  ADJACENT_PAGE_DEBOUNCE: 100,
} as const;

/**
 * Collection and State Constants
 */
export const COLLECTION = {
  /** Initial capacity for optimized collections */
  DEFAULT_INITIAL_CAPACITY: 50,

  /** Threshold for using binary search vs linear search */
  BINARY_SEARCH_THRESHOLD: 500,

  /** Small list threshold for simple rendering */
  SMALL_LIST_THRESHOLD: 10,
} as const;

/**
 * Animation and Timing Constants
 */
export const TIMING = {
  /** RequestAnimationFrame delay for DOM updates */
  RAF_DELAY: 50,

  /** Timeout for measurement operations */
  MEASUREMENT_TIMEOUT: 100,

  /** Interval for page change detection */
  PAGE_CHANGE_INTERVAL: 100,
} as const;

/**
 * API and Network Constants
 */
export const API = {
  /** Default parameter name for page size */
  DEFAULT_PER_PAGE_PARAM: "per_page",

  /** Default parameter name for limit */
  DEFAULT_LIMIT_PARAM: "limit",

  /** Default parameter name for offset */
  DEFAULT_OFFSET_PARAM: "offset",

  /** Default parameter name for cursor */
  DEFAULT_CURSOR_PARAM: "cursor",
} as const;

/**
 * Fake Data Generation Constants
 */
export const FAKE_DATA = {
  /** Enable/disable fake item generation for seamless infinite scroll */
  ENABLED: true,

  /** Number of real items to analyze for pattern detection */
  PATTERN_ANALYSIS_SAMPLE_SIZE: 10,

  /** Number of generated fake items to cache for performance */
  CACHE_SIZE: 50,

  /** Enable automatic pattern detection from real data */
  ENABLE_PATTERN_DETECTION: true,

  /** Simple fallback names when pattern detection fails */
  FALLBACK_NAMES: ["User", "Person", "Member", "Account", "Contact"],

  /** Fallback email domains for generating realistic emails */
  FALLBACK_DOMAINS: ["example.com", "demo.org", "test.net"],

  /** Prefix for fake item IDs to distinguish from real items */
  ID_PREFIX: "fake_",

  /** Mark fake items with this flag for identification */
  FAKE_FLAG: "__isFake",
} as const;

/**
 * Combined defaults for easy access
 */
export const DEFAULTS = {
  itemHeight: RENDERING.DEFAULT_ITEM_HEIGHT,
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  initialRangesToFetch: PAGINATION.INITIAL_RANGES_TO_FETCH,
  scrollJumpRangesToFetch: PAGINATION.SCROLL_JUMP_RANGES_TO_FETCH,
  renderBufferSize: RENDERING.DEFAULT_RENDER_BUFFER_SIZE,
  overscanCount: RENDERING.DEFAULT_OVERSCAN_COUNT,
  loadThreshold: SCROLL.DEFAULT_LOAD_THRESHOLD,
  throttleMs: SCROLL.DEFAULT_THROTTLE_MS,
  containerHeight: RENDERING.DEFAULT_CONTAINER_HEIGHT,
} as const;
