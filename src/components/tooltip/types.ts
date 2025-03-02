// src/components/tooltip/types.ts
import { TOOLTIP_POSITIONS, TOOLTIP_VARIANTS } from './constants';

/**
 * Configuration interface for the Tooltip component
 * @category Components
 */
export interface TooltipConfig {
  /** 
   * Tooltip content text
   * @example 'Delete item'
   */
  text?: string;
  
  /** 
   * HTML element that triggers the tooltip
   * @example document.querySelector('#my-button')
   */
  target?: HTMLElement;
  
  /** 
   * Tooltip position relative to the target
   * @default 'bottom'
   */
  position?: keyof typeof TOOLTIP_POSITIONS | string;
  
  /** 
   * Tooltip variant that determines visual styling
   * @default 'default'
   */
  variant?: keyof typeof TOOLTIP_VARIANTS | string;
  
  /** 
   * Whether the tooltip is initially visible
   * @default false
   */
  visible?: boolean;
  
  /** 
   * Show delay in milliseconds
   * @default 300
   */
  showDelay?: number;
  
  /** 
   * Hide delay in milliseconds
   * @default 100
   */
  hideDelay?: number;
  
  /** 
   * Whether to show the tooltip on focus
   * @default true
   */
  showOnFocus?: boolean;
  
  /** 
   * Whether to show the tooltip on hover
   * @default true
   */
  showOnHover?: boolean;
  
  /** 
   * Additional CSS classes to add to the tooltip
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
   * Optional z-index for the tooltip
   */
  zIndex?: number;
  
  /**
   * Whether to enable rich (HTML) content
   * @default false
   */
  rich?: boolean;
}

/**
 * Tooltip component interface
 * @category Components
 */
export interface TooltipComponent {
  /** The tooltip's DOM element */
  element: HTMLElement;
  
  /** The tooltip's target element */
  target: HTMLElement | null;
  
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
   * Sets the tooltip text content
   * @param text - New text content
   * @returns The tooltip component for chaining
   */
  setText: (text: string) => TooltipComponent;
  
  /**
   * Gets the tooltip text content
   * @returns Tooltip text content
   */
  getText: () => string;
  
  /**
   * Sets the tooltip position
   * @param position - Position value
   * @returns The tooltip component for chaining
   */
  setPosition: (position: keyof typeof TOOLTIP_POSITIONS | string) => TooltipComponent;
  
  /**
   * Gets the current tooltip position
   * @returns Current position
   */
  getPosition: () => string;
  
  /**
   * Sets the tooltip target element
   * @param target - Element to attach tooltip to
   * @returns The tooltip component for chaining
   */
  setTarget: (target: HTMLElement) => TooltipComponent;
  
  /**
   * Shows the tooltip
   * @param immediate - Whether to show immediately (bypassing delay)
   * @returns The tooltip component for chaining
   */
  show: (immediate?: boolean) => TooltipComponent;
  
  /**
   * Hides the tooltip
   * @param immediate - Whether to hide immediately (bypassing delay)
   * @returns The tooltip component for chaining
   */
  hide: (immediate?: boolean) => TooltipComponent;
  
  /**
   * Checks if the tooltip is currently visible
   * @returns Whether the tooltip is visible
   */
  isVisible: () => boolean;
  
  /**
   * Updates the tooltip's position relative to its target
   * @returns The tooltip component for chaining
   */
  updatePosition: () => TooltipComponent;
  
  /**
   * Destroys the tooltip component and cleans up resources
   */
  destroy: () => void;
}