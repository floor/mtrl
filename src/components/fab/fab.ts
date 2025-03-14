// src/components/fab/fab.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withIcon,
  withVariant,
  withRipple,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withAPI } from './api';
import { FabConfig, FabComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Floating Action Button (FAB) component
 * 
 * @param {FabConfig} config - FAB configuration object
 * @returns {FabComponent} FAB component instance
 * 
 * @example
 * ```typescript
 * // Create a default FAB with a plus icon
 * const fab = createFab({
 *   icon: '<svg>...</svg>',
 *   ariaLabel: 'Add new item'
 * });
 * 
 * // Create a small FAB with a custom position
 * const smallFab = createFab({
 *   size: FAB_SIZES.SMALL,
 *   icon: '<svg>...</svg>',
 *   variant: 'secondary',
 *   position: 'bottom-right'
 * });
 * 
 * // Add click handler
 * fab.on('click', () => {
 *   console.log('FAB clicked');
 * });
 * ```
 */
const createFab = (config: FabConfig = {}): FabComponent => {
  const fabConfig = createBaseConfig(config);

  try {
    const fab = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(fabConfig)),
      withVariant(fabConfig),
      withIcon(fabConfig),
      withDisabled(fabConfig),
      withRipple(fabConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(fabConfig);
    
    return fab;
  } catch (error) {
    console.error('FAB creation error:', error);
    throw new Error(`Failed to create FAB: ${(error as Error).message}`);
  }
};

export default createFab;