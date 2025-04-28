// src/components/sheet/constants.ts

/**
 * Sheet variants
 */
export const SHEET_VARIANTS = {
  /** Standard sheet with light elevation */
  STANDARD: 'standard',
  /** Modal sheet with overlay scrim */
  MODAL: 'modal',
  /** Expanded sheet that takes full screen */
  EXPANDED: 'expanded'
} as const;

/**
 * Sheet positions
 */
export const SHEET_POSITIONS = {
  /** Sheet appears from the bottom of the screen */
  BOTTOM: 'bottom',
  /** Sheet appears from the top of the screen */
  TOP: 'top',
  /** Sheet appears from the left of the screen */
  LEFT: 'left',
  /** Sheet appears from the right of the screen */
  RIGHT: 'right'
} as const;

/**
 * Sheet events
 */
export const SHEET_EVENTS = {
  /** Fired when sheet is opened */
  OPEN: 'open',
  /** Fired when sheet is closed */
  CLOSE: 'close',
  /** Fired when user starts dragging sheet */
  DRAG_START: 'dragstart',
  /** Fired when user finishes dragging sheet */
  DRAG_END: 'dragend'
} as const;

/**
 * Sheet elevation levels
 */
export const SHEET_ELEVATION = {
  /** Subtle elevation with minimal shadow */
  LEVEL_1: 1,
  /** Light elevation with small shadow */
  LEVEL_2: 2,
  /** Medium elevation with noticeable shadow */
  LEVEL_3: 3,
  /** High elevation with prominent shadow */
  LEVEL_4: 4,
  /** Maximum elevation with strong shadow */
  LEVEL_5: 5
} as const;

/**
 * Sheet default values
 */
export const SHEET_DEFAULTS = {
  /** Default sheet variant */
  VARIANT: SHEET_VARIANTS.STANDARD,
  /** Default position */
  POSITION: SHEET_POSITIONS.BOTTOM,
  /** Whether sheet is open by default */
  OPEN: false,
  /** Whether sheet can be dismissed by clicking outside */
  DISMISSIBLE: true,
  /** Whether to show drag handle by default */
  DRAG_HANDLE: true,
  /** Default elevation level */
  ELEVATION: SHEET_ELEVATION.LEVEL_3,
  /** Default title */
  TITLE: '',
  /** Default content */
  CONTENT: '',
  /** Default max height */
  MAX_HEIGHT: '80%',
  /** Whether gestures are enabled by default */
  ENABLE_GESTURES: true
} as const;

/**
 * Sheet animation timing values
 */
export const SHEET_ANIMATION = {
  /** Animation duration in milliseconds */
  DURATION: 300,
  /** Animation timing function */
  TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Animation delay in milliseconds */
  DELAY: 0
} as const;

/**
 * Sheet gesture thresholds
 */
export const SHEET_GESTURE = {
  /** Minimum velocity to trigger a swipe */
  MIN_VELOCITY: 0.3,
  /** Minimum distance to trigger a swipe */
  MIN_DISTANCE: 30,
  /** Percentage of height/width to dismiss sheet */
  DISMISS_THRESHOLD: 0.3
} as const;

/**
 * CSS classes for sheet elements
 */
export const SHEET_CLASSES = {
  /** Container element */
  CONTAINER: 'sheet',
  /** Overlay scrim */
  SCRIM: 'sheet__scrim',
  /** Main sheet panel */
  PANEL: 'sheet__panel',
  /** Drag handle */
  DRAG_HANDLE: 'sheet__drag-handle',
  /** Title container */
  TITLE: 'sheet__title',
  /** Content container */
  CONTENT: 'sheet__content',
  /** Standard variant */
  STANDARD: 'sheet--standard',
  /** Modal variant */
  MODAL: 'sheet--modal',
  /** Expanded variant */
  EXPANDED: 'sheet--expanded',
  /** Bottom position */
  BOTTOM: 'sheet--bottom',
  /** Top position */
  TOP: 'sheet--top',
  /** Left position */
  LEFT: 'sheet--left',
  /** Right position */
  RIGHT: 'sheet--right',
  /** Open state */
  OPEN: 'sheet--open',
  /** Dragging state */
  DRAGGING: 'sheet--dragging',
  /** Elevation modifier (sheet--elevation-1) */
  ELEVATION_PREFIX: 'sheet--elevation-'
} as const;