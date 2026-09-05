// src/components/button-group/config.ts

import { createComponentConfig } from '../../core/config/component';
import {
  ButtonGroupConfig,
  ButtonGroupVariant,
  ButtonGroupOrientation,
  ButtonGroupDensity
} from './types';
import {
  BUTTON_GROUP_DEFAULTS,
  BUTTON_GROUP_DENSITY,
  BUTTON_GROUP_HEIGHTS,
  BUTTON_GROUP_RADII,
  BUTTON_GROUP_SIZE_TOKENS,
  BUTTON_GROUP_CONNECTED_GAP
} from './constants';

/**
 * Default configuration values for button groups
 * @internal
 */
export const DEFAULT_CONFIG: Partial<ButtonGroupConfig> = {
  kind: BUTTON_GROUP_DEFAULTS.KIND,
  selection: BUTTON_GROUP_DEFAULTS.SELECTION,
  shape: BUTTON_GROUP_DEFAULTS.SHAPE,
  size: BUTTON_GROUP_DEFAULTS.SIZE,
  required: false,
  variant: BUTTON_GROUP_DEFAULTS.VARIANT,
  orientation: BUTTON_GROUP_DEFAULTS.ORIENTATION,
  density: BUTTON_GROUP_DEFAULTS.DENSITY,
  ripple: BUTTON_GROUP_DEFAULTS.RIPPLE,
  equalWidth: BUTTON_GROUP_DEFAULTS.EQUAL_WIDTH,
  disabled: false,
  buttons: []
};

/**
 * Creates the base configuration for Button Group component
 * @param {ButtonGroupConfig} config - User provided configuration
 * @returns {ButtonGroupConfig} Complete configuration with defaults applied
 * @internal
 */
export const createBaseConfig = (
  config: ButtonGroupConfig = {}
): ButtonGroupConfig =>
  createComponentConfig(
    DEFAULT_CONFIG,
    config,
    'button-group'
  ) as ButtonGroupConfig;

/**
 * Generates element configuration for the Button Group container
 * @param {ButtonGroupConfig} config - Button Group configuration
 * @returns {Object} Element configuration object for withElement
 * @internal
 */
export const getContainerConfig = (config: ButtonGroupConfig) => {
  const variant = config.variant || BUTTON_GROUP_DEFAULTS.VARIANT;
  const orientation = config.orientation || BUTTON_GROUP_DEFAULTS.ORIENTATION;
  const density = config.density || BUTTON_GROUP_DEFAULTS.DENSITY;
  const kind = config.kind || BUTTON_GROUP_DEFAULTS.KIND;
  const selection = config.selection || BUTTON_GROUP_DEFAULTS.SELECTION;
  const labels = config.labels || BUTTON_GROUP_DEFAULTS.LABELS;
  const shape = config.shape || BUTTON_GROUP_DEFAULTS.SHAPE;
  const size = config.size || BUTTON_GROUP_DEFAULTS.SIZE;

  return {
    tag: 'div',
    componentName: 'button-group',
    attributes: {
      role: 'group',
      'aria-label': config.ariaLabel || 'Button group',
      'data-variant': variant,
      'data-orientation': orientation,
      'data-density': density,
      'data-kind': kind,
      'data-selection': selection,
      'data-shape': shape,
      'data-size': size,
      'data-labels': labels
    },
    className: [
      config.class,
      labels === 'selected' ? `${config.prefix}-button-group--labels-selected` : null,
      config.disabled ? `${config.prefix}-button-group--disabled` : null,
      `${config.prefix}-button-group--${orientation}`,
      `${config.prefix}-button-group--${variant}`,
      `${config.prefix}-button-group--${kind}`,
      `${config.prefix}-button-group--${shape}`,
      `${config.prefix}-button-group--size-${size}`,
      selection !== 'none' ? `${config.prefix}-button-group--selectable` : null,
      density !== BUTTON_GROUP_DENSITY.DEFAULT
        ? `${config.prefix}-button-group--density-${density}`
        : null,
      config.equalWidth ? `${config.prefix}-button-group--equal-width` : null
    ],
    interactive: true
  };
};

