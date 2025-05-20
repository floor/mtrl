// src/components/progress/api.ts

import { ProgressComponent } from './types';
import { PROGRESS_CLASSES, PROGRESS_EVENTS } from './constants';
import { addClass, removeClass } from '../../core/dom';

/**
 * SVG attribute dictionary
 */
interface SVGAttributes {
  [key: string]: string | number | undefined;
}

/**
 * API configuration options for progress component
 */
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
    show?: () => void;
    hide?: () => void;
    format?: (formatter: (value: number, max: number) => string) => void;
    formatter?: (value: number, max: number) => string;
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
 * Enhances a progress component with a streamlined API
 */
export const withAPI = (options: ApiOptions) => (comp: any): ProgressComponent => {
  // Get minimal element references directly
  const { element, getClass } = comp;
  const indicator = comp.indicator || comp.components?.indicator as SVGElement;
  const track = comp.track || comp.components?.track as SVGElement; // This is the renamed element (previously 'remaining')
  const buffer = comp.buffer || comp.components?.buffer as SVGElement | undefined;
  
  // Determine variant once
  const isCircular = element.classList.contains(getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Create event emitter helper - reduces code duplication
  const emitEvent = (name: string, detail: Record<string, any>): void => {
    element.dispatchEvent(new CustomEvent(name, { detail }));
  };
  
  // Optimized helper to set attributes on SVG elements
  const updateElement = (el: SVGElement | undefined, attrs: SVGAttributes): void => {
    if (!el) return;
    
    // Apply style changes through style property
    if (attrs.style !== undefined) {
      el.style.cssText = attrs.style as string;
      delete attrs.style;
    }
    
    // Apply display property
    if (attrs.display !== undefined) {
      el.style.display = attrs.display as string;
      delete attrs.display;
    }
    
    // Apply transform
    if (attrs.transform !== undefined) {
      el.style.transform = attrs.transform as string;
      delete attrs.transform;
    }
    
    // Apply remaining attributes
    for (const attr in attrs) {
      if (attrs[attr] !== undefined) {
        el.setAttribute(attr, attrs[attr]!.toString());
      }
    }
  };
  
  // Update progress visuals efficiently - separated by variant type
  const updateLinearProgress = (percentage: number, max: number): void => {
    // Calculate gap in percentage units (fixed 8px)
    const gap = 8 / element.clientWidth * 100;
    
    // let's be sure the starting indicator point is a dot
    let x2 = percentage;

    if (percentage === 0) {
      x2 = 2 / element.clientWidth * 100;
    }

    // Update indicator position
    updateElement(indicator, { x2 });
    
    // Update track with gap
    const trackStart = percentage + gap;
    updateElement(track, { 
      x1: trackStart,
      display: percentage >= 100 ? 'none' : ''
    });
    
    // Update buffer if present
    if (buffer) {
      const bufferPercentage = (options.buffer.getBuffer() / max) * 100;
      
      // Buffer should start where track starts, but only if it's greater than the current progress
      if (bufferPercentage > percentage) {
        // Buffer starts at the end of indicator + gap
        const bufferStart = trackStart;
        
        // Update buffer - x1 starts at track start, x2 is based on buffer value
        updateElement(buffer, { 
          x1: bufferStart,
          x2: bufferPercentage,
          display: bufferPercentage > percentage ? '' : 'none'
        });
      } else {
        // Hide buffer if it's not ahead of the current progress
        updateElement(buffer, { display: 'none' });
      }
    }
  };
  
  const updateCircularProgress = (percentage: number, max: number): void => {
    // Get circle dimensions once
    const radius = parseFloat(indicator.getAttribute('r') || '0');
    const circumference = 2 * Math.PI * radius;
    const fillAmount = (percentage / 100) * circumference;
    
    // Update indicator with dash pattern
    updateElement(indicator, {
      'stroke-dasharray': `${fillAmount} ${circumference - fillAmount}`,
      'stroke-dashoffset': '0'
    });
    
    // Update track (previously remaining) with gap
    if (track) {
      if (percentage >= 100) {
        track.style.display = 'none';
      } else {
        const gapSize = 4 / element.clientWidth * circumference;
        const trackLength = circumference - fillAmount - gapSize;
        const angle = ((fillAmount + gapSize) / circumference * 360) - 15;
        
        updateElement(track, {
          display: '',
          'stroke-dasharray': `${trackLength} ${fillAmount + gapSize}`,
          'stroke-dashoffset': '0',
          transform: `rotate(${angle}deg)`
        });
      }
    }
  };
  
  // Combined update function - delegates to variant-specific implementation
  const updateProgress = (value: number, max: number): void => {
    // Skip if in indeterminate state
    if (options.state.isIndeterminate()) return;
    
    const percentage = (value / max) * 100;
    
    // Delegate to appropriate update method
    isCircular 
      ? updateCircularProgress(percentage, max) 
      : updateLinearProgress(percentage, max);
    
    // Update ARIA attribute
    element.setAttribute('aria-valuenow', value.toString());
    
    // Update label if present
    const label = comp.label || comp.components?.label;
    if (label) {
      const formatter = options.label.formatter || 
        ((v: number, m: number) => `${Math.round((v / m) * 100)}%`);
      label.textContent = formatter(value, max);
    }
  };
  
  let resizeTimer: number | undefined;
  let lastResizeTime = 0;
  const THROTTLE_DELAY = 50; // Update every 50ms during resize
  const DEBOUNCE_DELAY = 20; // Final update after resize ends

  /**
   * Handles window resize events with both throttling (during resize) and debouncing (after resize)
   */
  const handleResize = (): void => {
    const now = Date.now();
    
    // Clear existing debounce timer
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    
    // Throttle: Only update if enough time has passed since last update
    if (now - lastResizeTime >= THROTTLE_DELAY) {
      lastResizeTime = now;
      
      // Only update if not in indeterminate state
      if (!options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
    }
    
    // Debounce: Always schedule a final update
    resizeTimer = window.setTimeout(() => {
      if (!options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
      resizeTimer = undefined;
    }, DEBOUNCE_DELAY);
  };
  
  // Add resize listener
  window.addEventListener('resize', handleResize);
  
  // Initialize on next frame
  requestAnimationFrame(() => {
    if (options.state.isIndeterminate()) {
      addClass(element, PROGRESS_CLASSES.INDETERMINATE);
      element.removeAttribute('aria-valuenow');
    } else {
      updateProgress(options.value.getValue(), options.value.getMax());
    }
  });
  
  // Build the API
  const api: ProgressComponent = {
    // Element references
    element,
    track,
    indicator,
    buffer,
    getClass,
    
    // Value management
    getValue: options.value.getValue,
    setValue(value: number): ProgressComponent {
      const prevValue = options.value.getValue();
      options.value.setValue(value);
      
      // Only update UI and emit events if value actually changed
      if (prevValue !== value) {
        if (!options.state.isIndeterminate()) {
          updateProgress(value, options.value.getMax());
        }
        
        const detail = { value, max: options.value.getMax() };
        emitEvent(PROGRESS_EVENTS.CHANGE, detail);
        
        if (value >= options.value.getMax()) {
          emitEvent(PROGRESS_EVENTS.COMPLETE, detail);
        }
      }
      
      return api;
    },
    getMax: options.value.getMax,
    
    // Buffer management
    getBuffer: options.buffer.getBuffer,
    setBuffer(value: number): ProgressComponent {
      options.buffer.setBuffer(value);
      if (!isCircular && buffer && !options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
      return api;
    },
    
    // Indeterminate state
    setIndeterminate(indeterminate: boolean): ProgressComponent {
      const wasIndeterminate = options.state.isIndeterminate();
      if (wasIndeterminate === indeterminate) return api;
      
      options.state.setIndeterminate(indeterminate);
      
      if (indeterminate) {
        addClass(element, PROGRESS_CLASSES.INDETERMINATE);
        element.removeAttribute('aria-valuenow');
        
        // For linear progress, show track at 100%
        if (!isCircular && track) {
          updateElement(track, {
            display: 'block',
            x1: 0,
            x2: 100,
            stroke: 'var(--mtrl-surface-container-highest)'
          });
        }
        
        // For circular progress, show track at 100% 
        if (isCircular && track) {
          updateElement(track, {
            display: 'block',
            opacity: '1',
            stroke: 'var(--mtrl-surface-container-highest)', 
            'stroke-dasharray': 'none'
          });
        }
        
        // Hide buffer in indeterminate mode
        if (buffer) {
          updateElement(buffer, { display: 'none' });
        }
      } else {
        removeClass(element, PROGRESS_CLASSES.INDETERMINATE);
        updateProgress(options.value.getValue(), options.value.getMax());
      }
      
      return api;
    },
    isIndeterminate: options.state.isIndeterminate,
    
    // Label management
    showLabel(): ProgressComponent {
      if (options.label.show) options.label.show();
      return api;
    },
    hideLabel(): ProgressComponent {
      if (options.label.hide) options.label.hide();
      return api;
    },
    setLabelFormatter(formatter: (value: number, max: number) => string): ProgressComponent {
      if (options.label.format) options.label.format(formatter);
      const label = comp.label || comp.components?.label;
      if (label) {
        label.textContent = formatter(options.value.getValue(), options.value.getMax());
      }
      return api;
    },
    
    // State management
    enable(): ProgressComponent {
      options.disabled.enable();
      return api;
    },
    disable(): ProgressComponent {
      options.disabled.disable();
      return api;
    },
    isDisabled: options.disabled.isDisabled,
    
    // Event handling
    on(event: string, handler: Function): ProgressComponent {
      element.addEventListener(event, handler as EventListener);
      return api;
    },
    off(event: string, handler: Function): ProgressComponent {
      element.removeEventListener(event, handler as EventListener);
      return api;
    },
    
    // Extension methods
    addClass(...classes: string[]): ProgressComponent {
      classes.forEach(className => element.classList.add(className));
      return api;
    },
    
    // Cleanup
    destroy(): void {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      options.lifecycle.destroy();
    },
    
    // Required property objects
    disabled: {
      enable(): void {
        options.disabled.enable();
      },
      disable(): void {
        options.disabled.disable();
      },
      isDisabled: options.disabled.isDisabled
    },
    
    lifecycle: {
      destroy(): void {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimer);
        options.lifecycle.destroy();
      }
    }
  };
  
  return api;
};