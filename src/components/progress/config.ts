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
  thickness: 'default',
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
    config.class
  ].filter(Boolean);
  
  // Add thickness class if specified
  if (config.thickness === 'thin') {
    classList.push('progress--thin');
  } else if (config.thickness === 'thick') {
    classList.push('progress--thick');
  }
  
  // Add shape class for linear progress
  if (!isCircular && config.shape && config.shape !== PROGRESS_SHAPES.LINE) {
    classList.push(`progress--${config.shape}`);
  }
  
  return createElementConfig(config, {
    tag: 'div',
    attrs: attributes,
    className: classList
  });
};

/**
 * Creates API configuration for the Progress component
 * 
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
    shape: PROGRESS_DEFAULTS.SHAPE,
    labelFormatter: (v, m) => `${Math.round((v / m) * 100)}%`
  };
  
  if (safeState.thickness === undefined) {
    safeState.thickness = PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH;
  }

  if (safeState.shape === undefined) {
    safeState.shape = PROGRESS_DEFAULTS.SHAPE;
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
      formatter: safeState.labelFormatter
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
    shape: {
      getShape: () => safeState.shape,
      setShape: (shape: ProgressShape) => { 
        safeState.shape = shape; 
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