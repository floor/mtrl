// src/components/dialog/dialog.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { 
  withStructure, 
  withVisibility, 
  withContent, 
  withButtons, 
  withSize,
  withConfirm
} from './features';
import { withAPI } from './api';
import { DialogConfig, DialogComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Dialog component
 * @param {DialogConfig} config - Dialog configuration object
 * @returns {DialogComponent} Dialog component instance
 */
const createDialog = (config: DialogConfig = {}): DialogComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Maintain original order but setup event-based communication
    const dialog = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withStructure(baseConfig),  // Keep structure first to create overlay
      withVisibility(),           // Then add visibility features
      withContent(),
      withButtons(),
      withSize(),
      withConfirm(),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Register event handlers from config
    if (baseConfig.on) {
      Object.entries(baseConfig.on).forEach(([event, handler]) => {
        if (typeof handler === 'function') {
          dialog.on(event, handler);
        }
      });
    }

    return dialog;
  } catch (error) {
    console.error('Dialog creation error:', error);
    throw new Error(`Failed to create dialog: ${(error as Error).message}`);
  }
};

export default createDialog;