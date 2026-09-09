// src/components/sheet/types.ts

/**
 * Sheet variants
 */
export const SHEET_VARIANTS = {
  STANDARD: 'standard',
  MODAL: 'modal',
  EXPANDED: 'expanded'
} as const;

/**
 * Sheet positions
 */
export const SHEET_POSITIONS = {
  BOTTOM: 'bottom',
  TOP: 'top',
  LEFT: 'left',
  RIGHT: 'right'
} as const;

/**
 * Sheet events
 */
export const SHEET_EVENTS = {
  OPEN: 'open',
  CLOSE: 'close',
  DRAG_START: 'dragstart',
  DRAG_END: 'dragend'
} as const;

/**
 * Configuration interface for the Sheet component
 * @category Components
 */
export interface SheetConfig {
  /** 
   * Sheet variant that determines visual styling
   * @default 'standard'
   */
  variant?: keyof typeof SHEET_VARIANTS | string;
  
  /** 
   * Sheet position on the screen
   * @default 'bottom'
   */
  position?: keyof typeof SHEET_POSITIONS | string;
  
  /** 
   * Whether the sheet is initially open
   * @default false
   */
  open?: boolean;
  
  /** 
   * Whether the sheet can be dismissed by clicking the scrim
   * @default true
   */
  dismissible?: boolean;
  
  /** 
   * Whether to show a drag handle
   * @default true
   */
  dragHandle?: boolean;
  
  /** 
   * Content for the sheet
   * @example '<div>Sheet content</div>'
   */
  content?: string;
  
  /** 
   * Title for the sheet
   * @example 'Sheet Title'
   */
  title?: string;
  
  /** 
   * Additional CSS classes to add to the sheet
   * @example 'custom-sheet settings-panel'
   */
  class?: string;
  
  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;
  
  /**
   * Component name used in class generation
   */
  componentName?: string;
  
  /**
   * Elevation level for the sheet (1-5)
   * @default 3
   */
  elevation?: number;
  
  /**
   * Maximum height of the sheet (CSS value)
   * @example '80%'
   */
  maxHeight?: string;
  
  /**
   * Whether to enable gesture-based interactions
   * @default true
   */
  enableGestures?: boolean;
  
  /**
   * Callback when sheet is opened
   */
  onOpen?: () => void;
  
  /**
   * Callback when sheet is closed
   */
  onClose?: () => void;
}

/**
 * Content API interface for managing sheet content
 * @category Components
 */
export interface ContentAPI {
  /**
   * Sets the content HTML
   * @param html - HTML string for the content
   * @returns The content API for chaining
   */
  setContent: (html: string) => ContentAPI;
  
  /**
   * Gets the current content HTML
   * @returns HTML string for the content
   */
  getContent: () => string;
  
  /**
   * Gets the content DOM element
   * @returns The content element or null if not present
   */
  getElement: () => HTMLElement | null;
}

/**
 * Title API interface for managing sheet title
 * @category Components
 */
export interface TitleAPI {
  /**
   * Sets the title content
   * @param text - Title text
   * @returns The title API for chaining
   */
  setTitle: (text: string) => TitleAPI;
  
  /**
   * Gets the current title text
   * @returns Sheet title text
   */
  getTitle: () => string;
  
  /**
   * Gets the title DOM element
   * @returns The title element or null if not present
   */
  getElement: () => HTMLElement | null;
}

/**
 * Sheet component interface
 * @category Components
 */
export interface SheetComponent {
  /** The sheet's root DOM element */
  element: HTMLElement;
  
  /** The sheet's container DOM element */
  container: HTMLElement;
  
  /** API for managing sheet content */
  content: ContentAPI;
  
  /** API for managing sheet title */
  title: TitleAPI;
  
  /** API for managing sheet state */
  state: {
    /** Opens the sheet */
    open: () => void;
    /** Closes the sheet */
    close: () => void;
    /** Checks if the sheet is open */
    isOpen: () => boolean;
  };
  
  /** API for managing component lifecycle */
  lifecycle: {
    /** Destroys the component and cleans up resources */
    destroy: () => void;
  };
  
  /**
   * Gets a class name with the component's prefix
   * @param name - Base class name
   * @returns Prefixed class name
   */
  getClass: (name: string) => string;
  
  /**
   * Opens the sheet
   * @returns The sheet component for chaining
   */
  open: () => SheetComponent;
  
  /**
   * Closes the sheet
   * @returns The sheet component for chaining
   */
  close: () => SheetComponent;
  
  /**
   * Sets the sheet content
   * @param html - Content HTML
   * @returns The sheet component for chaining
   */
  setContent: (html: string) => SheetComponent;
  
  /**
   * Gets the sheet content HTML
   * @returns Content HTML
   */
  getContent: () => string;
  
  /**
   * Sets the sheet title
   * @param text - Title text
   * @returns The sheet component for chaining
   */
  setTitle: (text: string) => SheetComponent;
  
  /**
   * Gets the sheet title text
   * @returns Title text
   */
  getTitle: () => string;
  
  /**
   * Enables or disables the drag handle
   * @param enabled - Whether to show the drag handle
   * @returns The sheet component for chaining
   */
  setDragHandle: (enabled: boolean) => SheetComponent;
  
  /**
   * Sets the maximum height of the sheet
   * @param height - CSS value for max height
   * @returns The sheet component for chaining
   */
  setMaxHeight: (height: string) => SheetComponent;
  
  /**
   * Destroys the sheet component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the sheet
   * @param event - Event name ('open', 'close', etc.)
   * @param handler - Event handler function
   * @returns The sheet component for chaining
   */
  on: (event: string, handler: Function) => SheetComponent;
  
  /**
   * Removes an event listener from the sheet
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The sheet component for chaining
   */
  off: (event: string, handler: Function) => SheetComponent;
  
  /**
   * Adds CSS classes to the sheet element
   * @param classes - One or more class names to add
   * @returns The sheet component for chaining
   */
  addClass: (...classes: string[]) => SheetComponent;
}