// src/components/progress/features/state.ts - Canvas-compatible state management

import { ProgressConfig, ProgressShape } from '../types';
import { PROGRESS_CLASSES, PROGRESS_SHAPES, PROGRESS_THICKNESS } from '../constants';
import { addClass } from '../../../core/dom';

/**
 * Progress component state
 */
interface ProgressState {
  value: number;
  max: number;
  buffer: number;
  indeterminate: boolean;
  thickness: number | string; // Allow both number and string for thickness
  shape: ProgressShape;
  labelFormatter: (value: number, max: number) => string;
  label?: HTMLElement;
}

/**
 * Component with lifecycle methods and canvas drawing
 */
interface ComponentWithLifecycle {
  element: HTMLElement;
  canvas?: HTMLCanvasElement;
  draw?: () => void;
  lifecycle?: {
    init?: () => void;
    destroy?: () => void;
  };
  getClass?: (name: string) => string;
  setThickness?: (thickness: number | string) => void;
  [key: string]: any;
}

/**
 * Adds state management for canvas-based progress component
 * 
 * @param config Progress configuration
 * @returns Component enhancer with state management
 */
export const withState = (config: ProgressConfig) => 
  (component: ComponentWithLifecycle): ComponentWithLifecycle & { state: ProgressState } => {
  
  // Apply indeterminate class immediately if needed
  if (config.indeterminate && component.element) {
    addClass(component.element, PROGRESS_CLASSES.INDETERMINATE);
    component.element.removeAttribute('aria-valuenow');
  }

  // Remove any existing thickness classes - we'll handle thickness via canvas
  if (component.element) {
    const containerClass = component.getClass?.(PROGRESS_CLASSES.CONTAINER) || '';
    component.element.classList.remove(
      `${containerClass}--thin`,
      `${containerClass}--thick`
    );
  }

  // Apply shape class immediately if needed (linear only)
  if (config.shape && config.shape !== PROGRESS_SHAPES.LINE && component.element) {
    const isCircular = component.element.classList.contains(component.getClass?.(PROGRESS_CLASSES.CIRCULAR) || '');
    if (!isCircular) {
      const containerClass = component.getClass?.(PROGRESS_CLASSES.CONTAINER) || '';
      addClass(component.element, `${containerClass}--${config.shape}`);
    }
  }
  
  // Initialize state values
  const state: ProgressState = {
    value: config.value ?? 0,
    max: config.max ?? 100,
    buffer: config.buffer ?? 0,
    indeterminate: config.indeterminate === true,
    // Store thickness as is (string or number) to maintain the original value
    thickness: config.thickness ?? 'thin',
    shape: config.shape ?? PROGRESS_SHAPES.LINE,
    labelFormatter: config.labelFormatter ?? ((v: number, m: number): string => `${Math.round((v / m) * 100)}%`)
  };

  // Store original lifecycle hooks if they exist
  const originalInit = component.lifecycle?.init;
  const originalDestroy = component.lifecycle?.destroy;

  // Add state to component
  component.state = state;

  // Add lifecycle hooks
  component.lifecycle = {
    init: () => {
      // Initialize with original thickness
      console.log('State init called with thickness:', state.thickness);
      
      // Store original thickness in state
      if (state.thickness) {
        // If API is available, use it to set thickness
        if (component.setThickness) {
          component.setThickness(state.thickness);
        } else {
          // Otherwise, just store it in state and let canvas handle it
          component.state.thickness = state.thickness;
        }
      }
      
      if (originalInit) originalInit();
    },
    destroy: () => {
      if (originalDestroy) originalDestroy();
    }
  };

  return {
    ...component,
    state
  };
};