// src/components/slider/api.ts
import { SliderColor, SliderComponent, SliderEvent } from "./types";
import type { EventCallback } from "../../core/state/emitter";
import { SLIDER_EVENTS } from "./types";
import { SliderSize } from "./constants";

/**
 * API options interface - structured by feature area
 */
/**
 * What withAPI needs handed to it. Exported because getApiConfig in config.ts
 * builds exactly this, so one description serves both.
 */
export interface ApiOptions {
  slider: {
    setValue: (value: number, triggerEvent?: boolean) => unknown;
    getValue: () => number;
    setSecondValue: (value: number, triggerEvent?: boolean) => unknown;
    getSecondValue: () => number | null;
    setMin: (min: number) => unknown;
    getMin: () => number;
    setMax: (max: number) => unknown;
    getMax: () => number;
    setStep: (step: number) => unknown;
    getStep: () => number;
    regenerateTicks: () => unknown;
  };
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  appearance: {
    // SliderColor, not string: the appearance feature accepts only the four
    // colour names, and a host declaring `string` cannot take it. FLO-114.
    setColor: (color: SliderColor) => void;
    getColor: () => string;
    setSize: (size: SliderSize) => void;
    getSize: () => string;
    showTicks: (show: boolean) => void;
    showCurrentValue: (show: boolean) => void;
  };
  text: {
    setText: (text: string) => void;
    getText: () => string;
  };
  icon: {
    setIcon: (html: string) => void;
    getIcon: () => string;
  };
  events: {
    on: (event: string, handler: EventCallback) => void;
    off: (event: string, handler: EventCallback) => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Enhances a slider component with a streamlined API
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Slider component
 */
export const withAPI =
  (options: ApiOptions) =>
  (component: { element: HTMLElement }): SliderComponent => {
    return {
      ...component,

      // Element access
      element: component.element,

      // Value management
      setValue(value: number, triggerEvent: boolean = true) {
        options.slider.setValue(value, triggerEvent);
        return this;
      },

      getValue() {
        return options.slider.getValue();
      },

      setSecondValue(value: number, triggerEvent: boolean = true) {
        options.slider.setSecondValue(value, triggerEvent);
        return this;
      },

      getSecondValue() {
        return options.slider.getSecondValue();
      },

      // Range management
      setMin(min: number) {
        options.slider.setMin(min);
        return this;
      },

      getMin() {
        return options.slider.getMin();
      },

      setMax(max: number) {
        options.slider.setMax(max);
        return this;
      },

      getMax() {
        return options.slider.getMax();
      },

      setStep(step: number) {
        options.slider.setStep(step);
        return this;
      },

      getStep() {
        return options.slider.getStep();
      },

      // State management
      enable() {
        options.disabled.enable();
        return this;
      },

      disable() {
        options.disabled.disable();
        return this;
      },

      isDisabled() {
        return options.disabled.isDisabled();
      },

      // Appearance management
      setColor(
        // SliderColor. This accepted the uppercase keys of SLIDER_COLORS too,
        // which neither the public SliderComponent.setColor nor the
        // implementation in features/states.ts has ever taken -- so a caller
        // typed against the component could not reach this branch anyway.
        color: SliderColor
      ) {
        options.appearance.setColor(color);
        return this;
      },

      getColor() {
        return options.appearance.getColor();
      },

      setSize(size: SliderSize) {
        options.appearance.setSize(size);
        return this;
      },

      getSize() {
        return options.appearance.getSize();
      },

      showTicks(show: boolean) {
        options.appearance.showTicks(show);
        return this;
      },

      showCurrentValue(show: boolean) {
        options.appearance.showCurrentValue(show);
        return this;
      },

      // Label and icon management
      setLabel(text: string) {
        if (options.text?.setText) options.text.setText(text);
        return this;
      },

      getLabel() {
        return options.text?.getText ? options.text.getText() : "";
      },

      setIcon(iconHtml: string) {
        if (options.icon?.setIcon) options.icon.setIcon(iconHtml);
        return this;
      },

      getIcon() {
        return options.icon?.getIcon ? options.icon.getIcon() : "";
      },

      // Event management
      on(
        event:
          | keyof typeof SLIDER_EVENTS
          | (typeof SLIDER_EVENTS)[keyof typeof SLIDER_EVENTS],
        handler: (event: SliderEvent) => void
      ) {
        if (options.events?.on) options.events.on(event, handler);
        return this;
      },

      off(
        event:
          | keyof typeof SLIDER_EVENTS
          | (typeof SLIDER_EVENTS)[keyof typeof SLIDER_EVENTS],
        handler: (event: SliderEvent) => void
      ) {
        if (options.events?.off) options.events.off(event, handler);
        return this;
      },

      // Lifecycle management
      destroy() {
        if (options.lifecycle?.destroy) options.lifecycle.destroy();
      },
    };
  };
