// src/components/snackbar/config.ts
import {
  createComponentConfig,
  createElementConfig,
  BaseComponentConfig,
} from '../../core/config/component';
import { SnackbarConfig, SnackbarDuration, BaseComponent, ApiOptions, SnackbarQueue } from './types';
import { SNACKBAR_DEFAULTS, SNACKBAR_DURATION_MS } from './constants';

/**
 * Default configuration for the Snackbar component
 */
export const defaultConfig: Partial<SnackbarConfig> = {
  position: SNACKBAR_DEFAULTS.POSITION,
  queueBehavior: SNACKBAR_DEFAULTS.QUEUE_BEHAVIOR,
  closeLabel: SNACKBAR_DEFAULTS.CLOSE_LABEL,
};

/**
 * Creates the base configuration for Snackbar component
 * @param {SnackbarConfig} config - User provided configuration
 * @returns {SnackbarConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SnackbarConfig): SnackbarConfig =>
  createComponentConfig(
    defaultConfig as BaseComponentConfig,
    config,
    'snackbar'
  ) as SnackbarConfig;

/**
 * Resolves a duration to milliseconds; 0 means the snackbar stays.
 *
 * Without a value, a snackbar with an action stays until acted on and one
 * without goes after 4 s (Compose `SnackbarHostState.showSnackbar`, and the
 * M3 accessibility guidance that actionable snackbars should not
 * auto-dismiss).
 */
export const durationToMs = (duration: SnackbarDuration | undefined, hasAction: boolean): number => {
  if (duration === undefined || duration === null) {
    return hasAction ? SNACKBAR_DURATION_MS.indefinite : SNACKBAR_DURATION_MS.short;
  }
  if (typeof duration === 'number') {
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
  }
  return SNACKBAR_DURATION_MS[duration] ?? SNACKBAR_DURATION_MS.short;
};

/**
 * Generates element configuration for the Snackbar component.
 *
 * `role="status"` is a polite, atomic live region: the message is announced
 * when it appears, after whatever the user is doing, and focus stays put
 * (M3 snackbar accessibility; Compose sets `LiveRegionMode.Polite`).
 * @param {SnackbarConfig} config - Snackbar configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SnackbarConfig) =>
  createElementConfig(config, {
    tag: 'div',
    attributes: { role: 'status' },
  });

/**
 * Creates text configuration for the Snackbar component
 * @param {SnackbarConfig} config - Snackbar configuration
 * @returns {Object} Text configuration object
 */
export const getTextConfig = (config: SnackbarConfig) => ({
  ...config,
  text: config.message,
});

/**
 * Creates API configuration for the Snackbar component
 * @param {BaseComponent} comp - Component with lifecycle feature
 * @param {SnackbarQueue} queue - Snackbar queue manager
 * @param {SnackbarConfig} config - The resolved configuration
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (
  comp: BaseComponent,
  queue: SnackbarQueue,
  config: SnackbarConfig
): ApiOptions => ({
  lifecycle: {
    destroy: comp.lifecycle?.destroy || (() => {}),
  },
  queue,
  config,
});

export default defaultConfig;
