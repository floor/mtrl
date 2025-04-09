// src/components/segmented-button/config.ts
import { createComponentConfig } from '../../core/config/component-config';
import { SegmentedButtonConfig, SelectionMode } from './types';

export const DEFAULT_CHECKMARK_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

/**
 * Default configuration values for segmented buttons
 * @internal
 */
export const DEFAULT_CONFIG = {
  mode: SelectionMode.SINGLE,
  ripple: true
};

/**
 * Creates the base configuration for Segmented Button component
 * @param {SegmentedButtonConfig} config - User provided configuration
 * @returns {SegmentedButtonConfig} Complete configuration with defaults applied
 * @internal
 */
export const createBaseConfig = (config: SegmentedButtonConfig = {}): SegmentedButtonConfig => 
  createComponentConfig(DEFAULT_CONFIG, config, 'segmented-button') as SegmentedButtonConfig;

/**
 * Generates element configuration for the Segmented Button container
 * @param {SegmentedButtonConfig} config - Segmented Button configuration
 * @returns {Object} Element configuration object for withElement
 * @internal
 */
export const getContainerConfig = (config: SegmentedButtonConfig) => ({
  tag: 'div',
  componentName: 'segmented-button',
  attrs: {
    role: 'group',
    'aria-label': 'Segmented button',
    'data-mode': config.mode || SelectionMode.SINGLE
  },
  className: [
    config.class,
    config.disabled ? `${config.prefix}-segmented-button--disabled` : null
  ],
  interactive: true
});

/**
 * Generates configuration for a segment element
 * @param {Object} segment - Segment configuration
 * @param {string} prefix - Component prefix
 * @param {boolean} groupDisabled - Whether the entire group is disabled
 * @returns {Object} Element configuration for the segment
 * @internal
 */
export const getSegmentConfig = (segment, prefix, groupDisabled = false) => {
  const isDisabled = groupDisabled || segment.disabled;
  
  return {
    tag: 'button',
    attrs: {
      type: 'button',
      role: 'button',
      disabled: isDisabled ? true : undefined,
      'aria-pressed': segment.selected ? 'true' : 'false',
      value: segment.value
    },
    className: [
      `${prefix}-button`,
      segment.selected ? `${prefix}-segment--selected` : null,
      isDisabled ? `${prefix}-segment--disabled` : null,
      segment.class
    ],
    forwardEvents: {
      click: (component) => !isDisabled
    },
    interactive: !isDisabled
  };
};