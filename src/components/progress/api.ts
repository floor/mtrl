// src/components/progress/api.ts

import { ProgressComponent } from './types';
import { PROGRESS_CLASSES, PROGRESS_VARIANTS } from './constants';

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

export const withAPI = (options: any) => (comp: any): ProgressComponent => {
  // Get DOM elements
  const element = comp.element as HTMLElement;
  const trackElement = comp.trackElement as (HTMLElement | SVGElement);
  const indicatorElement = comp.indicatorElement as (HTMLElement | SVGElement);
  const remainingElement = element.querySelector(`.${comp.getClass(PROGRESS_CLASSES.REMAINING)}`) as (HTMLElement | SVGElement);
  const labelElement = comp.labelElement as HTMLElement | undefined;
  
  // Configuration
  const isCircular = element.classList.contains(comp.getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Reference to the API
  let api: ProgressComponent;
  
  // Update the visual representation
  const updateVisuals = () => {
    // Skip if in indeterminate mode
    if (options.state.isIndeterminate()) {
      return;
    }
    
    // Calculate percentage
    const max = options.value.getMax();
    const value = options.value.getValue();
    const percentage = (value / max) * 100;
    
    if (isCircular) {
      // Circular progress - update stroke-dashoffset
      // The circumference depends on the radius of the circle
      // We'll use the one from the indicator since it's the one we want to animate
      const circle = indicatorElement as SVGCircleElement;
      const radius = parseFloat(circle.getAttribute('r') || '0');
      const circumference = 2 * Math.PI * radius;
      
      // For indicator - we want it to show only the progress
      const indicatorOffset = circumference - (percentage / 100 * circumference);
      circle.style.strokeDasharray = `${circumference}`;
      circle.style.strokeDashoffset = `${indicatorOffset}`;
      
      // For remaining - we want it to show only after the indicator ends
      // We'll use the complementary dasharray/dashoffset
      if (remainingElement) {
        const remainingCircle = remainingElement as SVGCircleElement;
        remainingCircle.style.strokeDasharray = `${circumference}`;
        
        // Calculate the offset to start where the indicator ends
        // and end at the full circumference
        const remainingOffset = (percentage / 100 * circumference);
        remainingCircle.style.strokeDasharray = `${circumference - remainingOffset} ${remainingOffset}`;
        remainingCircle.style.strokeDashoffset = `0`;
      }
    } else {
      // Linear progress - update width
      indicatorElement.style.width = `${percentage}%`;
      
      // Update remaining element position and width
      if (remainingElement) {
        const htmlRemainingElement = remainingElement as HTMLElement;
        htmlRemainingElement.style.left = `calc(${percentage}% + 4px)`;
        htmlRemainingElement.style.width = `calc(${100 - percentage}% - 4px)`;
      }
      
      // Buffer handling (if applicable)
      const bufferElement = element.querySelector(`.${comp.getClass(PROGRESS_CLASSES.BUFFER)}`);
      if (bufferElement) {
        const bufferPercentage = (options.buffer.getBuffer() / max) * 100;
        (bufferElement as HTMLElement).style.width = `${bufferPercentage}%`;
      }
    }
    
    // Update label (if available)
    if (labelElement && options.label) {
      const formatter = options.label.formatter || ((v: number, m: number) => `${Math.round((v / m) * 100)}%`);
      labelElement.textContent = formatter(value, max);
    }
    
    // Update ARIA attributes
    element.setAttribute('aria-valuenow', value.toString());
    element.setAttribute('aria-valuemax', max.toString());
  };
  
  // API implementation
  api = {
    element,
    trackElement,
    indicatorElement,
    remainingElement,
    getClass: comp.getClass,
    
    // Value management
    getValue: options.value.getValue,
    setValue: (value: number) => {
      options.value.setValue(value);
      updateVisuals();
      
      // Emit change event
      const event = new CustomEvent('change', { detail: { value, max: options.value.getMax() } });
      element.dispatchEvent(event);
      
      // Check if completed (value >= max)
      if (value >= options.value.getMax()) {
        const completeEvent = new CustomEvent('complete', { detail: { value, max: options.value.getMax() } });
        element.dispatchEvent(completeEvent);
      }
      
      return api;
    },
    getMax: options.value.getMax,
    
    // Buffer management (for linear progress)
    getBuffer: options.buffer.getBuffer,
    setBuffer: (value: number) => {
      options.buffer.setBuffer(value);
      updateVisuals();
      return api;
    },
    
    // Indeterminate state
    setIndeterminate: (indeterminate: boolean) => {
      options.state.setIndeterminate(indeterminate);
      
      if (indeterminate) {
        element.classList.add(comp.getClass(PROGRESS_CLASSES.INDETERMINATE));
      } else {
        element.classList.remove(comp.getClass(PROGRESS_CLASSES.INDETERMINATE));
        updateVisuals();
      }
      
      return api;
    },
    isIndeterminate: options.state.isIndeterminate,
    
    // Label management
    showLabel: () => {
      if (options.label && options.label.show) {
        options.label.show();
        updateVisuals();
      }
      return api;
    },
    hideLabel: () => {
      if (options.label && options.label.hide) {
        options.label.hide();
      }
      return api;
    },
    setLabelFormatter: (formatter: (value: number, max: number) => string) => {
      if (options.label && options.label.format) {
        options.label.format(formatter);
        updateVisuals();
      }
      return api;
    },
    
    // Disabled state
    enable: () => {
      options.disabled.enable();
      return api;
    },
    disable: () => {
      options.disabled.disable();
      return api;
    },
    isDisabled: options.disabled.isDisabled,
    
    // Event handling
    on: (event: string, handler: Function) => {
      element.addEventListener(event, handler as EventListener);
      return api;
    },
    off: (event: string, handler: Function) => {
      element.removeEventListener(event, handler as EventListener);
      return api;
    },
    
    // Cleanup
    destroy: options.lifecycle.destroy,
    
    // Advanced features (for component consumers)
    addClass: (...classes: string[]) => {
      classes.forEach(className => element.classList.add(className));
      return api;
    },
    
    // Components extension requirements
    disabled: {
      enable: options.disabled.enable,
      disable: options.disabled.disable,
      isDisabled: options.disabled.isDisabled
    },
    
    lifecycle: {
      destroy: options.lifecycle.destroy
    }
  };
  
  // Initialize visual state
  updateVisuals();
  
  return api;
};