// src/components/slider/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { SliderConfig } from './types';
import { SLIDER_COLORS, SLIDER_SIZES, SLIDER_ORIENTATIONS } from './constants';

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
  orientation: SLIDER_ORIENTATIONS.HORIZONTAL,
  ticks: false,
  tickLabels: false,
  showValue: true,
  snapToSteps: true,
  range: false,
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
      'role': 'slider',
      'tabindex': config.disabled ? -1 : 0,
      'aria-disabled': config.disabled === true ? true : false,
      'aria-valuemin': config.min,
      'aria-valuemax': config.max,
      'aria-valuenow': config.value,
      'aria-orientation': config.orientation
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
  // Create safe accessor functions to avoid undefined errors
  const safeCall = (obj, path, fallback = () => {}) => {
    try {
      const parts = path.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current === undefined || current === null) return fallback;
        current = current[part];
      }
      
      return typeof current === 'function' ? current : fallback;
    } catch {
      return fallback;
    }
  };

  const safeGetter = (obj, path, defaultValue = null) => {
    try {
      const parts = path.split('.');
      let current = obj;
      
      for (const part of parts) {
        if (current === undefined || current === null) return defaultValue;
        current = current[part];
      }
      
      return current === undefined ? defaultValue : current;
    } catch {
      return defaultValue;
    }
  };

  // Create API configuration using safe accessors
  return {
    slider: {
      setValue: (value, triggerEvent) => safeCall(comp, 'slider.setValue')(value, triggerEvent),
      getValue: () => safeGetter(comp, 'slider.getValue', 0)(),
      setSecondValue: (value, triggerEvent) => safeCall(comp, 'slider.setSecondValue')(value, triggerEvent),
      getSecondValue: () => safeGetter(comp, 'slider.getSecondValue', null)(),
      setMin: (min) => safeCall(comp, 'slider.setMin')(min),
      getMin: () => safeGetter(comp, 'slider.getMin', 0)(),
      setMax: (max) => safeCall(comp, 'slider.setMax')(max),
      getMax: () => safeGetter(comp, 'slider.getMax', 100)(),
      setStep: (step) => safeCall(comp, 'slider.setStep')(step),
      getStep: () => safeGetter(comp, 'slider.getStep', 1)()
    },
    disabled: {
      enable: () => safeCall(comp, 'disabled.enable')(),
      disable: () => safeCall(comp, 'disabled.disable')(),
      isDisabled: () => safeGetter(comp, 'disabled.isDisabled', false)()
    },
    appearance: {
      setColor: (color) => safeCall(comp, 'appearance.setColor')(color),
      getColor: () => safeGetter(comp, 'appearance.getColor', 'primary')(),
      setSize: (size) => safeCall(comp, 'appearance.setSize')(size),
      getSize: () => safeGetter(comp, 'appearance.getSize', 'medium')(),
      setOrientation: (orientation) => safeCall(comp, 'appearance.setOrientation')(orientation),
      getOrientation: () => safeGetter(comp, 'appearance.getOrientation', 'horizontal')(),
      showTicks: (show) => safeCall(comp, 'appearance.showTicks')(show),
      showTickLabels: (show) => safeCall(comp, 'appearance.showTickLabels')(show),
      showCurrentValue: (show) => safeCall(comp, 'appearance.showCurrentValue')(show)
    },
    events: {
      on: (event, handler) => {
        if (comp && comp.events && typeof comp.events.on === 'function') {
          return comp.events.on(event, handler);
        }
        return undefined;
      },
      off: (event, handler) => {
        if (comp && comp.events && typeof comp.events.off === 'function') {
          return comp.events.off(event, handler);
        }
        return undefined;
      }
    },
    lifecycle: {
      destroy: () => safeCall(comp, 'lifecycle.destroy')()
    }
  };
};