// src/components/sheet/sheet.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withVariant,
  withState,
  withLifecycle,
  withGestures
} from '../../core/compose/features';
import {
  withContent,
  withTitle,
  withPosition,
  withState,
  withGestures
} from './features';
import { withAPI } from './api';
import { SheetConfig, SHEET_VARIANTS, SHEET_POSITIONS } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Sheet component
 * 
 * A Sheet component provides a surface that slides up from the bottom of the screen
 * to display content. Sheets can be draggable, fullscreen, or modal, and support
 * custom positions, titles, and content areas.
 * 
 * @param {SheetConfig} config - Sheet configuration object
 * @returns {SheetComponent} Sheet component instance
 * 
 * @example
 * ```typescript
 * // Create a standard bottom sheet
 * const infoSheet = fSheet({
 *   title: 'Product Details',
 *   content: document.getElementById('product-info'),
 *   draggable: true,
 *   backdrop: true
 * });
 * 
 * // Create a modal side sheet
 * const filterSheet = fSheet({
 *   title: 'Filter Options',
 *   position: 'right',
 *   variant: 'modal',
 *   content: document.getElementById('filter-form')
 * });
 * 
 * // Open and interact with the sheet
 * infoSheet.open();
 * 
 * // Listen for sheet events
 * infoSheet.on('close', () => {
 *   console.log('Sheet was closed');
 * });
 * ```
 */
const fSheet = (config: SheetConfig = {}) => {
  const baseConfig = createBaseConfig(config);

  try {
    const sheet = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withPosition(baseConfig),
      withContent(baseConfig),
      withTitle(baseConfig),
      withState(baseConfig),
      withGestures(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Initialize the sheet (create DOM structure, add event listeners)
    sheet.initialize();

    return sheet;
  } catch (error) {
    console.error('Sheet creation error:', error);
    throw new Error(`Failed to create sheet: ${(error as Error).message}`);
  }
};

export default fSheet;