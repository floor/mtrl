// src/components/tooltip/constants.ts

/**
 * Tooltip positions
 * @category Components
 */
export const TOOLTIP_POSITIONS = {
  /** Position above the target element */
  TOP: 'top',
  /** Position to the right of the target element */
  RIGHT: 'right',
  /** Position below the target element */
  BOTTOM: 'bottom',
  /** Position to the left of the target element */
  LEFT: 'left',
  /** Position above and aligned to the start of the target */
  TOP_START: 'top-start',
  /** Position above and aligned to the end of the target */
  TOP_END: 'top-end',
  /** Position to the right and aligned to the start of the target */
  RIGHT_START: 'right-start',
  /** Position to the right and aligned to the end of the target */
  RIGHT_END: 'right-end',
  /** Position below and aligned to the start of the target */
  BOTTOM_START: 'bottom-start',
  /** Position below and aligned to the end of the target */
  BOTTOM_END: 'bottom-end',
  /** Position to the left and aligned to the start of the target */
  LEFT_START: 'left-start',
  /** Position to the left and aligned to the end of the target */
  LEFT_END: 'left-end'
} as const;

/**
 * Tooltip visual variants
 * @category Components
 */
export const TOOLTIP_VARIANTS = {
  /** Standard tooltip with background and arrow */
  DEFAULT: 'default',
  /** Rich tooltip with support for HTML content */
  RICH: 'rich',
  /** Plain text tooltip with minimal styling */
  PLAIN: 'plain'
} as const;

/**
 * Tooltip events
 * @category Components
 */
export const TOOLTIP_EVENTS = {
  /** Fired when tooltip becomes visible */
  SHOW: 'show',
  /** Fired when tooltip becomes hidden */
  HIDE: 'hide',
  /** Fired when mouse enters target element */
  ENTER: 'enter',
  /** Fired when mouse leaves target element */
  LEAVE: 'leave'
} as const;

/**
 * Default configuration values for tooltip
 * @category Components
 */
export const TOOLTIP_DEFAULTS = {
  /** Default tooltip position */
  POSITION: TOOLTIP_POSITIONS.BOTTOM,
  /** Default visual variant */
  VARIANT: TOOLTIP_VARIANTS.DEFAULT,
  /** Default visibility state */
  VISIBLE: false,
  /** Default show delay in milliseconds */
  SHOW_DELAY: 300,
  /** Default hide delay in milliseconds */
  HIDE_DELAY: 100,
  /** Default offset from target in pixels */
  OFFSET: 8,
  /** Default arrow size in pixels */
  ARROW_SIZE: 8,
  /** Whether to show tooltip on focus by default */
  SHOW_ON_FOCUS: true,
  /** Whether to show tooltip on hover by default */
  SHOW_ON_HOVER: true,
  /** Whether to allow rich HTML content by default */
  RICH: false
} as const;

/**
 * CSS class names used by the tooltip component
 * @category Components
 */
export const TOOLTIP_CLASSES = {
  /** Root element class */
  ROOT: 'tooltip',
  /** Container for the tooltip content */
  CONTAINER: 'tooltip-container',
  /** Arrow element class */
  ARROW: 'tooltip-arrow',
  /** Content element class */
  CONTENT: 'tooltip-content',
  /** Visible state class */
  VISIBLE: 'tooltip--visible',
  /** Hidden state class */
  HIDDEN: 'tooltip--hidden',
  /** Default variant class */
  DEFAULT: 'tooltip--default',
  /** Rich variant class */
  RICH: 'tooltip--rich',
  /** Plain variant class */
  PLAIN: 'tooltip--plain',
  /** Position prefix - append position name (e.g. tooltip--top) */
  POSITION_PREFIX: 'tooltip--'
} as const;