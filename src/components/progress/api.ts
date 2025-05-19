// src/components/progress/api.ts

import { ProgressComponent } from './types';
import { PROGRESS_CLASSES } from './constants';
import { addClass, removeClass } from '../../core/dom';

// SVG namespace for proper attribute setting
const SVG_NS = 'http://www.w3.org/2000/svg';

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

/**
 * Helper function to safely set SVG attributes using the proper namespace
 */
const setSvgAttribute = (element: SVGElement | HTMLElement, attr: string, value: string): void => {
  if (element instanceof SVGElement) {
    try {
      element.setAttributeNS(null, attr, value);
    } catch (error) {
      // Fallback to regular setAttribute if setAttributeNS fails
      element.setAttribute(attr, value);
    }
  } else {
    element.setAttribute(attr, value);
  }
};

/**
 * Helper to set SVG line properties with proper namespace
 */
const updateSvgLinePosition = (line: SVGElement | HTMLElement, x1: number | string, x2: number | string): void => {
  if (!line) return;
  
  if (line instanceof SVGElement) {
    setSvgAttribute(line, 'x1', String(x1));
    setSvgAttribute(line, 'x2', String(x2));
  }
};

export const withAPI = (options: any) => (comp: any): ProgressComponent => {
  // Get references to DOM elements
  const element = comp.element as HTMLElement;
  const track = comp.components.track as SVGElement;
  const indicator = comp.components.indicator as SVGElement ;
  const remainingElement = comp.components.remaining as SVGElement;
  const buffer = comp.components.buffer as SVGElement;
  const label = comp.components.label as HTMLElement | undefined;

  console.log('withAPI', options, comp)

  // Configuration
  const isCircular = element.classList.contains(comp.getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Directly sync the SVG with current value/state on initialization
  const syncInitialState = () => {
    if (options.state.isIndeterminate()) {
      // Ensure indeterminate class is applied
      addClass(element, PROGRESS_CLASSES.INDETERMINATE);
      element.removeAttribute('aria-valuenow');
      
      // Hide remaining element in indeterminate state
      if (remainingElement) {
        remainingElement.style.display = 'none';
      }
    } else {
      // Ensure we have the current value from aria-valuenow attribute or state
      let currentValue = options.value.getValue();
      
      // If the element has aria-valuenow attribute, use that value (it might have been set in HTML)
      const ariaValueNow = element.getAttribute('aria-valuenow');
      if (ariaValueNow !== null) {
        currentValue = parseFloat(ariaValueNow);
        
        // Update the state to match the DOM
        options.value.setValue(currentValue);
      }
      
      // Update visual representation of the progress
      updateProgress(currentValue, options.value.getMax());
    }
  };
  
  // Update progress visuals based on current state - SVG specific implementation
  const updateProgress = (value: number, max: number) => {
    if (options.state.isIndeterminate()) return;
    
    console.log('updateProgress', value, max)

    console.log(indicator, indicator instanceof SVGElement)

    const percentage = (value / max) * 100;
    
    // Update linear progress elements
    if (!isCircular) {
      // Update indicator line with percentage
      if (indicator instanceof SVGElement) {
        setSvgAttribute(indicator, 'x2', `${percentage}`);
      }
      
      // Update remaining line (starting after indicator with gap)
      if (remainingElement instanceof SVGElement) {
        const gap = 4; // 4px gap
        setSvgAttribute(remainingElement, 'x1', `${percentage + gap}`);
        remainingElement.style.display = percentage >= 100 ? 'none' : '';
      }
      
      // Update buffer if present
      if (buffer instanceof SVGElement) {
        const bufferValue = options.buffer.getBuffer();
        const bufferPercentage = (bufferValue / max) * 100;
        setSvgAttribute(buffer, 'x2', `${bufferPercentage}`);
      }
    } else {
      // Update circular progress
      if (indicator instanceof SVGElement) {
        // Calculate the circumference and stroke-dashoffset for a circle
        const radius = parseFloat(indicator.getAttribute('r') || '0');
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference - (percentage / 100 * circumference);
        
        setSvgAttribute(indicator, 'stroke-dasharray', `${circumference}`);
        setSvgAttribute(indicator, 'stroke-dashoffset', `${dashOffset}`);
        
        // Hide remaining circle if progress is 100%
        if (remainingElement) {
          remainingElement.style.display = percentage >= 100 ? 'none' : '';
        }
      }
    }
    
    // Update ARIA attributes (synchronize DOM with internal state)
    element.setAttribute('aria-valuenow', value.toString());
    
    // Update label if available
    if (label) {
      const formatter = options.label.formatter || ((v: number, m: number) => `${Math.round((v / m) * 100)}%`);
      label.textContent = formatter(value, max);
    }
  };
  
  // API implementation
  const api: ProgressComponent = {
    element,
    track,
    indicator,
    remainingElement,
    getClass: comp.getClass,
    
    // Value management
    getValue: options.value.getValue,
    setValue: (value: number) => {
      // Update value in state
      options.value.setValue(value);
      
      // Only update visuals if not in indeterminate state
      if (!options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }

      // Emit change event
      const event = new CustomEvent('change', { 
        detail: { value: options.value.getValue(), max: options.value.getMax() }
      });
      element.dispatchEvent(event);
      
      // Check if completed
      if (options.value.getValue() >= options.value.getMax()) {
        const completeEvent = new CustomEvent('complete', { 
          detail: { value: options.value.getValue(), max: options.value.getMax() }
        });
        element.dispatchEvent(completeEvent);
      }
      
      return api;
    },
    getMax: options.value.getMax,
    
    // Buffer management
    getBuffer: options.buffer.getBuffer,
    setBuffer: (value: number) => {
      options.buffer.setBuffer(value);
      
      // Update buffer element for linear variant
      if (!isCircular && buffer instanceof SVGElement && !options.state.isIndeterminate()) {
        const max = options.value.getMax();
        const bufferPercentage = (options.buffer.getBuffer() / max) * 100;
        setSvgAttribute(buffer, 'x2', `${bufferPercentage}`);
      }
      
      return api;
    },
    
    // Indeterminate state
    setIndeterminate: (indeterminate: boolean) => {
      const wasIndeterminate = options.state.isIndeterminate();
      options.state.setIndeterminate(indeterminate);
      
      // Only update if state changed
      if (wasIndeterminate !== indeterminate) {
        if (indeterminate) {
          // Enter indeterminate mode
          addClass(element, PROGRESS_CLASSES.INDETERMINATE);
          element.removeAttribute('aria-valuenow');
          
          if (remainingElement) {
            remainingElement.style.display = 'none';
          }
        } else {
          // Exit indeterminate mode
          removeClass(element, PROGRESS_CLASSES.INDETERMINATE);
          
          // Restore determinate state
          updateProgress(options.value.getValue(), options.value.getMax());
        }
      }
      
      return api;
    },
    isIndeterminate: options.state.isIndeterminate,
    
    // Label management
    showLabel: () => {
      if (options.label.show) options.label.show();
      return api;
    },
    hideLabel: () => {
      if (options.label.hide) options.label.hide();
      return api;
    },
    setLabelFormatter: (formatter) => {
      if (options.label.format) options.label.format(formatter);
      if (label) {
        label.textContent = formatter(options.value.getValue(), options.value.getMax());
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
    on: (event, handler) => {
      element.addEventListener(event, handler as EventListener);
      return api;
    },
    off: (event, handler) => {
      element.removeEventListener(event, handler as EventListener);
      return api;
    },
    
    // Cleanup
    destroy: options.lifecycle.destroy,
    
    // Extension points
    addClass: (...classes) => {
      classes.forEach(className => element.classList.add(className));
      return api;
    },
    
    // Required interfaces
    disabled: {
      enable: options.disabled.enable,
      disable: options.disabled.disable,
      isDisabled: options.disabled.isDisabled
    },
    
    lifecycle: {
      destroy: options.lifecycle.destroy
    }
  };
  
  // Initialize with current values - run on next tick to ensure DOM is ready
  setTimeout(() => {
    syncInitialState();
  }, 0);
  
  return api;
};