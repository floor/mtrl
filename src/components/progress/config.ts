// src/components/progress/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component';
import { ProgressConfig } from './types';
import { PROGRESS_VARIANTS, PROGRESS_DEFAULTS, PROGRESS_CLASSES } from './constants';
import { createProgressSchema } from './schema';
import { addClass } from '../../core/dom';

/**
 * Default configuration for the Progress component
 */
export const defaultConfig: ProgressConfig = {
  variant: PROGRESS_DEFAULTS.VARIANT,
  value: PROGRESS_DEFAULTS.VALUE,
  max: PROGRESS_DEFAULTS.MAX,
  buffer: PROGRESS_DEFAULTS.BUFFER,
  showLabel: PROGRESS_DEFAULTS.SHOW_LABEL
  // Don't set disabled: false as default - it should be undefined by default
};

/**
 * Sets up indeterminate state for the progress component
 * 
 * @param component The progress component
 * @param isCircular Whether the component is circular
 */
export const setupIndeterminateState = (component, isCircular) => {
  try {
    if (!component.element) {
      console.warn('Progress component missing element property');
      return;
    }
    
    // We no longer add the class here since it's added in withSetup
    // This function now only sets up the animations
    
    // For linear progress, prepare the elements for animation
    if (!isCircular) {
      setTimeout(() => {
        try {
          // Make sure elements property exists
          if (!component.elements) {
            return;
          }
          
          // For the indicator, we'll let CSS handle the width and left position animations
          if (component.elements?.indicator instanceof HTMLElement) {
            component.elements.indicator.style.width = '';
            component.elements.indicator.style.left = '';
          }
          
          // Hide the remaining element 
          if (component.elements?.remaining instanceof HTMLElement) {
            component.elements.remaining.style.display = 'none';
          }
        } catch (error) {
          console.error('Error setting up indeterminate animation:', error);
        }
      }, 0);
    }
  } catch (error) {
    console.error('Error setting up indeterminate state:', error);
  }
};

/**
 * Sets up component references from the DOM structure
 * 
 * @param component The progress component
 * @param state Component state object
 * @param isCircular Whether the component is circular
 * @returns Enhanced component with references
 */
export const setupComponentReferences = (component, state, isCircular) => {
  try {
    // Make sure component has elements property
    if (!component.elements) {
      console.warn('Progress component missing elements property. withLayout may not have been applied correctly.');
      component.elements = {};
    }
    
    // withLayout already created and stored the elements, we just need to expose
    // them as direct properties on the component for API access
    component.trackElement = component.elements?.track || null;
    component.indicatorElement = component.elements?.indicator || null;
    component.remainingElement = component.elements?.remaining || null;
    component.bufferElement = component.elements?.buffer || null;
    
    // For circular variant, SVG elements may be in a different structure
    if (isCircular && component.elements?.svg) {
      // The SVG element might contain the actual indicator, track, etc.
      // We can access them through the svg's children if needed
    }
    
    // Store label element in state if it exists
    if (component.elements?.label) {
      if (state) {
        state.labelElement = component.elements.label;
      }
      component.labelElement = component.elements.label;
    }
  } catch (error) {
    console.error('Error setting up progress component references:', error);
  }
  
  return component;
};

/**
 * Creates the base configuration for the Progress component
 * with all defaults applied
 * 
 * @param config User-provided configuration
 * @returns Complete configuration with defaults
 */
export const createBaseConfig = (config: ProgressConfig = {}): ProgressConfig => {
  // Create configuration with defaults
  const baseConfig = createComponentConfig(defaultConfig, config, 'progress') as ProgressConfig;
  
  // Create a basic component object for schema generation
  const baseComponent = {
    componentName: 'progress',
    config: baseConfig,
    getClass: (className) => {
      const prefix = baseConfig.prefix || 'mtrl';
      return `${prefix}-${className}`;
    }
  };
  
  // Add the structure definition to the config
  baseConfig.schema = createProgressSchema(baseComponent, baseConfig);
  
  return baseConfig;
};

/**
 * Generates element configuration for the Progress component
 * @param {ProgressConfig} config - Progress configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ProgressConfig) => {
  const isIndeterminate = config.indeterminate === true;
  
  // Create the attributes object
  const attributes: Record<string, any> = {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': (config.max || 100).toString()
  };
  
  // Only add aria-valuenow if not indeterminate
  if (!isIndeterminate && config.value !== undefined) {
    attributes['aria-valuenow'] = config.value.toString();
  }
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attributes['aria-disabled'] = 'true';
  }
  
  const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
  
  return createElementConfig(config, {
    tag: 'div',
    attributes,
    className: config.class
  });
};

/**
 * Creates API configuration for the Progress component
 * @param {Object} comp - Component with state management features
 * @param {Object} state - State object containing component state
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp, state) => {
  // Ensure we have a valid state object
  const safeState = state || {
    value: 0,
    max: 100,
    buffer: 0,
    indeterminate: false,
    labelFormatter: (v, m) => `${Math.round((v / m) * 100)}%`
  };
  
  return {
    value: {
      getValue: () => safeState.value,
      setValue: (value: number) => { 
        safeState.value = Math.max(0, Math.min(safeState.max, value)); 
      },
      getMax: () => safeState.max
    },
    buffer: {
      getBuffer: () => safeState.buffer,
      setBuffer: (value: number) => { 
        safeState.buffer = Math.max(0, Math.min(safeState.max, value)); 
      }
    },
    disabled: {
      enable: () => comp.disabled?.enable?.() || undefined,
      disable: () => comp.disabled?.disable?.() || undefined,
      isDisabled: () => comp.disabled?.isDisabled?.() || false
    },
    label: {
      show: () => {
        if (!safeState.labelElement) {
          const labelElement = document.createElement('div');
          labelElement.className = `${comp.getClass(PROGRESS_CLASSES.LABEL)}`;
          labelElement.textContent = safeState.labelFormatter(safeState.value, safeState.max);
          comp.element.appendChild(labelElement);
          safeState.labelElement = labelElement;
          comp.labelElement = labelElement;
        }
      },
      hide: () => {
        if (safeState.labelElement) {
          safeState.labelElement.remove();
          safeState.labelElement = undefined;
          comp.labelElement = undefined;
        }
      },
      format: (formatter) => { 
        safeState.labelFormatter = formatter; 
      },
      setContent: (content) => {
        if (safeState.labelElement) {
          safeState.labelElement.textContent = content;
        }
      }
    },
    state: {
      setIndeterminate: (indeterminate: boolean) => { 
        safeState.indeterminate = indeterminate; 
      },
      isIndeterminate: () => safeState.indeterminate
    },
    lifecycle: {
      destroy: () => comp.lifecycle?.destroy?.() || undefined
    }
  };
};

export default defaultConfig;