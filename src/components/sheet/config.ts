// src/components/sheet/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { SheetConfig } from './types';
import { SHEET_VARIANTS, SHEET_POSITIONS } from './constants';

/**
 * Default configuration for the Sheet component
 */
export const defaultConfig: SheetConfig = {
  variant: SHEET_VARIANTS.STANDARD,
  position: SHEET_POSITIONS.BOTTOM,
  open: false,
  dismissible: true,
  dragHandle: true,
  elevation: 3,
  enableGestures: true
};

/**
 * Creates the base configuration for Sheet component
 * @param {SheetConfig} config - User provided configuration
 * @returns {SheetConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SheetConfig = {}): SheetConfig => 
  createComponentConfig(defaultConfig, config, 'sheet') as SheetConfig;

/**
 * Generates element configuration for the Sheet component
 * @param {SheetConfig} config - Sheet configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SheetConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    attrs: {
      role: 'dialog',
      'aria-modal': config.variant === SHEET_VARIANTS.MODAL ? 'true' : 'false'
    },
    className: config.class,
    forwardEvents: {
      click: true,
      keydown: true
    }
  });
};

/**
 * Creates API configuration for the Sheet component
 * @param {Object} comp - Component with state and lifecycle features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  state: {
    open: () => comp.state.open(),
    close: () => comp.state.close()
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});

export default defaultConfig;
