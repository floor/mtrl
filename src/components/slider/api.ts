// src/components/slider/api.ts
import { SliderComponent, SliderEvent } from './types';
import { SLIDER_COLORS, SLIDER_SIZES, SLIDER_ORIENTATIONS, SLIDER_EVENTS } from './constants';

/**
 * API options interface - structured by feature area
 */
interface ApiOptions {
  slider: {
    setValue: (value: number, triggerEvent?: boolean) => any;
    getValue: () => number;
    setSecondValue: (value: number, triggerEvent?: boolean) => any;
    getSecondValue: () => number | null;
    setMin: (min: number) => any;
    getMin: () => number;
    setMax: (max: number) => any;
    getMax: () => number;
    setStep: (step: number) => any;
    getStep: () => number;
    regenerateTicks: () => any;
  };
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  appearance: {
    setColor: (color: string) => void;
    getColor: () => string;
    setSize: (size: string) => void;
    getSize: () => string;
    setOrientation: (orientation: string) => void;
    getOrientation: () => string;
    showTicks: (show: boolean) => void;
    showTickLabels: (show: boolean | string[]) => void;
    showCurrentValue: (show: boolean) => void;
  };
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Component with elements
 */
interface ComponentWithElements {
  element: HTMLElement;
}

/**
 * Enhances a slider component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Slider component
 */
export const withAPI = (options: ApiOptions) => 
  (component: ComponentWithElements): SliderComponent => {
    return {
      ...component as any,
      
      /**
       * Sets slider value
       * @param {number} value - New slider value
       * @param {boolean} [triggerEvent=true] - Whether to trigger change event
       * @returns {SliderComponent} Slider component instance for chaining
       */
      setValue(value: number, triggerEvent: boolean = true) {
        options.slider.setValue(value, triggerEvent);
        return this;
      },
      
      /**
       * Gets slider value
       * @returns {number} Current slider value
       */
      getValue() {
        return options.slider.getValue();
      },
      
      /**
       * Sets secondary slider value (for range slider)
       * @param {number} value - New secondary value
       * @param {boolean} [triggerEvent=true] - Whether to trigger change event
       * @returns {SliderComponent} Slider component instance for chaining
       */
      setSecondValue(value: number, triggerEvent: boolean = true) {
        options.slider.setSecondValue(value, triggerEvent);
        return this;
      },
      
      /**
       * Gets secondary slider value
       * @returns {number|null} Current secondary value or null
       */
      getSecondValue() {
        return options.slider.getSecondValue();
      },
      
      /**
       * Sets slider minimum value
       * @param {number} min - New minimum value
       * @returns {SliderComponent} Slider component instance for chaining
       */
      setMin(min: number) {
        options.slider.setMin(min);
        return this;
      },
      
      /**
       * Gets slider minimum value
       * @returns {number} Current minimum value
       */
      getMin() {
        return options.slider.getMin();
      },
      
      /**
       * Sets slider maximum value
       * @param {number} max - New maximum value
       * @returns {SliderComponent} Slider component instance for chaining
       */
      setMax(max: number) {
        options.slider.setMax(max);
        return this;
      },
      
      /**
       * Gets slider maximum value
       * @returns {number} Current maximum value
       */
      getMax() {
        return options.slider.getMax();
      },
      
      /**
       * Sets slider step size
       * @param {number} step - New step size
       * @returns {SliderComponent} Slider component instance for chaining
       */
      setStep(step: number) {
        options.slider.setStep(step);
        return this;
      },
      
      /**
       * Gets slider step size
       * @returns {number} Current step size
       */
      getStep() {
        return options.slider.getStep();
      },
      
      /**
       * Enables the slider
       * @returns {SliderComponent} Slider component instance for chaining
       */
      enable() {
        options.disabled.enable();
        return this;
      },
      
      /**
       * Disables the slider
       * @returns {SliderComponent} Slider component instance for chaining
       */
      disable() {
        options.disabled.disable();
        return this;
      },
      
      /**
       * Checks if slider is disabled
       * @returns {boolean} True if slider is disabled
       */
      isDisabled() {
        return options.disabled.isDisabled();
      },
      
      /**
       * Sets slider color
       * @param {string} color - Color variant
       * @returns {SliderComponent} Slider component instance for chaining
       */
      setColor(color: keyof typeof SLIDER_COLORS | typeof SLIDER_COLORS[keyof typeof SLIDER_COLORS]) {
        options.appearance.setColor(color);
        return this;
      },
      
      /**
       * Gets slider color
       * @returns {string} Current color name
       */
      getColor() {
        return options.appearance.getColor();
      },
      
      /**
       * Sets slider size
       * @param {string} size - Size variant
       * @returns {SliderComponent} Slider component instance for chaining
       */
      setSize(size: keyof typeof SLIDER_SIZES | typeof SLIDER_SIZES[keyof typeof SLIDER_SIZES]) {
        options.appearance.setSize(size);
        return this;
      },
      
      /**
       * Gets slider size
       * @returns {string} Current size name
       */
      getSize() {
        return options.appearance.getSize();
      },
      
      /**
       * Sets slider orientation
       * @param {string} orientation - Orientation variant
       * @returns {SliderComponent} Slider component instance for chaining
       */
      setOrientation(orientation: keyof typeof SLIDER_ORIENTATIONS | typeof SLIDER_ORIENTATIONS[keyof typeof SLIDER_ORIENTATIONS]) {
        options.appearance.setOrientation(orientation);
        return this;
      },
      
      /**
       * Gets slider orientation
       * @returns {string} Current orientation name
       */
      getOrientation() {
        return options.appearance.getOrientation();
      },
      
      /**
       * Shows or hides tick marks
       * @param {boolean} show - Whether to show ticks
       * @returns {SliderComponent} Slider component instance for chaining
       */
      showTicks(show: boolean) {
        options.appearance.showTicks(show);
        return this;
      },
      
      /**
       * Shows or hides tick labels
       * @param {boolean|string[]} show - Whether to show labels or array of label texts
       * @returns {SliderComponent} Slider component instance for chaining
       */
      showTickLabels(show: boolean | string[]) {
        options.appearance.showTickLabels(show);
        return this;
      },
      
      /**
       * Shows or hides current value while dragging
       * @param {boolean} show - Whether to show value bubble
       * @returns {SliderComponent} Slider component instance for chaining
       */
      showCurrentValue(show: boolean) {
        options.appearance.showCurrentValue(show);
        return this;
      },
      
      /**
       * Adds event listener
       * @param {string} event - Event name
       * @param {Function} handler - Event handler
       * @returns {SliderComponent} Slider component instance for chaining
       */
      on(event: keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS], handler: (event: SliderEvent) => void) {
        if (options.events && typeof options.events.on === 'function') {
          options.events.on(event, handler);
        }
        return this;
      },
      
      /**
       * Removes event listener
       * @param {string} event - Event name
       * @param {Function} handler - Event handler
       * @returns {SliderComponent} Slider component instance for chaining
       */
      off(event: keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS], handler: (event: SliderEvent) => void) {
        if (options.events && typeof options.events.off === 'function') {
          options.events.off(event, handler);
        }
        return this;
      },
      
      /**
       * Destroys the slider component and cleans up resources
       */
      destroy() {
        if (options.lifecycle && typeof options.lifecycle.destroy === 'function') {
          options.lifecycle.destroy();
        }
      }
    };
  };