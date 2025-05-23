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
  const { element, getClass, canvas, draw } = comp;
  
  // Determine variant once
  const isCircular = element.classList.contains(getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Create event emitter helper
  const emitEvent = (name: string, detail: Record<string, any>): void => {
    element.dispatchEvent(new CustomEvent(name, { detail }));
  };
  
  // Internal state
  const state = {
    value: options.value.getValue(),
    max: options.value.getMax(),
    buffer: options.buffer.getBuffer(),
    indeterminate: options.state.isIndeterminate(),
    thickness: typeof options.thickness?.getThickness() === 'number' 
      ? options.thickness.getThickness() 
      : PROGRESS_THICKNESS.THIN,
    shape: options.shape?.getShape() ?? PROGRESS_SHAPES.LINE
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
    
    // Redraw canvas
    if (draw) {
      draw();
    }
  };

  const getThickness = (): number => {
    return state.thickness;
  };

  const setThickness = (thickness: ProgressThickness): ProgressComponent => {
    console.log('API setThickness called with:', thickness);
    
    // Convert thickness to number for state
    const numericThickness = typeof thickness === 'number' 
      ? thickness 
      : thickness === 'thick' 
        ? PROGRESS_THICKNESS.THICK 
        : PROGRESS_THICKNESS.THIN;
    
    // Update internal state
    state.thickness = numericThickness;
    
    // Update thickness classes for styling
    const containerClass = getClass(PROGRESS_CLASSES.CONTAINER);
    element.classList.remove(`${containerClass}--thin`, `${containerClass}--thick`);
    
    if (thickness === 'thin') {
      element.classList.add(`${containerClass}--thin`);
    } else if (thickness === 'thick') {
      element.classList.add(`${containerClass}--thick`);
    }
    
    // Call component's setThickness to update canvas
    if (comp.setThickness) {
      comp.setThickness(thickness);
    }
    
    return api;
  };

  const getShape = (): ProgressShape => {
    if (options.shape && typeof options.shape.getShape === 'function') {
      return options.shape.getShape();
    }
    return PROGRESS_SHAPES.LINE;
  };

  const setShape = (shape: ProgressShape): ProgressComponent => {
    if (isCircular) {
      // Shape only applies to linear variant
      return api;
    }
    
    if (options.shape && typeof options.shape.setShape === 'function') {
      options.shape.setShape(shape);
      
      const containerClass = getClass(PROGRESS_CLASSES.CONTAINER);
      
      // Remove existing shape classes
      Object.values(PROGRESS_SHAPES).forEach(shapeValue => {
        element.classList.remove(`${containerClass}--${shapeValue}`);
      });
      
      // Add new shape class if not the default 'line'
      if (shape !== PROGRESS_SHAPES.LINE) {
        element.classList.add(`${containerClass}--${shape}`);
      }
      
      // Redraw canvas with new shape
      if (draw) {
        draw();
      }
    }
    
    return api;
  };

  // Handle indeterminate state by toggling CSS classes and wavy animation
  const handleIndeterminateState = (indeterminate: boolean): void => {
    if (indeterminate) {
      addClass(element, PROGRESS_CLASSES.INDETERMINATE);
      element.removeAttribute('aria-valuenow');
      
      // Start wavy animation if shape is wavy and linear
      if (!isCircular && options.shape?.getShape() === 'wavy' && comp.startWavyAnimation) {
        comp.startWavyAnimation();
      }
    } else {
      removeClass(element, PROGRESS_CLASSES.INDETERMINATE);
      
      // Stop wavy animation
      if (comp.stopWavyAnimation) {
        comp.stopWavyAnimation();
      }
    }
    
    // Always redraw for state change
    if (draw) {
      draw();
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
    getValue: () => state.value,
    setValue(value: number): ProgressComponent {
      const prevValue = state.value;
      state.value = Math.max(0, Math.min(state.max, value));
      
      if (prevValue !== value) {
        updateProgress(state.value, state.max);
        
        const detail = { value: state.value, max: state.max };
        emitEvent(PROGRESS_EVENTS.CHANGE, detail);
        
        if (state.value >= state.max) {
          emitEvent(PROGRESS_EVENTS.COMPLETE, detail);
        }
      }
      
      return api;
    },
    getMax: () => state.max,
    
    // Buffer management
    getBuffer: () => state.buffer,
    setBuffer(value: number): ProgressComponent {
      state.buffer = Math.max(0, Math.min(state.max, value));
      if (!state.indeterminate && draw) {
        draw();
      }
      return api;
    },
    
    // Indeterminate state
    setIndeterminate(indeterminate: boolean): ProgressComponent {
      const wasIndeterminate = state.indeterminate;
      if (wasIndeterminate === indeterminate) return api;
      
      state.indeterminate = indeterminate;
      handleIndeterminateState(indeterminate);
      
      return api;
    },
    isIndeterminate: () => state.indeterminate,
    
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
        label.textContent = formatter(state.value, state.max);
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