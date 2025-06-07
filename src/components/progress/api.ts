// src/components/progress/api.ts - Canvas-based API

import { ProgressComponent, ProgressThickness, ProgressShape } from './types';
import { 
  PROGRESS_CLASSES, 
  PROGRESS_EVENTS,
  PROGRESS_THICKNESS,
  PROGRESS_SHAPES
} from './constants';
import { addClass, removeClass } from '../../core/dom';

/**
 * API configuration options for canvas-based progress component
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
  thickness?: {
    getThickness: () => number;
    setThickness: (thickness: ProgressThickness) => void;
  };
  shape?: {
    getShape: () => ProgressShape;
    setShape: (shape: ProgressShape) => void;
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
 * Enhances a canvas-based progress component with a streamlined API
 */
export const withAPI = (options: ApiOptions) => (comp: any): ProgressComponent => {
  // Get element references
  const { element, getClass, canvas } = comp;
  
  // Determine variant once
  const isCircular = element.classList.contains(getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Create event emitter helper
  const emitEvent = (name: string, detail: Record<string, any>): void => {
    element.dispatchEvent(new CustomEvent(name, { detail }));
  };
  
  // Update progress and redraw canvas
  const updateProgress = (value: number, max: number): void => {
    // Update ARIA attribute
    element.setAttribute('aria-valuenow', value.toString());
    
    // Update label if present
    const label = comp.label;
    if (label) {
      const formatter = options.label?.formatter || 
        ((v: number, m: number) => `${Math.round((v / m) * 100)}%`);
      label.textContent = formatter(value, max);
    }
    
    // Redraw canvas using component's draw function
    if (typeof comp.draw === 'function') {
      comp.draw();
    }
  };

  const getThickness = (): number => {
    return options.thickness?.getThickness() || PROGRESS_THICKNESS.THIN;
  };

  const setThickness = (thickness: ProgressThickness): ProgressComponent => {
    // Convert thickness to number for state
    const numericThickness = typeof thickness === 'number' 
      ? thickness 
      : thickness === 'thick' 
        ? PROGRESS_THICKNESS.THICK 
        : PROGRESS_THICKNESS.THIN;
    
    // Update internal state
    if (options.thickness) {
      options.thickness.setThickness(thickness);
    }

    // Call component's setThickness to update canvas
    if (comp.setThickness) {
      comp.setThickness(thickness);
    }
    
    return comp;
  };

  const getShape = (): ProgressShape => {
    if (options.shape && typeof options.shape.getShape === 'function') {
      return options.shape.getShape();
    }
    return PROGRESS_SHAPES.LINE;
  };

  const setShape = (shape: ProgressShape): ProgressComponent => {
    comp.setShape?.(shape);
    return comp;
  };

  // Handle indeterminate state by toggling CSS classes and animations
  const handleIndeterminateState = (indeterminate: boolean): void => {
    if (indeterminate) {
      addClass(element, PROGRESS_CLASSES.INDETERMINATE);
      element.removeAttribute('aria-valuenow');
      
      // Start indeterminate animation for linear progress (if not wavy)
      if (!isCircular) {
        const currentShape = options.shape?.getShape() || PROGRESS_SHAPES.LINE;
        if (currentShape !== 'wavy' && comp.startIndeterminateAnimation) {
          comp.startIndeterminateAnimation();
        }
      }
    } else {
      removeClass(element, PROGRESS_CLASSES.INDETERMINATE);
      
      // Stop indeterminate animation (but keep wavy animation if shape is wavy)
      if (comp.stopIndeterminateAnimation) {
        comp.stopIndeterminateAnimation();
      }
    }
    
    // Always redraw for state change
    if (typeof comp.draw === 'function') {
      comp.draw();
    }
  };
  
  // Initialize indeterminate state if needed
  if (options.state.isIndeterminate()) {
    handleIndeterminateState(true);
  }
  
  // Build the API
  const api: ProgressComponent = {
    // Element references
    element,
    track: canvas as any,
    indicator: canvas as any,
    buffer: canvas as any,
    getClass,
    
    // Value management
    getValue() {
      return options.value.getValue();
    },
    
    setValue(value: number, animate: boolean = true): ProgressComponent {
      const prevValue = options.value.getValue();
      const max = options.value.getMax();
      options.value.setValue(value);
      if (prevValue !== value) {
        // Don't call updateProgress here as comp.setValue will handle the drawing
        // Only update ARIA and label here
        element.setAttribute('aria-valuenow', value.toString());
        
        // Update label if present
        const label = comp.label;
        if (label) {
          const formatter = options.label?.formatter || 
            ((v: number, m: number) => `${Math.round((v / m) * 100)}%`);
          label.textContent = formatter(value, max);
        }
        
        const detail = { value, max };
        emitEvent(PROGRESS_EVENTS.CHANGE, detail);
        
        // Call the component's setValue to handle animation and completion
        if (comp.setValue && typeof comp.setValue === 'function') {
          comp.setValue(value, animate);
        } else {
          // Fallback: update progress immediately
          updateProgress(value, max);
        }
      }
      
      return api;
    },
    
    getMax() {
      return options.value.getMax();
    },
    
    // Buffer management
    getBuffer: () => options.buffer.getBuffer(),
    setBuffer(value: number): ProgressComponent {
      options.buffer.setBuffer(value);
      if (!options.state.isIndeterminate() && typeof comp.draw === 'function') {
        comp.draw();
      }
      return api;
    },
    
    // Indeterminate state
    setIndeterminate(indeterminate: boolean): ProgressComponent {
      const wasIndeterminate = options.state.isIndeterminate();
      if (wasIndeterminate === indeterminate) return api;
      
      options.state.setIndeterminate(indeterminate);
      handleIndeterminateState(indeterminate);
      
      return api;
    },
    isIndeterminate: () => options.state.isIndeterminate(),
    
    // Label management
    showLabel(): ProgressComponent {
      if (options.label?.show) options.label.show();
      return api;
    },
    hideLabel(): ProgressComponent {
      if (options.label?.hide) options.label.hide();
      return api;
    },
    setLabelFormatter(formatter: (value: number, max: number) => string): ProgressComponent {
      if (options.label?.format) options.label.format(formatter);
      const label = comp.label || comp.state?.label;
      if (label) {
        label.textContent = formatter(options.value.getValue(), options.value.getMax());
      }
      return api;
    },
    
    // Thickness and shape management
    getThickness,
    setThickness,
    getShape,
    setShape,

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
    
    // Visibility management
    hide(): ProgressComponent {
      if (comp.hide) {
        comp.hide();
      }
      return api;
    },
    show(): ProgressComponent {
      if (comp.show) {
        comp.show();
      }
      return api;
    },
    isVisible(): boolean {
      return comp.isVisible ? comp.isVisible() : element.style.display !== 'none';
    },
    
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
      options.lifecycle.destroy();
    },
    
    // Required property objects
    disabled: {
      enable(): void { options.disabled.enable(); },
      disable(): void { options.disabled.disable(); },
      isDisabled: options.disabled.isDisabled
    },
    
    lifecycle: {
      destroy(): void {
        options.lifecycle.destroy();
      }
    }
  };
  
  return api;
};