// src/components/slider/api.ts
import { SliderComponent, SliderEvent } from './types';
import { SLIDER_COLORS, SLIDER_EVENTS } from './types';
import { SLIDER_SIZES, SliderSize } from './constants';

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
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
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
export const withAPI = (options: ApiOptions) => 
  (component: { element: HTMLElement }): SliderComponent => {
    return {
      ...component as any,
      
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
      setColor(color: keyof typeof SLIDER_COLORS | typeof SLIDER_COLORS[keyof typeof SLIDER_COLORS]) {
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
        return options.text?.getText ? options.text.getText() : '';
      },
      
      setIcon(iconHtml: string) {
        if (options.icon?.setIcon) options.icon.setIcon(iconHtml);
        return this;
      },
      
      getIcon() {
        return options.icon?.getIcon ? options.icon.getIcon() : '';
      },
      
      // Event management
      on(event: keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS], handler: (event: SliderEvent) => void) {
        if (options.events?.on) options.events.on(event, handler);
        return this;
      },
      
      off(event: keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS], handler: (event: SliderEvent) => void) {
        if (options.events?.off) options.events.off(event, handler);
        return this;
      },
      
      // Lifecycle management
      destroy() {
        if (options.lifecycle?.destroy) options.lifecycle.destroy();
      }
    };
  };