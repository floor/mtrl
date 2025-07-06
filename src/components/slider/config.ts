// src/components/slider/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { SliderConfig } from "./types";
import { SLIDER_DEFAULTS } from "./constants";

/**
 * Default configuration for the Slider component
 */
export const defaultConfig: SliderConfig = {
  min: SLIDER_DEFAULTS.MIN,
  max: SLIDER_DEFAULTS.MAX,
  value: SLIDER_DEFAULTS.VALUE,
  step: SLIDER_DEFAULTS.STEP,
  disabled: SLIDER_DEFAULTS.DISABLED,
  color: SLIDER_DEFAULTS.COLOR,
  size: SLIDER_DEFAULTS.SIZE,
  ticks: SLIDER_DEFAULTS.TICKS,
  showValue: SLIDER_DEFAULTS.SHOW_VALUE,
  snapToSteps: SLIDER_DEFAULTS.SNAP_TO_STEPS,
  range: SLIDER_DEFAULTS.RANGE,
  centered: SLIDER_DEFAULTS.CENTERED,
  iconPosition: SLIDER_DEFAULTS.ICON_POSITION,
  labelPosition: SLIDER_DEFAULTS.LABEL_POSITION,
  valueFormatter: (value) => value.toString(),
};

/**
 * Creates the base configuration for Slider component
 * @param {SliderConfig} config - User provided configuration
 * @returns {SliderConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SliderConfig = {}): SliderConfig => {
  // Create the base config with defaults applied
  const baseConfig = createComponentConfig(
    defaultConfig,
    config,
    "slider"
  ) as SliderConfig;

  // Schema is no longer needed as we use direct DOM creation

  return baseConfig;
};

/**
 * Generates element configuration for the Slider component
 * @param {SliderConfig} config - Slider configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SliderConfig) => {
  const classes = [
    "slider",
    config.class,
    config.disabled ? "slider--disabled" : "",
    config.size && config.size !== "XS"
      ? `slider--${
          typeof config.size === "string"
            ? config.size.toLowerCase()
            : config.size
        }`
      : "",
    config.color && config.color !== "primary" ? `slider--${config.color}` : "",
    config.range ? "slider--range" : "",
    config.centered ? "slider--centered" : "",
    config.icon ? "slider--icon" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Add aria attributes for the slider
  const attributes: Record<string, string> = {
    tabindex: "-1",
    role: "none",
    "aria-disabled": config.disabled ? "true" : "false",
    "aria-valuemin": String(config.min || 0),
    "aria-valuemax": String(config.max || 100),
    "aria-valuenow": String(config.value || config.min || 0),
  };

  return createElementConfig(config, {
    tag: "div",
    attributes,
    className: classes,
    forwardEvents: {
      click: true,
      keydown: true,
      touchstart: true,
      touchmove: true,
      touchend: true,
      mousedown: true,
      mousemove: true,
      mouseup: true,
    },
    interactive: true,
  });
};

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
    regenerateTicks: () => comp.slider?.regenerateTicks?.(),
  },
  disabled: {
    enable: () => comp.disabled?.enable?.(),
    disable: () => comp.disabled?.disable?.(),
    isDisabled: () => comp.disabled?.isDisabled?.() ?? false,
  },
  appearance: {
    setColor: (c) => comp.appearance?.setColor?.(c),
    getColor: () => comp.appearance?.getColor?.() ?? "primary",
    setSize: (s) => comp.setSize?.(s),
    getSize: () => comp.getSize?.() ?? "XS",
    showTicks: (s) => comp.appearance?.showTicks?.(s),
    showCurrentValue: (s) => comp.appearance?.showCurrentValue?.(s),
  },
  text: {
    setText: (t) => comp.label?.setText?.(t),
    getText: () => comp.label?.getText?.() ?? "",
  },
  icon: {
    setIcon: (h) => comp.icon?.setIcon?.(h),
    getIcon: () => comp.icon?.getIcon?.() ?? "",
  },
  events: {
    on: (e, h) => comp.on?.(e, h),
    off: (e, h) => comp.off?.(e, h),
  },
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.(),
  },
});
