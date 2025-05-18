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
 * Sets up indeterminate state animations and properties
 * 
 * @param component The progress component
 * @param isCircular Whether the component is in circular variant
 */
export const setupIndeterminateState = (component, isCircular) => {
  try {
    // Add indeterminate class to container if not already
    const container = component.element;
    if (!container.classList.contains(PROGRESS_CLASSES.INDETERMINATE)) {
      container.classList.add(PROGRESS_CLASSES.INDETERMINATE);
    }
    
    // Remove the aria-valuenow attribute if present
    container.removeAttribute('aria-valuenow');
    
    // Different treatments for circular vs linear indeterminate progress
    if (isCircular) {
      // For circular, we'll add animation properties to the SVG elements
      // Most of this will be handled by CSS
      
      // Find the SVG indicator and remaining elements if they exist
      const indicatorElement = component.indicatorElement;
      const remainingElement = component.remainingElement;
      
      if (indicatorElement) {
        // Enable rotation animation via CSS
        // (CSS class should handle this via the .progress--indeterminate class)
      }
      
      // Hide the remaining element if we're in indeterminate state
      if (remainingElement) {
        remainingElement.style.display = 'none';
      }
    } else {
      // For linear indeterminate, different animation approach
      
      // Schedule a small delay to make sure the DOM is fully constructed
      setTimeout(() => {
        try {
          const isSvgLinear = component.indicatorElement instanceof SVGElement;
          
          if (isSvgLinear) {
            // For SVG linear indeterminate progress
            // Most animation will be handled via CSS with the .progress--indeterminate class
            
            // Clear any x2 attribute on the indicator to allow CSS animations
            if (component.indicatorElement) {
              component.indicatorElement.removeAttribute('x2');
              
              // Make sure x1 is set to 0 for proper animation position
              component.indicatorElement.setAttribute('x1', '0');
              
              // Set initial x2 to 0 to ensure it doesn't show before animation starts
              component.indicatorElement.setAttribute('x2', '0');
              
              // Ensure the stroke-width is properly set
              // Get it from track element if possible, otherwise use 4px as default
              const trackElement = component.trackElement;
              const strokeWidth = trackElement ? trackElement.getAttribute('stroke-width') : '6';
              component.indicatorElement.setAttribute('stroke-width', strokeWidth);
              
              // Force SVG visibility with CSS
              component.indicatorElement.setAttribute('style', 'vector-effect: non-scaling-stroke;');
            }
            
            // Hide the remaining element
            if (component.remainingElement) {
              component.remainingElement.style.display = 'none';
            }
          } else {
            // For traditional DIV-based linear indeterminate
            
            // For the indicator, we'll let CSS handle the width and left position animations
            if (component.elements?.indicator instanceof HTMLElement) {
              component.elements.indicator.style.width = '';
              component.elements.indicator.style.left = '';
            }
            
            // Hide the remaining element 
            if (component.elements?.remaining instanceof HTMLElement) {
              component.elements.remaining.style.display = 'none';
            }
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
  console.log('setupComponentReferences', component, state, isCircular)
  try {
    // Get components from the component's components property
    // This is already flattened by withDom
    const components = component.components;
    
    if (!components) {
      console.warn('Progress component missing components property. withDom may not have been applied correctly.');
      return component;
    }

    // Get all track, indicator, remaining, and buffer elements directly from flattened components
    // These are available directly because withDom flattens the structure
    const trackElement = components.track as SVGElement;
    const indicatorElement = components.indicator as SVGElement;
    const remainingElement = components.remaining as SVGElement;
    const bufferElement = components.buffer as SVGElement;
    
    // Store references directly on component for API access
    component.trackElement = trackElement || null;
    component.indicatorElement = indicatorElement || null;
    component.remainingElement = remainingElement || null;
    component.bufferElement = bufferElement || null;
    
    // Store label element in state if it exists
    if (components.label) {
      if (state) {
        state.labelElement = components.label;
      }
      component.labelElement = components.label;
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