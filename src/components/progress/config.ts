// src/components/progress/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component';
import { ProgressConfig } from './types';
import { 
  PROGRESS_CLASSES, 
  PROGRESS_EVENTS,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS,
  PROGRESS_DEFAULTS
} from './constants';
import { createProgressSchema } from './schema';
import { addClass, removeClass } from '../../core/dom';

/**
 * Default configuration for the Progress component
 */
export const defaultConfig: ProgressConfig = {
  variant: PROGRESS_DEFAULTS.VARIANT,
  value: PROGRESS_DEFAULTS.VALUE,
  max: PROGRESS_DEFAULTS.MAX,
  buffer: PROGRESS_DEFAULTS.BUFFER,
  showLabel: PROGRESS_DEFAULTS.SHOW_LABEL,
  thickness: 'thin' // Add default thickness
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
      
      // Find the SVG indicator and track elements if they exist
      const indicator = component.indicator;
      const track = component.track;
      
      // Hide the track element if we're in indeterminate state
      if (track) {
        track.style.display = 'none';
      }
    } else {
      // For linear indeterminate, different animation approach
      
      // Schedule a small delay to make sure the DOM is fully constructed
      setTimeout(() => {
        try {
          const isSvgLinear = component.indicator instanceof SVGElement;
          
          if (isSvgLinear) {
            // For SVG linear indeterminate progress
            // Most animation will be handled via CSS with the .progress--indeterminate class
            
            // Clear any x2 attribute on the indicator to allow CSS animations
            if (component.indicator) {
              component.indicator.removeAttribute('x2');
              
              // Make sure x1 is set to 0 for proper animation position
              component.indicator.setAttribute('x1', '0');
              
              // Set initial x2 to 0 to ensure it doesn't show before animation starts
              component.indicator.setAttribute('x2', '0');
              
              // Ensure the stroke-width is properly set
              component.indicator.setAttribute('stroke-width', '6');
              
              // Force SVG visibility with CSS
              component.indicator.setAttribute('style', 'vector-effect: non-scaling-stroke;');
            }
            
            // Hide the track element
            if (component.track) {
              component.track.style.display = 'none';
            }
          } else {
            // For traditional DIV-based linear indeterminate
            
            // For the indicator, we'll let CSS handle the width and left position animations
            if (component.elements?.indicator instanceof HTMLElement) {
              component.elements.indicator.style.width = '';
              component.elements.indicator.style.left = '';
            }
            
            // Hide the track element 
            if (component.elements?.track instanceof HTMLElement) {
              component.elements.track.style.display = 'none';
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
  try {
    // Make sure component has elements property
    if (!component.elements) {
      console.warn('Progress component missing elements property. withLayout may not have been applied correctly.');
      component.elements = {};
    }

    // Check if we're using SVG-based structure
    const svgElement = component.elements?.svg;
    
    if (svgElement) {
      // Get indicator, track, and buffer elements from the SVG
      if (svgElement.querySelector) {
        const indicator = svgElement.querySelector(`.${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.INDICATOR}`);
        const track = svgElement.querySelector(`.${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.TRACK}`);
        const buffer = svgElement.querySelector(`.${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.BUFFER}`);
        
        // Store references directly on component for API access
        component.indicator = indicator || null;
        component.track = track || null;
        component.buffer = buffer || null;
        
        // Also update elements object to keep everything consistent
        component.elements.indicator = indicator || null;
        component.elements.track = track || null;
        component.elements.buffer = buffer || null;
      } else {
        // If querySelector is not available, fall back to direct child references
        component.indicator = component.elements?.indicator || null;
        component.track = component.elements?.track || null;
        component.buffer = component.elements?.buffer || null;
      }
    } else {
      // Legacy DIV structure for linear progress
      component.indicator = component.elements?.indicator || null;
      component.track = component.elements?.track || null;
      component.buffer = component.elements?.buffer || null;
    }
    
    // Store label element in state if it exists
    if (component.elements?.label) {
      if (state) {
        state.label = component.elements.label;
      }
      component.label = component.elements.label;
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
    thickness: PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH,
    labelFormatter: (v, m) => `${Math.round((v / m) * 100)}%`
  };
  
  if (safeState.thickness === undefined) {
    safeState.thickness = PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH;
  }

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
        if (!safeState.label) {
          const label = document.createElement('div');
          label.className = `${comp.getClass(PROGRESS_CLASSES.LABEL)}`;
          label.textContent = safeState.labelFormatter(safeState.value, safeState.max);
          comp.element.appendChild(label);
          safeState.label = label;
          comp.label = label;
        }
      },
      hide: () => {
        if (safeState.label) {
          safeState.label.remove();
          safeState.label = undefined;
          comp.label = undefined;
        }
      },
      format: (formatter) => { 
        safeState.labelFormatter = formatter; 
      },
      setContent: (content) => {
        if (safeState.label) {
          safeState.label.textContent = content;
        }
      }
    },
    thickness: {
      getThickness: () => safeState.thickness,
      setThickness: (thickness: ProgressThickness) => {
        // Convert named presets to pixel values
        if (thickness === 'thin') {
          safeState.thickness = PROGRESS_THICKNESS.THIN;
        } else if (thickness === 'thick') {
          safeState.thickness = PROGRESS_THICKNESS.THICK;
        } else if (thickness === 'default') {
          safeState.thickness = PROGRESS_THICKNESS.DEFAULT;
        } else if (typeof thickness === 'number') {
          safeState.thickness = thickness;
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