/**
 * Gets density-specific sizing values per MD3 specifications
 * @param {ButtonGroupDensity} density - The density level
 * @returns {Object} CSS variables with sizing values
 * @internal
 */
export const getDensityStyles = (
  density: ButtonGroupDensity
): Record<string, string> => {
  const height = BUTTON_GROUP_HEIGHTS[density] || BUTTON_GROUP_HEIGHTS.default;
  const radius = BUTTON_GROUP_RADII[density] || BUTTON_GROUP_RADII.default;

  return {
    '--button-group-height': `${height}px`,
    '--button-group-radius': `${radius}px`
  };
};

/** Size and kind tokens as custom properties (Material 3 button group specs) */
export const getSizeStyles = (
  size: ButtonGroupConfig['size'],
  kind: ButtonGroupConfig['kind']
): Record<string, string> => {
  const tokens = BUTTON_GROUP_SIZE_TOKENS[size || BUTTON_GROUP_DEFAULTS.SIZE] || BUTTON_GROUP_SIZE_TOKENS.s;
  const gap = kind === 'connected' ? BUTTON_GROUP_CONNECTED_GAP : tokens.standardGap;
  return {
    '--button-group-height': `${tokens.height}px`,
    '--button-group-gap': `${gap}px`,
    '--button-group-inner-corner': `${tokens.connectedCorner}px`,
    '--button-group-radius': `${tokens.height / 2}px`
  };
};

/**
 * Generates configuration for a button element within the group
 * @param {Object} buttonConfig - Button configuration
 * @param {number} index - Button index in the group
 * @param {number} total - Total number of buttons
 * @param {ButtonGroupConfig} groupConfig - Parent group configuration
 * @returns {Object} Button configuration with group-specific settings
 * @internal
 */
export const getButtonConfig = (
  buttonConfig: ButtonGroupConfig['buttons'][number],
  index: number,
  total: number,
  groupConfig: ButtonGroupConfig
) => {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const isSingle = total === 1;

  // Determine position class
  let positionClass = '';
  if (isSingle) {
    positionClass = `${groupConfig.prefix}-button-group__button--single`;
  } else if (isFirst) {
    positionClass = `${groupConfig.prefix}-button-group__button--first`;
  } else if (isLast) {
    positionClass = `${groupConfig.prefix}-button-group__button--last`;
  } else {
    positionClass = `${groupConfig.prefix}-button-group__button--middle`;
  }

  return {
    ...buttonConfig,
    variant: groupConfig.variant,
    disabled: groupConfig.disabled || buttonConfig.disabled,
    ripple: groupConfig.ripple,
    rippleConfig: groupConfig.rippleConfig,
    class: [
      `${groupConfig.prefix}-button-group__button`,
      positionClass,
      buttonConfig.class
    ].filter(Boolean).join(' ')
  };
};

/**
 * Maps variant name to button variant
 * @param {ButtonGroupVariant} variant - Group variant
 * @returns {string} Button variant name
 * @internal
 */
export const mapVariantToButton = (variant: ButtonGroupVariant): string => {
  return variant;
};

/**
 * Validates button group configuration
 * @param {ButtonGroupConfig} config - Configuration to validate
 * @returns {boolean} Whether configuration is valid
 * @internal
 */
export const validateConfig = (config: ButtonGroupConfig): boolean => {
  // Ensure buttons array exists
  if (!config.buttons || !Array.isArray(config.buttons)) {
    return false;
  }

  // Ensure icon-only buttons have aria-label
  for (const button of config.buttons) {
    if (button.icon && !button.text && !button.ariaLabel) {
      console.warn(
        'Button Group: Icon-only buttons require an ariaLabel for accessibility'
      );
    }
  }

  return true;
};
