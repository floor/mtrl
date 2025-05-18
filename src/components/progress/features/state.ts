import { ProgressConfig } from '../types';
import { PROGRESS_VARIANTS } from '../constants';

/**
 * Adds state management to the progress component
 * 
 * @param config Progress configuration
 * @returns Component enhancer with state management
 */
export const withState = (config: ProgressConfig) => (component) => {
  // Initialize state values
  const state = {
    value: config.value !== undefined ? config.value : 0,
    max: config.max || 100,
    buffer: config.buffer || 0,
    indeterminate: config.indeterminate || false,
    labelFormatter: (v: number, m: number) => `${Math.round((v / m) * 100)}%`,
    labelElement: undefined as HTMLElement | undefined
  };
  
  // Initialize the component's state
  function initializeState() {
    try {
      const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
      
      if (state.indeterminate) {
        // The component's setIndeterminate API will be called after state is added
        return;
      }
      
      // Only set styles for linear progress - circular progress is handled by updateProgress
      if (!isCircular) {
        // For determinate progress, set up initial styles
        if (component.indicatorElement instanceof HTMLElement) {
          const percentage = (state.value / state.max) * 100;
          component.indicatorElement.style.width = `${percentage}%`;
        }
        
        if (component.remainingElement instanceof HTMLElement) {
          const percentage = (state.value / state.max) * 100;
          
          // Fix: Use direct percentage values instead of calc() function
          component.remainingElement.style.left = `${percentage}%`;
          component.remainingElement.style.marginLeft = '4px'; // Add a 4px gap
          component.remainingElement.style.width = `${100 - percentage}%`;
          
          // Hide remaining element if progress is 100%
          if (percentage >= 100) {
            component.remainingElement.style.display = 'none';
          }
        }
        
        if (component.bufferElement instanceof HTMLElement) {
          const bufferPercentage = (state.buffer / state.max) * 100;
          component.bufferElement.style.width = `${bufferPercentage}%`;
        }
      }
    } catch (error) {
      console.error('Error initializing progress state:', error);
    }
  }
  
  // Call initialize after DOM creation
  setTimeout(initializeState, 0);
  
  // Return enhanced component with state
  return {
    ...component,
    state,
    initializeState
  };
}; 