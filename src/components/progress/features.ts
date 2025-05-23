// src/components/progress/features/state.ts

import { ProgressConfig, ProgressShape } from './types';
import { PROGRESS_CLASSES, PROGRESS_SHAPES } from './constants';
import { addClass } from '../../core/dom';

/**
 * Progress component state
 */
interface ProgressState {
  value: number;
  max: number;
  buffer: number;
  indeterminate: boolean;
  shape: ProgressShape;
  labelFormatter: (value: number, max: number) => string;
  label?: HTMLElement;
}

/**
 * Component with lifecycle methods
 */
interface ComponentWithLifecycle {
  element: HTMLElement;
  lifecycle?: {
    init?: () => void;
    destroy?: () => void;
  };
  setIndeterminate?: (state: boolean) => unknown;
  setValue?: (value: number) => unknown;
  setBuffer?: (value: number) => unknown;
  setShape?: (shape: ProgressShape) => unknown;
  showLabel?: () => unknown;
  getClass?: (name: string) => string;
  [key: string]: any;
}

/**
 * Adds state management and initialization to the progress component
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
    shape: config.shape ?? PROGRESS_SHAPES.LINE,
    labelFormatter: (v: number, m: number): string => `${Math.round((v / m) * 100)}%`
  };

  // Store original lifecycle hooks if they exist
  const originalInit = component.lifecycle?.init;
  const originalDestroy = component.lifecycle?.destroy;
  
  // Enhanced lifecycle with initialization
  component.lifecycle = {
    init: (): void => {
      // Schedule API initialization for next frame
      // This ensures all features and API methods are properly attached
      requestAnimationFrame(() => {
        try {
          // Initialize API state based on configuration
          if (state.indeterminate) {
            component.setIndeterminate?.(true);
          } else {
            component.setValue?.(state.value);
            if (config.buffer !== undefined) {
              component.setBuffer?.(state.buffer);
            }
          }

          // Set initial shape if configured (and not default)
          if (state.shape !== PROGRESS_SHAPES.LINE && component.setShape) {
            component.setShape(state.shape);
          }
          
          // Show label if configured
          if (config.showLabel && component.showLabel) {
            component.showLabel();
          }
        } catch (error) {
          console.error('Error initializing progress state:', error);
        }
      });
      
      // Call original init if it exists
      if (originalInit) {
        originalInit();
      }
    },
    
    destroy: (): void => {
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