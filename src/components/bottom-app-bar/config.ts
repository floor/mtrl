// src/components/bottom-app-bar/config.ts
/**
 * @module components/bottom-app-bar
 * @description Configuration for bottom app bar component
 */

import { createComponentConfig, BaseComponentConfig } from '../../core/config/component-config';
import { PREFIX } from '../../core/config';
import { BottomAppBarConfig } from './types';

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