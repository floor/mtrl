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
export const getApiConfig = (comp) => ({
  slider: {
    setValue: (value: number, triggerEvent?: boolean) => comp.slider.setValue(value, triggerEvent),
    getValue: () => comp.slider.getValue(),
    setSecondValue: (value: number, triggerEvent?: boolean) => comp.slider.setSecondValue(value, triggerEvent),
    getSecondValue: () => comp.slider.getSecondValue(),
    setMin: (min: number) => comp.slider.setMin(min),
    getMin: () => comp.slider.getMin(),
    setMax: (max: number) => comp.slider.setMax(max),
    getMax: () => comp.slider.getMax(),
    setStep: (step: number) => comp.slider.setStep(step),
    getStep: () => comp.slider.getStep()
  },
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable(),
    isDisabled: () => comp.disabled.isDisabled()
  },
  appearance: {
    setColor: (color: string) => comp.appearance.setColor(color),
    getColor: () => comp.appearance.getColor(),
    setSize: (size: string) => comp.appearance.setSize(size),
    getSize: () => comp.appearance.getSize(),
    setOrientation: (orientation: string) => comp.appearance.setOrientation(orientation),
    getOrientation: () => comp.appearance.getOrientation(),
    showTicks: (show: boolean) => comp.appearance.showTicks(show),
    showTickLabels: (show: boolean | string[]) => comp.appearance.showTickLabels(show),
    showCurrentValue: (show: boolean) => comp.appearance.showCurrentValue(show)
  },
  events: {
    on: (event: string, handler: Function) => comp.events.on(event, handler),
    off: (event: string, handler: Function) => comp.events.off(event, handler)
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});

export default defaultConfig;