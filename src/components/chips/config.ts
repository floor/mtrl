// src/components/chips/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component';
import { ChipsConfig } from './types';
import { createChipsSchema } from './schema';

/**
 * Default configuration for the Chips component
 */
export const defaultConfig: ChipsConfig = {
  chips: [],
  scrollable: false,
  vertical: false,
  multiSelect: false,
  onChange: null,
  selector: null,
  labelPosition: 'start'
};

/**
 * Creates the base configuration for Chips component
 * @param {ChipsConfig} config - User provided configuration
 * @returns {ChipsConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: ChipsConfig = {}): ChipsConfig => {
  // Create the base config with defaults applied
  const baseConfig = createComponentConfig(defaultConfig, config, 'chips') as ChipsConfig;
  
  // Create a basic component object for structure generation
  const baseComponent = {
    componentName: 'chips',
    config: baseConfig,
    getClass: (className) => {
      const prefix = baseConfig.prefix || 'mtrl';
      return className ? `${prefix}-${className}` : prefix;
    }
  };
  
  // Add the structure definition to the config
  baseConfig.schema = createChipsSchema(baseComponent, baseConfig);
  
  return baseConfig;
};

/**
 * Generates element configuration for the Chips component
 * @param {ChipsConfig} config - Chips configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ChipsConfig) => 
  createElementConfig(config, {
    tag: 'div',
    attributes: {
      role: 'group',
      'aria-multiselectable': config.multiSelect === true ? 'true' : 'false'
      // tabindex: '0' removed
    },
    className: [
      config.class
    ].filter(Boolean)
  });

/**
 * Creates API configuration for the Chips component
 * @param {Object} comp - Component with chips features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  chips: {
    addChip: function(chipConfig) {
      if (comp.chips && typeof comp.chips.addChip === 'function') {
        return comp.chips.addChip(chipConfig);
      }
      return null;
    },
    removeChip: (chipOrIndex) => comp.chips?.removeChip?.(chipOrIndex),
    getChips: () => comp.chips?.getChips?.() ?? [],
    getSelectedChips: () => comp.chips?.getSelectedChips?.() ?? [],
    getSelectedValues: () => comp.chips?.getSelectedValues?.() ?? [],
    selectByValue: (values) => comp.chips?.selectByValue?.(values),
    clearSelection: () => comp.chips?.clearSelection?.(),
    scrollToChip: (chipOrIndex) => comp.chips?.scrollToChip?.(chipOrIndex)
  },
  layout: {
    setScrollable: (isScrollable) => comp.layout?.setScrollable?.(isScrollable),
    isScrollable: () => comp.layout?.isScrollable?.() ?? false,
    setVertical: (isVertical) => comp.layout?.setVertical?.(isVertical),
    isVertical: () => comp.layout?.isVertical?.() ?? false
  },
  label: {
    setText: (t) => comp.label?.setText?.(t),
    getText: () => comp.label?.getText?.() ?? '',
    setPosition: (p) => comp.label?.setPosition?.(p),
    getPosition: () => comp.label?.getPosition?.() ?? 'start'
  },
  keyboard: {
    enableKeyboardNavigation: () => comp.keyboard?.enable?.(),
    disableKeyboardNavigation: () => comp.keyboard?.disable?.()
  },
  events: {
    on: (e, h) => comp.on?.(e, h),
    off: (e, h) => comp.off?.(e, h)
  },
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.()
  }
});