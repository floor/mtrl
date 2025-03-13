// src/components/slider/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { SliderConfig } from './types';
import { SLIDER_COLORS, SLIDER_SIZES } from './constants';

/**
 * Default configuration for the Slider component
 */
export const defaultConfig: SliderConfig = {
  min: 0,
  max: 100,
  value: 0,
  step: 1,
  disabled: false,
  color: SLIDER_COLORS.PRIMARY,
  size: SLIDER_SIZES.MEDIUM,
  ticks: false,
  showValue: true,
  snapToSteps: true,
  range: false,
  iconPosition: 'start',
  labelPosition: 'start',  // Default to start position for labels
  valueFormatter: (value: number) => value.toString()
};

/**
 * Creates the base configuration for Slider component
 * @param {SliderConfig} config - User provided configuration
 * @returns {SliderConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SliderConfig = {}): SliderConfig => 
  createComponentConfig(defaultConfig, config, 'slider') as SliderConfig;

/**
 * Generates element configuration for the Slider component
 * @param {SliderConfig} config - Slider configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SliderConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    attrs: {
      // Accessibility improvement: Container is not focusable; only handles are
      'tabindex': '-1',
      'aria-disabled': config.disabled === true ? true : false,
      // ARIA attributes will be set directly on handles instead
      'role': 'none',
    },
    className: config.class
  });
};

/**
 * Creates API configuration for the Slider component
 * @param {Object} comp - Component with slider features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => {
  // Create API configuration using accessor pattern
  return {
    slider: {
      setValue: (value, triggerEvent) => comp.slider?.setValue(value, triggerEvent),
      getValue: () => comp.slider?.getValue() ?? 0,
      setSecondValue: (value, triggerEvent) => comp.slider?.setSecondValue(value, triggerEvent),
      getSecondValue: () => comp.slider?.getSecondValue() ?? null,
      setMin: (min) => comp.slider?.setMin(min),
      getMin: () => comp.slider?.getMin() ?? 0,
      setMax: (max) => comp.slider?.setMax(max),
      getMax: () => comp.slider?.getMax() ?? 100,
      setStep: (step) => comp.slider?.setStep(step),
      getStep: () => comp.slider?.getStep() ?? 1,
      regenerateTicks: () => comp.slider?.regenerateTicks?.()
    },
    disabled: {
      enable: () => comp.disabled?.enable?.(),
      disable: () => comp.disabled?.disable?.(),
      isDisabled: () => comp.disabled?.isDisabled?.() ?? false
    },
    appearance: {
      setColor: (color) => comp.appearance?.setColor?.(color),
      getColor: () => comp.appearance?.getColor?.() ?? 'primary',
      setSize: (size) => comp.appearance?.setSize?.(size),
      getSize: () => comp.appearance?.getSize?.() ?? 'medium',
      showTicks: (show) => comp.appearance?.showTicks?.(show),
      showCurrentValue: (show) => comp.appearance?.showCurrentValue?.(show)
    },
    text: {
      setText: (text) => comp.label?.setText?.(text),
      getText: () => comp.label?.getText?.() ?? ''
    },
    icon: {
      setIcon: (html) => comp.icon?.setIcon?.(html),
      getIcon: () => comp.icon?.getIcon?.() ?? ''
    },
    events: {
      on: (event, handler) => comp.on?.(event, handler),
      off: (event, handler) => comp.off?.(event, handler)
    },
    lifecycle: {
      destroy: () => comp.lifecycle?.destroy?.()
    }
  };
};