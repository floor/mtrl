// src/components/card/types.ts
/**
 * Card variant types following Material Design 3 specifications
 * @enum {string}
 */
export enum CardVariant {
  /** Elevated card with shadow */
  ELEVATED = 'elevated',
  /** Filled card with higher surface container color */
  FILLED = 'filled',
  /** Outlined card with border */
  OUTLINED = 'outlined'
}

/**
 * Card elevation levels based on MD3 guidelines
 * @enum {number}
 */
export enum CardElevation {
  /** No elevation (for filled and outlined variants) */
  LEVEL0 = 0,
  /** Default elevation for elevated cards */
  LEVEL1 = 1,
  /** Elevation for hovered state */
  LEVEL2 = 2,
  /** Elevation for dragged state */
  LEVEL4 = 4
}

/**
 * Card configuration interface
 * @interface CardSchema
 */
export interface CardSchema {
  /** Card variant type (elevated, filled, outlined) */
  variant?: CardVariant;
  /** Whether the card is interactive */
  interactive?: boolean;
  /** Whether the card should take full width */
  fullWidth?: boolean;
  /** Whether the card is clickable (with ripple effect) */
  clickable?: boolean;
  /** Whether the card is draggable */
  draggable?: boolean;
  /** Additional CSS class(es) */
  class?: string;
  /** Header configuration */
  headerConfig?: CardHeaderConfig;
  /** Content configuration */
  contentConfig?: CardContentConfig;
  /** Actions configuration */
  actionsConfig?: CardActionsConfig;
  /** Media configuration */
  mediaConfig?: CardMediaConfig;
  /** ARIA attributes for accessibility */
  aria?: CardAriaAttributes;
}

/**
 * ARIA attributes for card accessibility
 * @interface CardAriaAttributes
 */
export interface CardAriaAttributes {
  /** ARIA label */
  label?: string;
  /** ARIA labelledby */
  labelledby?: string;
  /** ARIA describedby */
  describedby?: string;
  /** ARIA role (default is 'region' for non-interactive, 'button' for interactive) */
  role?: string;
  /** Additional ARIA attributes as key-value pairs */
  [key: string]: string | undefined;
}

/**
 * Card header configuration
 * @interface CardHeaderConfig
 */
export interface CardHeaderConfig {
  /** Header title text */
  title?: string;
  /** Header subtitle text */
  subtitle?: string;
  /** Avatar element or HTML string */
  avatar?: HTMLElement | string;
  /** Action element or HTML string */
  action?: HTMLElement | string;
  /** Additional CSS class(es) */
  class?: string;
}

/**
 * Card content configuration
 * @interface CardContentConfig
 */
export interface CardContentConfig {
  /** Text content */
  text?: string;
  /** HTML content */
  html?: string;
  /** Child elements */
  children?: HTMLElement[];
  /** Whether to add padding (true by default) */
  padding?: boolean;
  /** Additional CSS class(es) */
  class?: string;
}

/**
 * Card actions configuration
 * @interface CardActionsConfig
 */
export interface CardActionsConfig {
  /** Action elements */
  actions?: HTMLElement[];
  /** Whether actions should be full-bleed */
  fullBleed?: boolean;
  /** Whether actions should be stacked vertically */
  vertical?: boolean;
  /** Horizontal alignment */
  align?: 'start' | 'center' | 'end' | 'space-between';
  /** Additional CSS class(es) */
  class?: string;
}

/**
 * Card media configuration
 * @interface CardMediaConfig
 */
export interface CardMediaConfig {
  /** Image source URL */
  src?: string;
  /** Image alt text (required for accessibility) */
  alt?: string;
  /** Custom element instead of image */
  element?: HTMLElement;
  /** Aspect ratio */
  aspectRatio?: '16:9' | '4:3' | '1:1' | string;
  /** Whether media should use object-fit: contain */
  contain?: boolean;
  /** Additional CSS class(es) */
  class?: string;
}

/**
 * Base component interface
 * @interface BaseComponent
 */
export interface BaseComponent {
  /** The DOM element */
  element: HTMLElement;
  /** Get class name with prefix */
  getClass: (name?: string) => string;
  /** Get modifier class */
  getModifierClass: (base: string, modifier: string) => string;
  /** Get element class */
  getElementClass: (base: string, element: string) => string;
  /** Add CSS class(es) */
  addClass: (...classes: string[]) => BaseComponent;
  /** Emit an event */
  emit?: (event: string, data?: any) => void;
  /** Component configuration */
  config: CardComponentConfig;
  /** Touch state for touch interactions */
  touchState?: TouchState;
  /** Update touch state */
  updateTouchState?: (event: TouchEvent | MouseEvent, status: 'start' | 'end') => void;
  /** Component lifecycle methods */
  lifecycle?: ComponentLifecycle;
}

/**
 * Touch state interface for touch interactions
 * @interface TouchState
 */
export interface TouchState {
  /** Timestamp when touch started */
  startTime: number;
  /** Starting position */
  startPosition: { x: number; y: number };
  /** Whether touch is active */
  isTouching: boolean;
  /** Current touch target */
  activeTarget: EventTarget | null;
}

/**
 * Component lifecycle interface
 * @interface ComponentLifecycle
 */
export interface ComponentLifecycle {
  /** Called when component is mounted to DOM */
  mount?: () => void;
  /** Called when component is updated */
  update?: () => void;
  /** Called when component is destroyed */
  destroy: () => void;
}

/**
 * Card component configuration
 * @interface CardComponentConfig
 * @extends CardSchema
 */
export interface CardComponentConfig extends CardSchema {
  /** Component name */
  componentName: string;
  /** CSS class prefix */
  prefix: string;
}

/**
 * Card component interface with methods
 * @interface CardComponent
 * @extends BaseComponent
 */
export interface CardComponent extends BaseComponent {
  /** Add content to the card */
  addContent: (contentElement: HTMLElement) => CardComponent;
  /** Set the card header */
  setHeader: (headerElement: HTMLElement) => CardComponent;
  /** Add media to the card */
  addMedia: (mediaElement: HTMLElement, position?: 'top' | 'bottom') => CardComponent;
  /** Set the card actions */
  setActions: (actionsElement: HTMLElement) => CardComponent;
  /** Make the card draggable */
  makeDraggable: (dragStartCallback?: (event: DragEvent) => void) => CardComponent;
  /** Set focus to the card */
  focus: () => CardComponent;
  /** Destroy the card and clean up resources */
  destroy: () => void;
  
  /** Optional loading feature */
  loading?: LoadingFeature;
  /** Optional expandable feature */
  expandable?: ExpandableFeature;
  /** Optional swipeable feature */
  swipeable?: SwipeableFeature;
}

/**
 * Loading feature interface
 * @interface LoadingFeature
 */
export interface LoadingFeature {
  /** Check if loading state is active */
  isLoading: () => boolean;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

/**
 * Expandable feature interface
 * @interface ExpandableFeature
 */
export interface ExpandableFeature {
  /** Check if expanded state is active */
  isExpanded: () => boolean;
  /** Set expanded state */
  setExpanded: (expanded: boolean) => void;
  /** Toggle expanded state */
  toggleExpanded: () => void;
}

/**
 * Swipeable feature interface
 * @interface SwipeableFeature
 */
export interface SwipeableFeature {
  /** Reset swipe position */
  reset: () => void;
}

/**
 * API options interface
 * @interface ApiOptions
 */
export interface ApiOptions {
  /** Lifecycle methods */
  lifecycle: {
    /** Destroy callback */
    destroy: () => void;
  };
}