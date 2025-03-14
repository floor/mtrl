// src/components/top-app-bar/types.ts
/**
 * @module components/top-app-bar
 * @description Type definitions for Top App Bar component
 */

import { ElementComponent } from '../../core/compose';

/**
 * Top App Bar types
 * @category Components
 */
export type TopAppBarType = 'small' | 'medium' | 'large' | 'center';

/**
 * Configuration options for Top App Bar component
 * @category Components
 */
export interface TopAppBarConfig {
  /**
   * Element to use for the container
   * @default 'header'
   */
  tag?: string;
  
  /**
   * Type of top app bar to display
   * @default 'small'
   */
  type?: TopAppBarType;
  
  /**
   * Title text to display in the app bar
   */
  title?: string;
  
  /**
   * Whether to enable scrolling behavior
   * @default true
   */
  scrollable?: boolean;
  
  /**
   * Whether to compress medium/large variants to small on scroll
   * @default true
   */
  compressible?: boolean;
  
  /**
   * Scroll threshold in pixels to trigger the scrolled state
   * @default 4
   */
  scrollThreshold?: number;
  
  /**
   * Additional CSS classes to apply
   */
  class?: string;

  /**
   * Optional callback when scrolling changes the bar appearance
   */
  onScroll?: (scrolled: boolean) => void;

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
 * Top App Bar component interface
 * @category Components
 */
export interface TopAppBar extends ElementComponent {
  /**
   * Sets the title of the top app bar
   * @param {string} title - Title text
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  setTitle: (title: string) => TopAppBar;
  
  /**
   * Gets the current title
   * @returns {string} Current title text
   */
  getTitle: () => string;
  
  /**
   * Adds a leading navigation icon or element
   * @param {HTMLElement} element - Element to add to the leading section
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  addLeadingElement: (element: HTMLElement) => TopAppBar;
  
  /**
   * Adds a trailing action icon or element
   * @param {HTMLElement} element - Element to add to the trailing section
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  addTrailingElement: (element: HTMLElement) => TopAppBar;
  
  /**
   * Changes the top app bar type
   * @param {TopAppBarType} type - New app bar type
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  setType: (type: TopAppBarType) => TopAppBar;
  
  /**
   * Manually sets the scrolled state
   * @param {boolean} scrolled - Whether to show the scrolled state
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  setScrollState: (scrolled: boolean) => TopAppBar;
  
  /**
   * Gets the headline element
   * @returns {HTMLElement} Headline element
   */
  getHeadlineElement: () => HTMLElement;
  
  /**
   * Gets the leading container element
   * @returns {HTMLElement} Leading container element
   */
  getLeadingContainer: () => HTMLElement;
  
  /**
   * Gets the trailing container element
   * @returns {HTMLElement} Trailing container element
   */
  getTrailingContainer: () => HTMLElement;
}