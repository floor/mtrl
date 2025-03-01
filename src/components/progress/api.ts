// src/components/progress/api.ts

import { ProgressComponent } from './types';
import { PROGRESS_EVENTS } from './constants';

interface ApiOptions {
  value: {
    getValue: () => number;
    setValue: (value: number) => void;
    getMax: () => number;
  };
  buffer: {
    getBuffer: () => number;
    setBuffer: (value: number) => void;
  };
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  label: {
    show: () => void;
    hide: () => void;
    format: (formatter: (value: number, max: number) => string) => void;
    setContent: (content: string) => void;
  };
  state: {
    setIndeterminate: (indeterminate: boolean) => void;
    isIndeterminate: () => boolean;
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  trackElement: HTMLElement;
  indicatorElement: HTMLElement;
  labelElement?: HTMLElement;
  getClass: (name: string) => string;
  emit: (event: string, data?: any) => void;
}

/**
 * Enhances a progress component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Progress component
 */
export const withAPI = (options: ApiOptions) => 
  (component: ComponentWithElements): ProgressComponent => ({
    ...component as any,
    
    setValue(value: number) {
      options.value.setValue(value);
      
      // Update the visual indicator
      if (!options.state.isIndeterminate()) {
        const percent = (value / options.value.getMax()) * 100;
        
        if (component.getClass('progress').includes('linear')) {
          component.indicatorElement.style.width = `${percent}%`;
        } else {
          // Circular progress calculation
          const circumference = 2 * Math.PI * 45; // r=45 is the SVG circle radius
          const strokeDasharray = circumference;
          const strokeDashoffset = circumference * (1 - percent / 100);
          
          if (component.indicatorElement instanceof SVGElement) {
            component.indicatorElement.style.strokeDasharray = `${strokeDasharray}`;
            component.indicatorElement.style.strokeDashoffset = `${strokeDashoffset}`;
          }
        }
      }
      
      // Update label if present
      if (component.labelElement) {
        const formatter = (v: number, max: number) => `${Math.round((v / max) * 100)}%`;
        component.labelElement.textContent = formatter(value, options.value.getMax());
      }
      
      component.emit(PROGRESS_EVENTS.VALUE_CHANGE, { value });
      return this;
    },
    
    getValue() {
      return options.value.getValue();
    },
    
    setBuffer(value: number) {
      options.buffer.setBuffer(value);
      
      if (component.getClass('progress').includes('linear')) {
        const bufferElement = component.element.querySelector(`.${component.getClass('progress')}-buffer`);
        if (bufferElement) {
          const percent = (value / options.value.getMax()) * 100;
          (bufferElement as HTMLElement).style.width = `${percent}%`;
        }
      }
      
      return this;
    },
    
    getBuffer() {
      return options.buffer.getBuffer();
    },
    
    enable() {
      options.disabled.enable();
      component.element.removeAttribute('aria-disabled');
      return this;
    },
    
    disable() {
      options.disabled.disable();
      component.element.setAttribute('aria-disabled', 'true');
      return this;
    },
    
    isDisabled() {
      return options.disabled.isDisabled();
    },
    
    showLabel() {
      options.label.show();
      return this;
    },
    
    hideLabel() {
      options.label.hide();
      return this;
    },
    
    setLabelFormatter(formatter: (value: number, max: number) => string) {
      options.label.format(formatter);
      
      // Update the current label with the new formatter
      if (component.labelElement) {
        const value = this.getValue();
        const max = options.value.getMax();
        component.labelElement.textContent = formatter(value, max);
      }
      
      return this;
    },
    
    setIndeterminate(indeterminate: boolean) {
      const wasIndeterminate = options.state.isIndeterminate();
      options.state.setIndeterminate(indeterminate);
      
      // Toggle the indeterminate class
      const indeterminateClass = `${component.getClass('progress')}--indeterminate`;
      
      if (indeterminate) {
        component.element.classList.add(indeterminateClass);
        component.element.setAttribute('aria-valuenow', '');
      } else {
        component.element.classList.remove(indeterminateClass);
        const value = this.getValue();
        component.element.setAttribute('aria-valuenow', value.toString());
        this.setValue(value); // Update the visual state
      }
      
      if (wasIndeterminate !== indeterminate) {
        component.emit(PROGRESS_EVENTS.STATE_CHANGE, { indeterminate });
      }
      
      return this;
    },
    
    isIndeterminate() {
      return options.state.isIndeterminate();
    },
    
    destroy() {
      options.lifecycle.destroy();
    }
  });