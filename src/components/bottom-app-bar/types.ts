// src/components/bottom-app-bar/types.ts
/**
 * @module components/bottom-app-bar
 * @description Type definitions for Bottom App Bar component
 */

import { ElementComponent } from '../../core/compose';

/**
 * FAB position type for Bottom App Bar
 * @category Components
 */
export type FabPosition = 'center' | 'end';

/**
 * Configuration options for Bottom App Bar component
 * @category Components
 */
export interface BottomAppBarConfig {
  /**
   * Element to use for the container
   * @default 'div'
   */
  tag?: string;
  
  /**
   * Whether to show FAB in the bottom bar
   * @default false
   */
  hasFab?: boolean;
  
  /**
   * FAB position in bottom bar
   * @default 'end'
   */
  fabPosition?: FabPosition;
  
  /**
   * Additional CSS classes to apply
   */
  class?: string;
  
  /**
   * Whether to enable auto-hide on scroll
   * @default false
   */
  autoHide?: boolean;

  /**
   * Transition duration for show/hide in ms
   * @default 300
   */
  transitionDuration?: number;

  /**
   * Optional callback when scrolling shows/hides the bar
   */
  onVisibilityChange?: (visible: boolean) => void;

  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;

  /**
   * Component name for class generation
   */
  componentName?: string;
}

/**
 * Bottom App Bar component interface
 * @category Components
 */
export interface BottomAppBar extends ElementComponent {
  /**
   * Adds an action button to the bottom bar
   * @param {HTMLElement} button - Button element to add
   * @returns {BottomAppBar} BottomAppBar instance for chaining
   */
  addAction: (button: HTMLElement) => BottomAppBar;
  
  /**
   * Adds a floating action button to the bottom bar
   * @param {HTMLElement} fab - FAB element to add
   * @returns {BottomAppBar} BottomAppBar instance for chaining
   */
  addFab: (fab: HTMLElement) => BottomAppBar;
  
  /**
   * Shows the bottom bar
   * @returns {BottomAppBar} BottomAppBar instance for chaining
   */
  show: () => BottomAppBar;
  
  /**
   * Hides the bottom bar
   * @returns {BottomAppBar} BottomAppBar instance for chaining
   */
  hide: () => BottomAppBar;
  
  /**
   * Checks if the bottom bar is visible
   * @returns {boolean} Whether the bottom bar is visible
   */
  isVisible: () => boolean;

  /**
   * Get the actions container element
   * @returns {HTMLElement} Actions container element
   */
  getActionsContainer: () => HTMLElement;
}