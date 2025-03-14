// src/components/bottom-app-bar/config.ts
/**
 * @module components/bottom-app-bar
 * @description Configuration for bottom app bar component
 */

import { createComponentConfig, BaseComponentConfig } from '../../core/config/component-config';
import { PREFIX } from '../../core/config';

/**
 * Configuration options for bottom app bar
 */
export interface BottomAppBarConfig extends BaseComponentConfig {
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
  fabPosition?: 'center' | 'end';
  
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
}

/**
 * Default configuration for bottom app bar
 */
export const defaultConfig: Partial<BottomAppBarConfig> = {
  tag: 'div',
  hasFab: false,
  fabPosition: 'end',
  autoHide: false,
  transitionDuration: 300
};

/**
 * Creates the configuration for a bottom app bar component
 * 
 * @param {BottomAppBarConfig} config - User provided configuration
 * @returns {BottomAppBarConfig} Complete configuration with defaults applied
 */
export const createConfig = (config: BottomAppBarConfig = {} as BottomAppBarConfig): BottomAppBarConfig => 
  createComponentConfig(defaultConfig, config, 'bottom-app-bar') as BottomAppBarConfig;