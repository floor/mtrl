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
 * Floating Action Buttons (FABs) represent the primary action in an application.
 * They're circular buttons that float above the UI, and typically contain an icon.
 * FABs follow Material Design 3 guidelines with support for multiple variants,
 * sizes, and positioning options.
 * 
 * @param {FabConfig} config - FAB configuration object
 * @returns {FabComponent} FAB component instance
 * 
 * @throws {Error} If the FAB cannot be created due to invalid configuration
 * 
 * @category Components
 * 
 * @example
 * ```typescript
 * // Create a default FAB with a plus icon
 * const fab = fFab({
 *   icon: '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
 *   ariaLabel: 'Add new item'
 * });
 * 
 * // Create a small FAB with a custom position
 * const smallFab = fFab({
 *   size: 'small',
 *   icon: '<svg>...</svg>',
 *   variant: 'secondary',
 *   position: 'bottom-right'
 * });
 * 
 * // Add click handler and attach to DOM
 * fab.on('click', () => {
 *   console.log('FAB clicked');
 * });
 * document.body.appendChild(fab.element);
 * 
 * // Later, update the FAB's appearance
 * fab.setIcon('<span class="material-icons">edit</span>');
 * fab.setPosition('bottom-left');
 * ```
 */
const fFab = (config: FabConfig = {}): FabComponent => {
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

export default fFab;