// src/components/progress/features/state.ts - Canvas-compatible state management

import { ProgressConfig, ProgressShape } from '../types';
import { PROGRESS_CLASSES, PROGRESS_SHAPES } from '../constants';
import { addClass } from '../../../core/dom';

/**
 * Progress component state
 */
interface ProgressState {
  value: number;
  max: number;
  buffer: number;
  indeterminate: boolean;
  thickness: number;
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
    thickness: typeof config.thickness === 'number' ? config.thickness : 6,
    shape: config.shape ?? PROGRESS_SHAPES.LINE,
    labelFormatter: (v: number, m: number): string => `${Math.round((v / m) * 100)}%`
  };

  // Store original lifecycle hooks if they exist
  const originalInit = component.lifecycle?.init;
  const originalDestroy = component.lifecycle?.destroy;
  
  // Enhanced lifecycle with canvas initialization
  component.lifecycle = {
    init: (): void => {
      // Call original init first
      if (originalInit) {
        originalInit();
      }
      
      // Initialize canvas drawing after a frame to ensure all features are ready
      requestAnimationFrame(() => {
        try {
          // Trigger initial canvas draw
          if (component.draw) {
            component.draw();
          }
          
          // Show label if configured
          if (config.showLabel) {
            // Create label element
            const label = document.createElement('div');
            label.className = `${component.getClass?.(PROGRESS_CLASSES.LABEL) || 'progress-label'}`;
            label.textContent = state.labelFormatter(state.value, state.max);
            component.element.appendChild(label);
            state.label = label;
          }
        } catch (error) {
          console.error('Error initializing canvas progress state:', error);
        }
      });
    },
    
    destroy: (): void => {
      // Clean up label
      if (state.label) {
        state.label.remove();
      }
      
      // Call original destroy if it exists
      if (originalDestroy) {
        originalDestroy();
      }
    }
  };
  
  return {
    ...component,
    state
  };
};