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
  const track = comp.track || comp.components?.track as SVGElement;
  const indicator = comp.indicator || comp.components?.indicator as SVGElement;
  const remaining = comp.remaining || comp.components?.remaining as SVGElement | undefined;
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
    
    // Update indicator position
    updateElement(indicator, { x2: percentage });
    
    // Update remaining with gap
    updateElement(remaining, { 
      x1: percentage + gap,
      display: percentage >= 100 ? 'none' : ''
    });
    
    // Update buffer if present
    if (buffer) {
      const bufferPercentage = (options.buffer.getBuffer() / max) * 100;
      updateElement(buffer, { x2: bufferPercentage });
    }
  };
  
  const updateCircularProgress = (percentage: number, max: number): void => {
    // Get circle dimensions once
    const radius = parseFloat(indicator.getAttribute('r') || '0');
    const circumference = 2 * Math.PI * radius;
    const fillAmount = (percentage / 100) * circumference;
    
    // Hide track in determinate mode
    if (track) track.style.opacity = '0';
    
    // Update indicator with dash pattern
    updateElement(indicator, {
      'stroke-dasharray': `${fillAmount} ${circumference - fillAmount}`,
      'stroke-dashoffset': '0'
    });
    
    // Update remaining with gap
    if (remaining) {
      if (percentage >= 100) {
        remaining.style.display = 'none';
      } else {
        const gapSize = 4 / element.clientWidth * circumference;
        const remainingLength = circumference - fillAmount - gapSize;
        const angle = ((fillAmount + gapSize) / circumference * 360) - 15;
        
        updateElement(remaining, {
          display: '',
          'stroke-dasharray': `${remainingLength} ${fillAmount + gapSize}`,
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
  
  // Handle resize - use debounced version
  let resizeTimer: number | undefined;
  const handleResize = (): void => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
    }, 100); // 100ms debounce
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
    remaining,
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
        if (remaining) remaining.style.display = 'none';
        if (track) track.style.opacity = '1';
      } else {
        removeClass(element, PROGRESS_CLASSES.INDETERMINATE);
        if (isCircular && track) track.style.opacity = '0';
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