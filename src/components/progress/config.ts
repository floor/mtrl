// src/components/progress/config.ts - Simplified for canvas

import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component';
import { ProgressConfig, ProgressThickness, ProgressShape } from './types';
import { 
  PROGRESS_CLASSES, 
  PROGRESS_VARIANTS,
  PROGRESS_SHAPES,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS,
  PROGRESS_DEFAULTS
} from './constants';

/**
 * Default configuration for the Progress component
 */
export const defaultConfig: ProgressConfig = {
  variant: PROGRESS_DEFAULTS.VARIANT,
  value: PROGRESS_DEFAULTS.VALUE,
  max: PROGRESS_DEFAULTS.MAX,
  buffer: PROGRESS_DEFAULTS.BUFFER,
  showLabel: PROGRESS_DEFAULTS.SHOW_LABEL,
  thickness: 'thin',
  shape: PROGRESS_DEFAULTS.SHAPE
};

/**
 * Creates the base configuration for the Progress component
 * with all defaults applied (no complex schema needed for canvas)
 * 
 * @param config User-provided configuration
 * @returns Complete configuration with defaults
 */
export const createBaseConfig = (config: ProgressConfig = {}): ProgressConfig => {
  // Create configuration with defaults - no schema needed for canvas approach
  return createComponentConfig(defaultConfig, config, 'progress') as ProgressConfig;
};

/**
 * Generates element configuration for the Progress container
 * Canvas will be added by withCanvas feature
 * 
 * @param {ProgressConfig} config - Progress configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ProgressConfig) => {
  const isIndeterminate = config.indeterminate === true;
  const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
  
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
  
  // Build class list
  const classList = [
    config.class,
    PROGRESS_CLASSES.CONTAINER,
    isCircular ? PROGRESS_CLASSES.CIRCULAR : PROGRESS_CLASSES.LINEAR
  ].filter(Boolean);
  
  // Add shape class for linear progress
  if (!isCircular && config.shape && config.shape !== PROGRESS_SHAPES.LINE) {
    classList.push(`${PROGRESS_CLASSES.CONTAINER}--${config.shape}`);
  }
  
  return createElementConfig(config, {
    tag: 'div',
    attributes,
    className: classList
  });
};

/**
 * Creates API configuration for the Progress component
 */
export const getApiConfig = (comp, state) => {
  // Use component's state directly
  if (!comp.state) {
    comp.state = {
      value: 0,
      max: 100,
      buffer: 0,
      indeterminate: false,
      thickness: 'thin',
      shape: PROGRESS_DEFAULTS.SHAPE,
      labelFormatter: (v, m) => `${Math.round((v / m) * 100)}%`
    };
  }

  return {
    value: {
      getValue: () => comp.state.value,
      setValue: (value: number) => {
        if (comp.state) {
          // Clamp value between 0 and max
          const clampedValue = Math.max(0, Math.min(comp.state.max, value));
          // Store the previous value for animation
          comp.state.previousValue = comp.state.value;
          // Update the state value
          comp.state.value = clampedValue;
          // Update label if it exists
          if (comp.state.label) {
            comp.state.label.textContent = comp.state.labelFormatter(clampedValue, comp.state.max);
          }
          // Trigger animation through canvas component
          if (typeof comp.setValue === 'function') {
            comp.setValue(clampedValue);
          } else if (comp.draw) {
            // Fallback to immediate redraw if setValue is not available
            comp.draw();
          }
        }
      },
      getMax: () => comp.state.max
    },
    buffer: {
      getBuffer: () => comp.state.buffer,
      setBuffer: (value: number) => { 
        comp.state.buffer = Math.max(0, Math.min(comp.state.max, value));
      }
    },
    disabled: {
      enable: () => comp.disabled?.enable?.() || undefined,
      disable: () => comp.disabled?.disable?.() || undefined,
      isDisabled: () => comp.disabled?.isDisabled?.() || false
    },
    label: {
      show: () => {
        if (!comp.state.label) {
          const label = document.createElement('div');
          label.className = `${comp.getClass(PROGRESS_CLASSES.LABEL)}`;
          label.textContent = comp.state.labelFormatter(comp.state.value, comp.state.max);
          comp.element.appendChild(label);
          comp.state.label = label;
          comp.label = label;
        }
      },
      hide: () => {
        if (comp.state.label) {
          comp.state.label.remove();
          comp.state.label = undefined;
          comp.label = undefined;
        }
      },
      format: (formatter) => { 
        comp.state.labelFormatter = formatter; 
      },
      formatter: comp.state.labelFormatter
    },
    thickness: {
      getThickness: () => {
        const thickness = comp.state.thickness;
        if (thickness === 'thin') {
          return PROGRESS_THICKNESS.THIN;
        } else if (thickness === 'thick') {
          return PROGRESS_THICKNESS.THICK;
        } else if (typeof thickness === 'number') {
          return thickness;
        }
        return PROGRESS_THICKNESS.THIN;
      },
      setThickness: (thickness: ProgressThickness) => {
        comp.state.thickness = thickness;
        if (comp.draw) {
          comp.draw();
        }
      }
    },
    shape: {
      getShape: () => comp.state.shape,
      setShape: (shape: ProgressShape) => { 
        comp.state.shape = shape;
        if (comp.setShape) {
          comp.setShape(shape);
        }
      }
    },
    state: {
      setIndeterminate: (indeterminate: boolean) => { 
        if (comp.state) {
          comp.state.indeterminate = indeterminate;
          if (typeof comp.setIndeterminate === 'function') {
            comp.setIndeterminate(indeterminate);
          } else if (comp.draw) {
            comp.draw();
          }
        }
      },
      isIndeterminate: () => comp.state.indeterminate
    },
    lifecycle: {
      destroy: () => comp.lifecycle?.destroy?.() || undefined
    }
  };
};

export default defaultConfig;