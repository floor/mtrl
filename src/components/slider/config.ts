// src/components/slider/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { SliderConfig } from './types';
import { SLIDER_COLORS, SLIDER_SIZES } from './types';
import { createSliderSchema } from './schema';

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
  labelPosition: 'start',
  valueFormatter: (value) => value.toString()
};

/**
 * Creates the base configuration for Slider component
 * @param {SliderConfig} config - User provided configuration
 * @returns {SliderConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SliderConfig = {}): SliderConfig => {
  // Create the base config with defaults applied
  const baseConfig = createComponentConfig(defaultConfig, config, 'slider') as SliderConfig;
  
  // Create a basic component object for structure generation
  const baseComponent = {
    componentName: 'slider',
    config: baseConfig,
    getClass: (className) => {
      const prefix = baseConfig.prefix || 'mtrl';
      return `${prefix}-${className}`;
    }
  };
  
  // Add the structure definition to the config
  baseConfig.schema = createSliderSchema(baseComponent, baseConfig);
  
  return baseConfig;
};

/**
 * Generates element configuration for the Slider component
 * @param {SliderConfig} config - Slider configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SliderConfig) => 
  createElementConfig(config, {
    tag: 'div',
    attrs: {
      tabindex: '-1',
      'aria-disabled': config.disabled === true ? 'true' : 'false',
      role: 'none'
    },
    className: config.class
  });

/**
 * Creates API configuration for the Slider component
 * @param {Object} comp - Component with slider features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  slider: {
    setValue: (v, t) => comp.slider?.setValue(v, t),
    getValue: () => comp.slider?.getValue() ?? 0,
    setSecondValue: (v, t) => comp.slider?.setSecondValue(v, t),
    getSecondValue: () => comp.slider?.getSecondValue() ?? null,
    setMin: (m) => comp.slider?.setMin(m),
    getMin: () => comp.slider?.getMin() ?? 0,
    setMax: (m) => comp.slider?.setMax(m),
    getMax: () => comp.slider?.getMax() ?? 100,
    setStep: (s) => comp.slider?.setStep(s),
    getStep: () => comp.slider?.getStep() ?? 1,
    regenerateTicks: () => comp.slider?.regenerateTicks?.()
  },
  disabled: {
    enable: () => comp.disabled?.enable?.(),
    disable: () => comp.disabled?.disable?.(),
    isDisabled: () => comp.disabled?.isDisabled?.() ?? false
  },
  appearance: {
    setColor: (c) => comp.appearance?.setColor?.(c),
    getColor: () => comp.appearance?.getColor?.() ?? 'primary',
    setSize: (s) => comp.appearance?.setSize?.(s),
    getSize: () => comp.appearance?.getSize?.() ?? 'medium',
    showTicks: (s) => comp.appearance?.showTicks?.(s),
    showCurrentValue: (s) => comp.appearance?.showCurrentValue?.(s)
  },
  text: {
    setText: (t) => comp.label?.setText?.(t),
    getText: () => comp.label?.getText?.() ?? ''
  },
  icon: {
    setIcon: (h) => comp.icon?.setIcon?.(h),
    getIcon: () => comp.icon?.getIcon?.() ?? ''
  },
  events: {
    on: (e, h) => comp.on?.(e, h),
    off: (e, h) => comp.off?.(e, h)
  },
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.()
  }
});