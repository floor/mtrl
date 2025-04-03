// src/components/card/types.ts

/**
 * Card variant types following Material Design 3 guidelines.
 * - elevated: Card with shadow elevation (default)
 * - filled: Card with filled background color and no elevation
 * - outlined: Card with outline border and no elevation
 * 
 * @category Components
 */
export type CardVariant = 'elevated' | 'filled' | 'outlined';

/**
 * Card elevation levels in Material Design 3.
 * Specifies the shadow height in density-independent pixels (dp).
 * These values match the CARD_ELEVATION_LEVELS constants.
 * 
 * @category Components
 */
export type CardElevationLevel = 0 | 1 | 2 | 4;

/**
 * Button configuration interface for buttons shorthand.
 * Used in the card's `buttons` configuration property for simple button creation.
 * 
 * @interface ButtonConfig
 * @category Components
 */
export interface ButtonConfig {
  /** Button text content */
  text?: string;
  /** Button variant (text, outlined, filled, etc.) */
  variant?: string;
  /** Button icon HTML content */
  icon?: string;
  /** Additional button properties passed to button component */
  [key: string]: any;
}

/**
 * Card configuration interface defining all possible card options.
 * This is the primary configuration interface for creating card components.
 * 
 * @interface CardSchema
 * @category Components
 * @example
 * ```typescript
 * const cardConfig: CardSchema = {
 *   variant: 'elevated',
 *   interactive: true,
 *   header: {
 *     title: 'Card Title',
 *     subtitle: 'Secondary text'
 *   },
 *   content: {
 *     text: 'Card content text'
 *   },
 *   buttons: [
 *     { text: 'Action', variant: 'text' }
 *   ]
 * };
 * ```
 */
export interface CardSchema {
  /** Card variant type (elevated, filled, outlined) */
  variant?: CardVariant | string;
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
  
  // New inline configuration options
  /** Inline header configuration (alternative to headerConfig) */
  header?: CardHeaderConfig;
  /** Inline content configuration (alternative to contentConfig) */
  content?: CardContentConfig;
  /** Inline media configuration (alternative to mediaConfig) */
  media?: CardMediaConfig;
  /** Inline actions configuration (alternative to actionsConfig) */
  actions?: CardActionsConfig;
  /** Simple buttons array for actions (will be converted to actionsConfig) */
  buttons?: ButtonConfig[];

  /** Internal component name */
  componentName?: string;
  /** CSS class prefix */
  prefix?: string;
  /** Callback executed after component creation */
  afterCreation?: (component: BaseComponent) => void;
}

/**
 * ARIA attributes for card accessibility.
 * These attributes enhance the card's accessibility for assistive technologies.
 * 
 * @interface CardAriaAttributes
 * @category Components
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
 * Card header configuration.
 * Options for configuring the card's header section with title, subtitle, and actions.
 * 
 * @interface CardHeaderConfig
 * @category Components
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
 * Card content configuration.
 * Options for configuring the card's main content area.
 * 
 * @interface CardContentConfig
 * @category Components
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
 * Card actions configuration.
 * Options for configuring the card's action buttons area at the bottom.
 * 
 * @interface CardActionsConfig
 * @category Components
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
 * Card media configuration.
 * Options for configuring the card's media section (images or other media content).
 * 
 * @interface CardMediaConfig
 * @category Components
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
  /** 
   * Position of the media in the card
   * - 'top': Media appears at the top of the card (default)
   * - 'bottom': Media appears after the content
   */
  position?: 'top' | 'bottom';
}

/**
 * Base component interface.
 * Core interface that all components extend with basic functionality.
 * 
 * @interface BaseComponent
 * @category Components
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
 * Touch state interface for touch interactions.
 * Used to track touch events for interactive components.
 * 
 * @interface TouchState
 * @category Components
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
 * Component lifecycle interface.
 * Defines the lifecycle hooks for component creation, updates, and destruction.
 * 
 * @interface ComponentLifecycle
 * @category Components
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
 * Card component configuration.
 * Internal configuration object that extends the user-provided schema
 * with additional required properties.
 * 
 * @interface CardComponentConfig
 * @extends CardSchema
 * @category Components
 */
export interface CardComponentConfig extends CardSchema {
  /** Component name */
  componentName: string;
  /** CSS class prefix */
  prefix: string;
}

/**
 * Card component interface with methods.
 * This is the public API of the card component that users interact with.
 * 
 * @interface CardComponent
 * @extends BaseComponent
 * @category Components
 */
