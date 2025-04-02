// src/components/list/list.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withDisabled, withLifecycle } from '../../core/compose/features';
import { withAPI } from './api';
import { withListContent } from './features';
import { ListConfig } from './types';
import { createBaseConfig, getElementConfig } from './config';

/**
 * Creates a List component
 * 
 * Lists display a collection of items in a vertical arrangement. They can be configured
 * with different selection modes, layouts, and content structures following Material
 * Design 3 guidelines.
 * 
 * @param {ListConfig} config - List configuration options
 * @returns {ListComponent} List component instance with methods for managing items and selection
 * 
 * @throws {Error} If list creation fails due to invalid configuration
 * 
 * @category Components
 * 
 * @example
 * ```typescript
 * // Create a simple list with single selection
 * const contactList = createList({
 *   type: 'single',
 *   items: [
 *     {
 *       id: 'contact1',
 *       headline: 'Alex Johnson',
 *       supportingText: 'alex@example.com',
 *       leading: '<span class="material-icons">person</span>',
 *       trailing: '<span class="material-icons">chevron_right</span>'
 *     },
 *     {
 *       id: 'contact2',
 *       headline: 'Sam Taylor',
 *       supportingText: 'sam@example.com',
 *       leading: '<span class="material-icons">person</span>',
 *       trailing: '<span class="material-icons">chevron_right</span>'
 *     }
 *   ]
 * });
 * 
 * // Create a list with sections
 * const categorizedList = createList({
 *   type: 'multi',
 *   sections: [
 *     {
 *       id: 'section1',
 *       title: 'Favorites',
 *       items: [
 *         { id: 'item1', headline: 'Item 1' },
 *         { id: 'item2', headline: 'Item 2' }
 *       ]
 *     },
 *     {
 *       id: 'section2',
 *       title: 'Recent',
 *       items: [
 *         { id: 'item3', headline: 'Item 3' },
 *         { id: 'item4', headline: 'Item 4' }
 *       ]
 *     }
 *   ]
 * });
 * 
 * // Handle selection change
 * contactList.on('selectionChange', (event) => {
 *   console.log('Selected IDs:', event.selected);
 * });
 * 
 * // Programmatically select items
 * contactList.setSelected(['contact2']);
 * 
 * // Add a new item
 * contactList.addItem({
 *   id: 'contact3',
 *   headline: 'Jamie Smith',
 *   supportingText: 'jamie@example.com'
 * });
 * ```
 */
const createList = (config: ListConfig = {}): any => {
  const baseConfig = createBaseConfig(config);

  try {
    return pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withDisabled(baseConfig),
      withLifecycle(),
      withListContent(baseConfig),
      comp => withAPI({
        disabled: comp.disabled,
        lifecycle: comp.lifecycle
      })(comp)
    )(baseConfig);
  } catch (error) {
    console.error('List creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create list: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createList;