// src/components/dialog/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { DialogConfig } from './types';
import { DIALOG_SIZES, DIALOG_ANIMATIONS, DIALOG_FOOTER_ALIGNMENTS } from './constants';

/**
 * Default configuration for the Dialog component
 */
export const defaultConfig: DialogConfig = {
  size: DIALOG_SIZES.MEDIUM,
  animation: DIALOG_ANIMATIONS.SCALE,
  footerAlignment: DIALOG_FOOTER_ALIGNMENTS.RIGHT,
  open: false,
  closeButton: true,
  closeOnOverlayClick: true,
  closeOnEscape: true,
  modal: true,
  autofocus: true,
  trapFocus: true,
  headerDivider: false,
  footerDivider: false,
  animationDuration: 150,
  buttons: []
};

/**
 * Creates the base configuration for Dialog component
 * @param {DialogConfig} config - User provided configuration
 * @returns {DialogConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: DialogConfig = {}): DialogConfig => 
  createComponentConfig(defaultConfig, config, 'dialog') as DialogConfig;

/**
 * Generates element configuration for the Dialog component
 * @param {DialogConfig} config - Dialog configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: DialogConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    attrs: {},
    className: config.class
  });
};

/**
 * Generates element configuration for the Dialog overlay
 * @param {DialogConfig} config - Dialog configuration
 * @returns {Object} Element configuration object for overlay
 */
export const getOverlayConfig = (config: DialogConfig) => {
  return {
    tag: 'div',
    attrs: {
      'aria-modal': config.modal === false ? false : true,
      'role': 'dialog',
      'tabindex': -1
    },
    className: ''
  };
};

/**
 * Creates API configuration for the Dialog component
 * @param {Object} comp - Component with dialog features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  visibility: {
    open: () => comp.visibility.open(),
    close: () => comp.visibility.close(),
    toggle: (visible?: boolean) => comp.visibility.toggle(visible),
    isOpen: () => comp.visibility.isOpen()
  },
  content: {
    setTitle: (title: string) => comp.content.setTitle(title),
    getTitle: () => comp.content.getTitle(),
    setSubtitle: (subtitle: string) => comp.content.setSubtitle(subtitle),
    getSubtitle: () => comp.content.getSubtitle(),
    setContent: (content: string) => comp.content.setContent(content),
    getContent: () => comp.content.getContent(),
    getHeaderElement: () => comp.content.getHeaderElement(),
    getContentElement: () => comp.content.getContentElement(),
    getFooterElement: () => comp.content.getFooterElement()
  },
  buttons: {
    addButton: (button) => comp.buttons.addButton(button),
    removeButton: (indexOrText) => comp.buttons.removeButton(indexOrText),
    getButtons: () => comp.buttons.getButtons(),
    setFooterAlignment: (alignment) => comp.buttons.setFooterAlignment(alignment)
  },
  focus: {
    trapFocus: () => comp.focus.trapFocus(),
    releaseFocus: () => comp.focus.releaseFocus()
  },
  size: {
    setSize: (size) => comp.size.setSize(size)
  },
  events: {
    // Use the direct component methods from withEvents()
    on: (event, handler) => comp.on(event, handler),
    off: (event, handler) => comp.off(event, handler),
    trigger: (event, data) => comp.emit(event, data)
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});

export default defaultConfig;