// src/components/dialog/dialog.ts
/**
 * Dialog Component Implementation
 * 
 * This module implements a Material Design 3 dialog component that can be
 * used for alerts, confirmations, form submissions, and complex interactions.
 * 
 * The implementation supports various features including:
 * - Multiple size variants (small, medium, large, fullwidth, fullscreen)
 * - Multiple animation styles
 * - Custom buttons with configurable actions
 * - Dividers for visual separation
 * - Confirmation dialog patterns
 * - Event handling for dialog lifecycle
 * 
 * @module components/dialog
 * @category Components
 */

import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { 
  withStructure, 
  withVisibility, 
  withContent, 
  withButtons, 
  withSize,
  withConfirm,
  withDivider // Simplified to single divider feature
} from './features';
import { withAPI } from './api';
import { DialogConfig, DialogComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Dialog component with the specified configuration.
 * 
 * Dialogs are modal windows that appear in front of app content to
 * provide critical information or ask for decisions. They inform
 * users about specific tasks and may contain critical information,
 * require decisions, or involve multiple tasks.
 * 
 * @param {DialogConfig} config - Configuration options for the dialog
 * @returns {DialogComponent} A fully configured dialog component instance
 * @throws {Error} Throws an error if dialog creation fails
 * 
 * @category Components
 * 
 * @example
 * // Create a basic dialog with title and content
 * const infoDialog = createDialog({
 *   title: 'Information',
 *   content: 'Your changes have been saved.',
 *   size: 'small',
 *   buttons: [
 *     { text: 'OK', variant: 'text', closeDialog: true }
 *   ]
 * });
 * 
 * document.body.appendChild(infoDialog.element);
 * infoDialog.open();
 * 
 * @example
 * // Create a form dialog with multiple buttons
 * const formDialog = createDialog({
 *   title: 'Edit Profile',
 *   content: '<form id="profile-form">...</form>',
 *   size: 'medium',
 *   closeOnEscape: true,
 *   closeOnOverlayClick: false,
 *   buttons: [
 *     { 
 *       text: 'Save', 
 *       variant: 'filled', 
 *       onClick: (event, dialog) => {
 *         const form = document.getElementById('profile-form');
 *         if(form.checkValidity()) {
 *           saveProfile(form);
 *           dialog.close();
 *         }
 *       }
 *     },
 *     { text: 'Cancel', variant: 'text', closeDialog: true }
 *   ]
 * });
 * 
 * @example
 * // Create a confirmation dialog using the Promise-based API
 * async function confirmAction() {
 *   const dialog = createDialog();
 *   const confirmed = await dialog.confirm({
 *     title: 'Confirm Action',
 *     message: 'Are you sure you want to proceed?',
 *     confirmText: 'Yes, proceed',
 *     cancelText: 'No, cancel'
 *   });
 *   
 *   if (confirmed) {
 *     // User clicked the confirm button
 *     performAction();
 *   }
 * }
 */
const createDialog = (config: DialogConfig = {}): DialogComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create the dialog through functional composition
    // Each function in the pipe adds specific features to the component
    const dialog = pipe(
      createBase,                                  // Base component
      withEvents(),                                // Event handling
      withElement(getElementConfig(baseConfig)),   // DOM element
      withStructure(baseConfig),                   // Dialog structure (overlay, header, content, footer)
      withVisibility(),                            // Open/close functionality
      withContent(),                               // Content management
      withButtons(),                               // Footer buttons
      withSize(),                                  // Size variants
      withDivider(),                               // Header/content divider
      withConfirm(),                               // Confirmation dialog helpers
      withLifecycle(),                             // Lifecycle management
      comp => withAPI(getApiConfig(comp))(comp)    // Public API
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