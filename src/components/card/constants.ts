// src/components/card/constants.ts

/**
 * Card variants following Material Design 3 guidelines
 * - ELEVATED: Card with shadow elevation (default)
 * - FILLED: Card with filled background color and no elevation
 * - OUTLINED: Card with outline border and no elevation
 */
export const CARD_VARIANTS = {
  ELEVATED: 'elevated',
  FILLED: 'filled',
  OUTLINED: 'outlined'
} as const;

/**
 * Card elevation levels in Material Design 3
 * Specifies the shadow height in density-independent pixels (dp)
 */
export const CARD_ELEVATIONS = {
  LEVEL0: 0,
  LEVEL1: 1,
  LEVEL2: 2,
  LEVEL4: 4
} as const;

/**
 * Card width constants
 * Provides standardized card widths based on Material Design
 */
export const CARD_WIDTHS = {
  SMALL: '344px',
  MEDIUM: '480px',
  LARGE: '624px',
  FULL: '100%'
} as const;

/**
 * Card corner radius options
 * Provides standardized corner radius values
 */
export const CARD_CORNER_RADIUS = {
  SMALL: '8px',
  MEDIUM: '12px',
  LARGE: '16px'
} as const;

/**
 * Card media aspect ratio options
 */
export const CARD_ASPECT_RATIOS = {
  SQUARE: '1:1',
  STANDARD: '4:3',
  WIDESCREEN: '16:9'
} as const;

/**
 * Card action alignment options
 */
export const CARD_ACTION_ALIGNMENT = {
  START: 'start',
  CENTER: 'center',
  END: 'end',
  SPACE_BETWEEN: 'space-between'
} as const;

/**
 * Card media position options
 */
export const CARD_MEDIA_POSITION = {
  TOP: 'top',
  BOTTOM: 'bottom'
} as const;

/**
 * CSS class names used in the card component
 */
export const CARD_CLASSES = {
  ROOT: 'card',
  HEADER: 'card-header',
  TITLE: 'card-title',
  SUBTITLE: 'card-subtitle',
  AVATAR: 'card-avatar',
  HEADER_ACTION: 'card-header-action',
  CONTENT: 'card-content',
  MEDIA: 'card-media',
  ACTIONS: 'card-actions',
  DRAGGABLE: 'card-draggable',
  INTERACTIVE: 'card-interactive',
  FULL_WIDTH: 'card-full-width',
  CLICKABLE: 'card-clickable',
  LOADING: 'card-loading',
  EXPANDED: 'card-expanded',
  ELEVATION_PREFIX: 'card-elevation-'
} as const;