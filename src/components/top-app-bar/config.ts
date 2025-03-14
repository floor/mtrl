// src/components/top-app-bar/config.ts
/**
 * @module components/top-app-bar
 * @description Configuration for top app bar component
 */

import { createComponentConfig, BaseComponentConfig } from '../../core/config/component-config';
import { PREFIX } from '../../core/config';

/**
 * Top App Bar types
 */
export type TopAppBarType = 'small' | 'medium' | 'large' | 'center';

/**
 * Configuration options for top app bar
 */
export interface TopAppBarConfig extends BaseComponentConfig {
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
}

/**
 * Default configuration for top app bar
 */
export const defaultConfig: Partial<TopAppBarConfig> = {
  tag: 'header',
  type: 'small',
  scrollable: true,
  compressible: true,
  scrollThreshold: 4
};

/**
 * Creates the configuration for a top app bar component
 * 
 * @param {TopAppBarConfig} config - User provided configuration
 * @returns {TopAppBarConfig} Complete configuration with defaults applied
 */
export const createConfig = (config: TopAppBarConfig = {} as TopAppBarConfig): TopAppBarConfig => 
  createComponentConfig(defaultConfig, config, 'top-app-bar') as TopAppBarConfig;