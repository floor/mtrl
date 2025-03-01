// src/components/card/types.ts

/**
 * Card variant types following Material Design 3
 */
export enum CardVariant {
  ELEVATED = 'elevated',
  FILLED = 'filled',
  OUTLINED = 'outlined'
}

/**
 * Card elevation levels
 */
export enum CardElevation {
  RESTING = 1,
  HOVERED = 2,
  DRAGGED = 4
}

/**
 * Interface for card configuration
 */
export interface CardSchema {
  variant?: CardVariant;
  interactive?: boolean;
  fullWidth?: boolean;
  clickable?: boolean;
  draggable?: boolean;
  class?: string;
  headerConfig?: CardHeaderConfig;
  contentConfig?: CardContentConfig;
  actionsConfig?: CardActionsConfig;
  mediaConfig?: CardMediaConfig;
}

/**
 * Interface for card header configuration
 */
export interface CardHeaderConfig {
  title?: string;
  subtitle?: string;
  avatar?: HTMLElement | string;
  action?: HTMLElement | string;
  class?: string;
}

/**
 * Interface for card content configuration
 */
export interface CardContentConfig {
  text?: string;
  html?: string;
  children?: HTMLElement[];
  padding?: boolean;
  class?: string;
}

/**
 * Interface for card actions configuration
 */
export interface CardActionsConfig {
  actions?: HTMLElement[];
  fullBleed?: boolean;
  vertical?: boolean;
  align?: 'start' | 'center' | 'end' | 'space-between';
  class?: string;
}

/**
 * Interface for card media configuration
 */
export interface CardMediaConfig {
  src?: string;
  alt?: string;
  element?: HTMLElement;
  aspectRatio?: '16:9' | '4:3' | '1:1' | string;
  contain?: boolean;
  class?: string;
}

/**
 * Base component interface
 */
export interface BaseComponent {
  element: HTMLElement;
  getClass: (name?: string) => string;
  getModifierClass: (base: string, modifier: string) => string;
  getElementClass: (base: string, element: string) => string;
  addClass: (...classes: string[]) => BaseComponent;
  emit?: (event: string, data?: any) => void;
  config: CardComponentConfig;
  touchState?: TouchState;
  updateTouchState?: (event: TouchEvent | MouseEvent, status: 'start' | 'end') => void;
  lifecycle?: ComponentLifecycle;
}

/**
 * Touch state interface
 */
export interface TouchState {
  startTime: number;
  startPosition: { x: number; y: number };
  isTouching: boolean;
  activeTarget: EventTarget | null;
}

/**
 * Component lifecycle interface
 */
export interface ComponentLifecycle {
  mount?: () => void;
  update?: () => void;
  destroy: () => void;
}

/**
 * Card component configuration
 */
export interface CardComponentConfig extends CardSchema {
  componentName: string;
  prefix: string;
}

/**
 * Card component interface
 */
export interface CardComponent extends BaseComponent {
  // Card-specific methods
  addContent: (contentElement: HTMLElement) => CardComponent;
  setHeader: (headerElement: HTMLElement) => CardComponent;
  addMedia: (mediaElement: HTMLElement, position?: 'top' | 'bottom') => CardComponent;
  setActions: (actionsElement: HTMLElement) => CardComponent;
  makeDraggable: (dragStartCallback?: (event: DragEvent) => void) => CardComponent;
  destroy: () => void;
  
  // Optional feature interfaces
  loading?: LoadingFeature;
  expandable?: ExpandableFeature;
  swipeable?: SwipeableFeature;
}

/**
 * Loading feature interface
 */
export interface LoadingFeature {
  isLoading: () => boolean;
  setLoading: (loading: boolean) => void;
}

/**
 * Expandable feature interface
 */
export interface ExpandableFeature {
  isExpanded: () => boolean;
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
}

/**
 * Swipeable feature interface
 */
export interface SwipeableFeature {
  reset: () => void;
}

/**
 * API options interface
 */
export interface ApiOptions {
  lifecycle: {
    destroy: () => void;
  };
}