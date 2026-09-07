// src/components/loading-indicator/config.ts
import {
  createComponentConfig,
  createElementConfig,
  BaseComponentConfig,
} from '../../core/config/component';
import { LoadingIndicatorConfig } from './types';
import { LOADING_INDICATOR_DEFAULTS } from './constants';

/**
 * Default configuration for the loading indicator
 */
export const defaultConfig: Partial<LoadingIndicatorConfig> = {
  size: LOADING_INDICATOR_DEFAULTS.SIZE,
  contained: false,
  ariaLabel: LOADING_INDICATOR_DEFAULTS.LABEL,
};

/**
 * Creates the base configuration
 * @param {LoadingIndicatorConfig} config - User provided configuration
 * @returns {LoadingIndicatorConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: LoadingIndicatorConfig = {}): LoadingIndicatorConfig =>
  createComponentConfig(
    defaultConfig as BaseComponentConfig,
    config as BaseComponentConfig,
    'loading-indicator'
  ) as LoadingIndicatorConfig;

/** Keeps a size within the 24–240 the guidelines allow */
export const clampSize = (size: number | undefined): number => {
  const value = typeof size === 'number' && Number.isFinite(size) ? size : LOADING_INDICATOR_DEFAULTS.SIZE;
  return Math.min(LOADING_INDICATOR_DEFAULTS.MAX_SIZE, Math.max(LOADING_INDICATOR_DEFAULTS.MIN_SIZE, value));
};

/** A value within 0–1, or null for indeterminate */
export const clampValue = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.min(1, Math.max(0, value));
};

/**
 * Element configuration: a progressbar, as the M3 accessibility guidance
 * asks, named after what is loading
 * @param {LoadingIndicatorConfig} config - Configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: LoadingIndicatorConfig) =>
  createElementConfig(config as BaseComponentConfig, {
    tag: 'div',
    attributes: {
      role: 'progressbar',
      'aria-label': config.ariaLabel || LOADING_INDICATOR_DEFAULTS.LABEL,
    },
  });

export default defaultConfig;
