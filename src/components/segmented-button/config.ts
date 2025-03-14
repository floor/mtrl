// src/components/segmented-button/config.ts
import { createComponentConfig } from '../../core/config/component-config';
import { SegmentedButtonConfig, SelectionMode } from './types';
import { DEFAULT_CONFIG, CLASSES } from './constants';

/**
 * Creates the base configuration for Segmented Button component
 * @param {SegmentedButtonConfig} config - User provided configuration
 * @returns {SegmentedButtonConfig} Complete configuration with defaults applied
 * @internal
 */
export const createBaseConfig = (config: SegmentedButtonConfig = {}): SegmentedButtonConfig => 
  createComponentConfig(DEFAULT_CONFIG, config, CLASSES.CONTAINER) as SegmentedButtonConfig;

/**
 * Generates element configuration for the Segmented Button container
 * @param {SegmentedButtonConfig} config - Segmented Button configuration
 * @returns {Object} Element configuration object for withElement
 * @internal
 */
export const getContainerConfig = (config: SegmentedButtonConfig) => ({
  tag: 'div',
  componentName: CLASSES.CONTAINER,
  attrs: {
    role: 'group',
    'aria-label': 'Segmented button',
    'data-mode': config.mode || SelectionMode.SINGLE
  },
  className: [
    config.class,
    config.disabled ? `${config.prefix}-${CLASSES.CONTAINER}--disabled` : null
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
      `${prefix}-${CLASSES.SEGMENT}`,
      segment.selected ? `${prefix}-${CLASSES.SEGMENT}--${CLASSES.SELECTED}` : null,
      isDisabled ? `${prefix}-${CLASSES.SEGMENT}--${CLASSES.DISABLED}` : null,
      segment.class
    ],
    forwardEvents: {
      click: (component) => !isDisabled
    },
    interactive: !isDisabled
  };
};