export interface CardComponent extends BaseComponent {
  /**
   * Adds content to the card.
   * This method appends content to the card component.
   * 
   * @param contentElement - The content element to add
   * @returns The card instance for chaining
   * @example
   * ```typescript
   * const content = document.createElement('div');
   * content.className = 'mtrl-card-content';
   * content.textContent = 'Card content goes here';
   * card.addContent(content);
   * ```
   */
  addContent: (contentElement: HTMLElement) => CardComponent;
  
  /**
   * Sets the card header.
   * Places the header element in the card. When media elements exist,
   * the header is placed after the last media element to ensure proper 
   * visual hierarchy following Material Design guidelines.
   * 
   * @param headerElement - The header element to add
   * @returns The card instance for chaining
   * @example
   * ```typescript
   * // Add a header after media
   * card.setHeader(headerElement);
   * ```
   */
  setHeader: (headerElement: HTMLElement) => CardComponent;
  
  /**
   * Adds media to the card.
   * Places media elements at the specified position in the card.
   * 
   * @param mediaElement - The media element to add
   * @param position - Position to place media ('top', 'bottom')
   * @returns The card instance for chaining
   * @example
   * ```typescript
   * // Creating media element
   * const media = document.createElement('div');
   * media.className = 'mtrl-card-media';
   * 
   * // Adding at the top (default)
   * card.addMedia(media);
   * 
   * // Or adding at the bottom
   * card.addMedia(media, 'bottom');
   * ```
   */
  addMedia: (mediaElement: HTMLElement, position?: 'top' | 'bottom') => CardComponent;
  
  /**
   * Sets the card actions section.
   * Replaces any existing actions with the provided actions element.
   * Actions typically contain buttons or other interactive controls,
   * and are placed at the bottom of the card.
   * 
   * @param actionsElement - The actions element to add
   * @returns The card instance for chaining
   * @example
   * ```typescript
   * // Create actions container
   * const actions = document.createElement('div');
   * actions.className = 'mtrl-card-actions';
   * 
   * // Add buttons to actions
   * const button = document.createElement('button');
   * button.textContent = 'Action';
   * actions.appendChild(button);
   * 
   * // Set actions on card
   * card.setActions(actions);
   * ```
   */
  setActions: (actionsElement: HTMLElement) => CardComponent;
  
  /**
   * Makes the card draggable.
   * Sets up native HTML5 drag and drop functionality and adds appropriate
   * accessibility attributes. Automatically updates ARIA attributes during drag.
   * 
   * @param dragStartCallback - Callback for drag start event
   * @returns The card instance for chaining
   * @example
   * ```typescript
   * // Basic draggable card
   * card.makeDraggable();
   * 
   * // With custom drag start handler
   * card.makeDraggable((event) => {
   *   // Set custom data or perform other actions on drag start
   *   event.dataTransfer.setData('text/plain', 'Card data');
   * });
   * ```
   */
  makeDraggable: (dragStartCallback?: (event: DragEvent) => void) => CardComponent;
  
  /**
   * Sets focus to the card.
   * Useful for programmatic focus management, especially in keyboard navigation
   * scenarios or after dynamic content changes.
   * 
   * @returns The card instance for chaining
   * @example
   * ```typescript
   * // Focus the card
   * card.focus();
   * 
   * // Can be chained with other methods
   * card.setHeader(headerElement).focus();
   * ```
   */
  focus: () => CardComponent;
  
  /**
   * Destroys the card component and removes event listeners.
   * Call this method when the card is no longer needed to prevent memory leaks.
   * 
   * @example
   * ```typescript
   * // Clean up resources when done with the card
   * card.destroy();
   * ```
   */
  destroy: () => void;
  
  /** Optional loading feature */
  loading?: LoadingFeature;
  /** Optional expandable feature */
  expandable?: ExpandableFeature;
  /** Optional swipeable feature */
  swipeable?: SwipeableFeature;
}

/**
 * Loading feature interface.
 * Provides methods to control loading state on the card.
 * 
 * @interface LoadingFeature
 * @category Components
 */
export interface LoadingFeature {
  /** Check if loading state is active */
  isLoading: () => boolean;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
}

/**
 * Expandable feature interface.
 * Provides methods to control the expanded/collapsed state of a card.
 * 
 * @interface ExpandableFeature
 * @category Components
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
 * Swipeable feature interface.
 * Provides methods to control the swipe behavior of a card.
 * 
 * @interface SwipeableFeature
 * @category Components
 */
export interface SwipeableFeature {
  /** Reset swipe position */
  reset: () => void;
}

/**
 * API options interface.
 * Configuration object for the card's API methods.
 * 
 * @interface ApiOptions
 * @category Components
 */
export interface ApiOptions {
  /** Lifecycle methods */
  lifecycle: {
    /** Destroy callback */
    destroy: () => void;
  };
}