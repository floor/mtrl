// src/components/progress/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { ProgressConfig } from './types';
import { PROGRESS_VARIANTS, PROGRESS_SIZES } from './constants';

/**
 * Default configuration for the Progress component
 */
export const defaultConfig: ProgressConfig = {
  variant: PROGRESS_VARIANTS.LINEAR,
  size: PROGRESS_SIZES.MEDIUM,
  value: 0,
  max: 100,
  buffer: 0,
  showLabel: false
  // Don't set disabled: false as default - it should be undefined by default
};

/**
 * Creates the base configuration for Progress component
 * @param {ProgressConfig} config - User provided configuration
 * @returns {ProgressConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: ProgressConfig = {}): ProgressConfig => 
  createComponentConfig(defaultConfig, config, 'progress') as ProgressConfig;

/**
 * Generates element configuration for the Progress component
 * @param {ProgressConfig} config - Progress configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ProgressConfig) => {
  const isIndeterminate = config.indeterminate === true;
  
  // Create the attributes object
  const attrs: Record<string, any> = {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': (config.max || 100).toString()
  };
  
  // Only add aria-valuenow if not indeterminate
  if (!isIndeterminate && config.value !== undefined) {
    attrs['aria-valuenow'] = config.value.toString();
  }
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attrs['aria-disabled'] = 'true';
  }
  
  const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
  
  return createElementConfig(config, {
    tag: 'div',
    attrs,
    className: config.class
  });
};

/**
 * Creates API configuration for the Progress component
 * @param {Object} comp - Component with state management features
 * @param {Object} state - State object containing component state
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp, state) => ({
  value: {
    getValue: () => state.value,
    setValue: (value: number) => { 
      state.value = Math.max(0, Math.min(state.max, value)); 
    },
    getMax: () => state.max
  },
  buffer: {
    getBuffer: () => state.buffer,
    setBuffer: (value: number) => { 
      state.buffer = Math.max(0, Math.min(state.max, value)); 
    }
  },
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable(),
    isDisabled: () => comp.disabled.isDisabled()
  },
  label: {
    show: () => {
      if (!state.labelElement) {
        const labelElement = document.createElement('div');
        labelElement.className = `${comp.getClass('progress')}-label`;
        labelElement.textContent = state.labelFormatter(state.value, state.max);
        comp.element.appendChild(labelElement);
        state.labelElement = labelElement;
        comp.labelElement = labelElement;
      }
    },
    hide: () => {
      if (state.labelElement) {
        state.labelElement.remove();
        state.labelElement = undefined;
        comp.labelElement = undefined;
      }
    },
    format: (formatter) => { state.labelFormatter = formatter; },
    setContent: (content) => {
      if (state.labelElement) {
        state.labelElement.textContent = content;
      }
    }
  },
  state: {
    setIndeterminate: (indeterminate: boolean) => { state.indeterminate = indeterminate; },
    isIndeterminate: () => state.indeterminate
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});

export default defaultConfig;