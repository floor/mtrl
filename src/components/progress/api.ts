// src/components/progress/api.ts

import { ProgressComponent } from './types';
import { PROGRESS_CLASSES } from './constants';
import { addClass, removeClass } from '../../core/dom';

// SVG namespace for proper attribute setting
const SVG_NS = 'http://www.w3.org/2000/svg';

// Fixed gap size in pixels for linear progress
const GAP_SIZE_PX = 8;

// Fixed gap size in pixels for circular progress
const CIRCULAR_GAP_PX = 4;

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
  try {
    element.setAttribute(attr, value);
  } catch (error) {
    console.error(`Error setting attribute ${attr} to ${value}:`, error);
  }
};

export const withAPI = (options: any) => (comp: any): ProgressComponent => {
  // Get references to DOM elements
  const element = comp.element as HTMLElement;
  const track = comp.components?.track || comp.track as SVGElement;
  const indicator = comp.components?.indicator || comp.indicator as SVGElement;
  const remaining = comp.components?.remaining || comp.remaining as SVGElement;
  const buffer = comp.components?.buffer || comp.buffer as SVGElement;
  const label = comp.components?.label || comp.label as HTMLElement | undefined;

  // Configuration
  const isCircular = element.classList.contains(comp.getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Directly sync the SVG with current value/state on initialization
  const syncInitialState = () => {
    if (options.state.isIndeterminate()) {
      // Ensure indeterminate class is applied
      addClass(element, PROGRESS_CLASSES.INDETERMINATE);
      element.removeAttribute('aria-valuenow');
      
      // Hide remaining element in indeterminate state
      if (remaining) {
        remaining.style.display = 'none';
      }
      
      // Hide track in indeterminate state for both linear and circular
      if (track) {
        track.style.opacity = '0';
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
  
  // Get the SVG viewbox width (the coordinate system we're using)
  const getSvgViewBoxWidth = () => {
    const svg = element.querySelector('svg');
    if (svg) {
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(' ');
        if (parts.length >= 3) {
          return parseFloat(parts[2]);
        }
      }
    }
    return 100; // Default viewBox width
  };
  
  // Update progress visuals based on current state
  const updateProgress = (value: number, max: number) => {
    if (options.state.isIndeterminate()) return;
    
    const percentage = (value / max) * 100;
    
    // Update linear progress elements
    if (!isCircular) {
      // Get actual physical width of the element
      const trackWidth = track?.getBoundingClientRect().width || 100;
      
      // Get the SVG viewBox width for coordinate system
      const viewBoxWidth = getSvgViewBoxWidth();
      
      // Update indicator with percentage
      setSvgAttribute(indicator, 'x2', `${percentage}`);
      
      // Calculate the fixed gap of 8px in SVG coordinate system
      // If viewBoxWidth = 100, and trackWidth = 600px, then 8px = (8/600)*100 = 1.33 in viewBox units
      const gapInSvgUnits = (GAP_SIZE_PX / trackWidth) * viewBoxWidth;

      // Position remaining element with fixed gap
      if (percentage < 100) {
        setSvgAttribute(remaining, 'x1', `${percentage + gapInSvgUnits}`);
        remaining.style.display = '';
      } else {
        // Hide remaining when at 100%
        remaining.style.display = 'none';
      }
      
      // Update buffer if present
      if (buffer) {
        const bufferValue = options.buffer.getBuffer();
        const bufferPercentage = (bufferValue / max) * 100;
        setSvgAttribute(buffer, 'x2', `${bufferPercentage}`);
      }
    } else {
      // Update circular progress
      // Calculate the circumference and stroke-dashoffset for a circle
      const radius = parseFloat(indicator.getAttribute('r') || '0');
      const circumference = 2 * Math.PI * radius;
      
      // Hide track in determinate mode for circular progress
      if (track) {
        track.style.opacity = '0';
      }
      
      // Calculate the gap in terms of the circle's circumference
      // For a 48px circle with 4px visual gap, we need to convert to an angular gap
      const actualSize = element.getBoundingClientRect().width;
      const gapSizePx = CIRCULAR_GAP_PX; // Fixed 4px gap for circular progress
      const gapRatio = gapSizePx / actualSize;
      const gapSize = gapRatio * circumference;
      
      // If percentage is 0, show only the remaining path with gaps on both ends
      if (percentage === 0) {
        // Hide indicator when at 0%
        indicator.style.display = 'none';
        
        // Show remaining with gaps at both ends
        if (remaining) {
          remaining.style.display = '';
          // Set dash pattern for remaining with gaps at both ends
          const adjustedCircumference = circumference - (2 * gapSize);
          setSvgAttribute(remaining, 'stroke-dasharray', `0 ${gapSize} ${adjustedCircumference} ${gapSize}`);
          setSvgAttribute(remaining, 'stroke-dashoffset', '0');
          remaining.style.transform = ''; // Reset any transform
        }
      } 
      // If percentage is 100, show only the indicator with gaps on both ends
      else if (percentage >= 100) {
        // Show indicator with gaps at both ends
        indicator.style.display = '';
        const adjustedCircumference = circumference - (2 * gapSize);
        setSvgAttribute(indicator, 'stroke-dasharray', `0 ${gapSize} ${adjustedCircumference} ${gapSize}`);
        setSvgAttribute(indicator, 'stroke-dashoffset', '0');
        indicator.style.transform = ''; // Reset any transform
        
        // Hide remaining when at 100%
        if (remaining) {
          remaining.style.display = 'none';
        }
      }
      // For percentages between 0 and 100, show both indicator and remaining with gaps
      else {
        // Show both paths
        indicator.style.display = '';
        if (remaining) remaining.style.display = '';
        
        // Calculate angle for indicator
        const progressAngle = (percentage / 100) * 360;
        
        // Calculate the size of indicator and remaining in terms of the circumference
        const indicatorLength = (percentage / 100) * circumference;
        const remainingLength = circumference - indicatorLength;
        
        // Calculate gap sizes in terms of angle (degrees)
        const gapAngle = (gapSize / circumference) * 360;
        
        // Set dash pattern for indicator
        // Start with small gap, then indicator arc, then the rest hidden
        setSvgAttribute(indicator, 'stroke-dasharray', `0 ${gapSize} ${indicatorLength - (2 * gapSize)} ${remainingLength + gapSize}`);
        setSvgAttribute(indicator, 'stroke-dashoffset', '0');
        
        // Set dash pattern for remaining
        // Apply rotational offset to position it correctly after the indicator
        if (remaining) {
          // Position the remaining arc after indicator + gap
          remaining.style.transform = `rotate(${progressAngle}deg)`;
          
          // Dash pattern: start with gap, then remaining arc, then invisible portion
          setSvgAttribute(remaining, 'stroke-dasharray', `0 ${gapSize} ${remainingLength - (2 * gapSize)} ${indicatorLength + gapSize}`);
          setSvgAttribute(remaining, 'stroke-dashoffset', '0');
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
  
  // Handle window resize to recalculate gap
  const handleResize = () => {
    if (!options.state.isIndeterminate()) {
      updateProgress(options.value.getValue(), options.value.getMax());
    }
  };
  
  // Add resize listener to maintain proper gap sizing
  window.addEventListener('resize', handleResize);
  
  // API implementation
  const api: ProgressComponent = {
    element,
    track,
    indicator,
    remaining,
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
      if (!isCircular && buffer && !options.state.isIndeterminate()) {
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
          
          if (remaining) {
            remaining.style.display = 'none';
          }
          
          // Show track in indeterminate state
          if (track) {
            track.style.opacity = '1';
          }
        } else {
          // Exit indeterminate mode
          removeClass(element, PROGRESS_CLASSES.INDETERMINATE);
          
          // Hide track for circular determinate progress
          if (isCircular && track) {
            track.style.opacity = '0';
          }
          
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
    destroy: () => {
      // Remove resize listener
      window.removeEventListener('resize', handleResize);
      
      // Call original destroy
      options.lifecycle.destroy();
    },
    
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
      destroy: () => {
        // Remove resize listener
        window.removeEventListener('resize', handleResize);
        
        // Call original destroy
        options.lifecycle.destroy();
      }
    }
  };
  
  // Initialize with current values - run on next tick to ensure DOM is ready
  setTimeout(() => {
    syncInitialState();
  }, 0);
  
  return api;
};