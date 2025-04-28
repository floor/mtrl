// src/components/top-app-bar/config.ts
/**
 * @module components/top-app-bar
 * @description Configuration for top app bar component
 */

import { createComponentConfig } from '../../core/config/component-config';
import { TopAppBarConfig } from './types';
import { TOP_APP_BAR_DEFAULTS } from './constants';

/**
 * Default configuration for top app bar
 */
export const defaultConfig: Partial<TopAppBarConfig> = {
  tag: TOP_APP_BAR_DEFAULTS.TAG,
  type: TOP_APP_BAR_DEFAULTS.TYPE,
  scrollable: TOP_APP_BAR_DEFAULTS.SCROLLABLE,
  compressible: TOP_APP_BAR_DEFAULTS.COMPRESSIBLE,
  scrollThreshold: TOP_APP_BAR_DEFAULTS.SCROLL_THRESHOLD
};

/**
 * Creates the configuration for a top app bar component
 * 
 * @param {TopAppBarConfig} config - User provided configuration
 * @returns {TopAppBarConfig} Complete configuration with defaults applied
 */
export const createConfig = (config: TopAppBarConfig = {} as TopAppBarConfig): TopAppBarConfig => 
  createComponentConfig(defaultConfig, config, 'top-app-bar') as TopAppBarConfig;