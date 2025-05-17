// src/components/progress/api.ts

import { ProgressComponent } from './types';
import { PROGRESS_CLASSES, PROGRESS_VARIANTS } from './constants';
import { PREFIX } from '../../core/config';
import { addClass, removeClass } from '../../core/dom';

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
  // Get references to DOM elements
  const element = comp.element as HTMLElement;
  const indicatorElement = comp.indicatorElement;
  const remainingElement = comp.remainingElement;
  const bufferElement = comp.bufferElement;
  const labelElement = comp.labelElement as HTMLElement | undefined;
    
  // Configuration
  const isCircular = element.classList.contains(comp.getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Update progress visuals based on current state
  const updateProgress = (value: number, max: number) => {
    if (options.state.isIndeterminate()) return;
    
    const percentage = (value / max) * 100;
    
    // Update linear progress elements
    if (!isCircular) {
      // Check if we're using SVG-based linear progress
      const isSvgLinear = indicatorElement instanceof SVGElement;
      
      if (isSvgLinear) {
        // Update SVG line elements
        if (indicatorElement) {
          // Update indicator line x2 attribute 
          indicatorElement.setAttribute('x2', `${percentage}`);
        }
        
        // Update remaining position with 4px gap
        if (remainingElement) {
          const gap = 4;
          remainingElement.setAttribute('x1', `${percentage + gap}`);
          remainingElement.style.display = percentage >= 100 ? 'none' : 'block';
        }
        
        // Update buffer element if present
        if (bufferElement) {
          const bufferValue = options.buffer.getBuffer();
          const bufferPercentage = (bufferValue / max) * 100;
          bufferElement.setAttribute('x2', `${bufferPercentage}`);
        }
      } else {
        // Legacy div-based progress
        // Update indicator width
        if (indicatorElement) {
          indicatorElement.style.width = `${percentage}%`;
        }
        
        // Update remaining position with 4px gap
        if (remainingElement) {
          console.log('[Progress] Updating remaining element:', `left: calc(${percentage}% + 4px), width: calc(${100 - percentage}% - 4px)`);
          remainingElement.style.left = `calc(${percentage}% + 4px)`;
          remainingElement.style.width = `calc(${100 - percentage}% - 4px)`;
          remainingElement.style.display = percentage >= 100 ? 'none' : 'block';
        }
      }
    } else {
      // Update circular progress
      if (indicatorElement) {
        // Update indicator circle
        const radius = parseFloat(indicatorElement.getAttribute('r') || '0');
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference - (percentage / 100 * circumference);
        
        indicatorElement.style.strokeDasharray = `${circumference}`;
        indicatorElement.style.strokeDashoffset = `${dashOffset}`;
        
        // Update remaining circle (complementary)
        if (remainingElement) {
          remainingElement.style.display = percentage >= 100 ? 'none' : 'block';
        }
      }
    }
    
    // Update ARIA attributes
    element.setAttribute('aria-valuenow', value.toString());
    
    // Update label if available
    if (labelElement) {
      const formatter = options.label.formatter || ((v: number, m: number) => `${Math.round((v / m) * 100)}%`);
      labelElement.textContent = formatter(value, max);
    }
  };
  
  // API implementation
  const api: ProgressComponent = {
    element,
    trackElement: comp.trackElement,
    indicatorElement,
    remainingElement,
    getClass: comp.getClass,
    
    // Value management
    getValue: options.value.getValue,
    setValue: (value: number) => {
      // Log initial request
      console.log('[Progress] setValue called with:', value);
      console.log('[Progress] Component state:', {
        isIndeterminate: options.state.isIndeterminate(),
        element: element,
        indicatorElement: indicatorElement,
        remainingElement: remainingElement
      });
      
      // Update value in state
      options.value.setValue(value);
      
      // Log after state update
      console.log('[Progress] State after setValue:', {
        value: options.value.getValue(),
        max: options.value.getMax()
      });
      
      // Only update visuals if not in indeterminate state
      if (!options.state.isIndeterminate()) {
        console.log('[Progress] Updating visuals with value:', value);
        // Update visuals
        updateProgress(options.value.getValue(), options.value.getMax());
      } else {
        console.log('[Progress] Not updating visuals because component is in indeterminate state');
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
      
      // Directly update buffer element for linear variant
      if (!isCircular && bufferElement && !options.state.isIndeterminate()) {
        const max = options.value.getMax();
        const bufferPercentage = (options.buffer.getBuffer() / max) * 100;
        
        // Check if we're using SVG-based linear progress
        if (bufferElement instanceof SVGElement) {
          bufferElement.setAttribute('x2', `${bufferPercentage}`);
        } else {
          bufferElement.style.width = `${bufferPercentage}%`;
        }
      }
      
      return api;
    },
    
    // Indeterminate state
    setIndeterminate: (indeterminate: boolean) => {
      console.log('[Progress] setIndeterminate called with:', indeterminate);
      
      const wasIndeterminate = options.state.isIndeterminate();
      options.state.setIndeterminate(indeterminate);
      
      // Only update if state changed
      if (wasIndeterminate !== indeterminate) {
        console.log('[Progress] Changing indeterminate state from', wasIndeterminate, 'to', indeterminate);
        
        if (indeterminate) {
          // Enter indeterminate mode
          addClass(element, PROGRESS_CLASSES.INDETERMINATE);
          element.removeAttribute('aria-valuenow');
          
          // Check if we're using SVG-based linear progress
          const isSvgLinear = !isCircular && indicatorElement instanceof SVGElement;
          
          if (isSvgLinear) {
            // For SVG linear progress, we'll use CSS animations via the indeterminate class
            // Clear any attributes that might interfere with the CSS animations
            if (indicatorElement) {
              indicatorElement.removeAttribute('x2');
            }
            
            // Hide the remaining element
            if (remainingElement) {
              remainingElement.style.display = 'none';
            }
          } else if (!isCircular && indicatorElement && indicatorElement instanceof HTMLElement) {
            // For traditional linear progress, let CSS handle the animations
            // Clear any inline styles that might interfere with the CSS animations
            indicatorElement.style.width = '';
            indicatorElement.style.left = '';
          }
          
          // For linear indeterminate, hide the remaining element
          if (!isCircular && remainingElement) {
            remainingElement.style.display = 'none';
          } else if (remainingElement) {
            // For circular, hide the remaining
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
      if (labelElement) {
        labelElement.textContent = formatter(options.value.getValue(), options.value.getMax());
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
  
  // Initialize with current values
  if (!options.state.isIndeterminate()) {
    updateProgress(options.value.getValue(), options.value.getMax());
  }
  
  return api;
};