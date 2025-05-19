import { ProgressConfig } from '../types';
import { PROGRESS_VARIANTS, PROGRESS_CLASSES } from '../constants';
import { setupIndeterminateState, setupComponentReferences } from '../config';
import { addClass } from '../../../core/dom';

/**
 * Handles component setup, reference configuration, and API initialization
 * 
 * @param config Progress configuration
 * @returns Component enhancer with setup functionality
 */
export const withSetup = (config: ProgressConfig) => (component) => {
  // Store original lifecycle hooks
  const originalInit = component.lifecycle?.init;
  const originalDestroy = component.lifecycle?.destroy;
  
  // Apply indeterminate class immediately if needed
  // This needs to be done during component creation, not in lifecycle
  if (config.indeterminate && component.element) {
    console.log('[withSetup] Applying indeterminate class', PROGRESS_CLASSES.INDETERMINATE);
    addClass(component.element, PROGRESS_CLASSES.INDETERMINATE);
  }
  
  /**
   * Configures component references from DOM structure
   */
  const configureReferences = () => {
    try {
      const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
      
      // Setup indeterminate animations and other configurations
      // The class is already added above to ensure it's visible immediately
      if (config.indeterminate) {
        setupIndeterminateState(component, isCircular);
      }
      
      // Set up component references from DOM structure
      setupComponentReferences(component, component.state, isCircular);
    } catch (error) {
      console.error('Error configuring progress references:', error);
    }
  };
  
  /**
   * Initializes component API state
   */
  const initializeApiState = () => {
    try {
      console.log('[Progress Setup] Initializing API state, indeterminate:', config.indeterminate);
      
      // Check if the component has setIndeterminate and setValue methods
      if (!component.setIndeterminate || typeof component.setIndeterminate !== 'function') {
        console.error('[Progress Setup] Component missing setIndeterminate method');
        return;
      }
      
      if (!component.setValue || typeof component.setValue !== 'function') {
        console.error('[Progress Setup] Component missing setValue method');
        return;
      }
      
      if (config.indeterminate) {
        // Call the API's setIndeterminate method to make sure state is updated
        console.log('[Progress Setup] Setting indeterminate state via API');
        component.setIndeterminate(true);
      } else {
        // Use default value from config if state value access fails
        const initialValue = 
          (component.state && typeof component.state.value !== 'undefined') 
            ? component.state.value 
            : (config.value || 0);
        
        console.log('[Progress Setup] Setting initial value via API:', initialValue);
        component.setValue(initialValue);
        
        if (config.buffer !== undefined) {
          component.setBuffer(config.buffer);
        }
      }
    } catch (error) {
      console.error('Error initializing progress API state:', error);
    }
  };
  
  // Enhanced lifecycle
  const enhancedLifecycle = {
    init: () => {
      // Configure references first
      configureReferences();
      
      // Initialize API state after the API is available
      setTimeout(initializeApiState, 0);
      
      // Call original init if it exists
      if (originalInit) {
        originalInit();
      }
    },
    
    destroy: () => {
      // Call original destroy if it exists
      if (originalDestroy) {
        originalDestroy();
      }
    }
  };
  
  // Return enhanced component
  return {
    ...component,
    lifecycle: enhancedLifecycle
  };
}; 