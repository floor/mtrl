// src/components/list/index.ts

/**
 * @module List
 * 
 * List component following Material Design 3 guidelines.
 * Lists are continuous, vertical indexes of text or images.
 * 
 * Features:
 * - Multiple selection modes (single, multiple, none)
 * - Horizontal and vertical layouts
 * - Support for sections and dividers
 * - Leading and trailing elements (icons, avatars, etc.)
 * - Customizable item content (headline, supporting text, etc.)
 * - Keyboard navigation and accessibility
 * 
 * @example
 * ```typescript
 * // Create a simple list with items
 * const userList = createList({
 *   type: 'single', // Single selection mode
 *   items: [
 *     {
 *       id: 'user1',
 *       headline: 'Jane Smith',
 *       supportingText: 'Software Engineer',
 *       leading: '<svg>...</svg>'
 *     },
 *     {
 *       id: 'user2',
 *       headline: 'John Doe',
 *       supportingText: 'Product Manager',
 *       leading: '<svg>...</svg>'
 *     }
 *   ]
 * });
 * 
 * // Attach to DOM and add selection handler
 * container.appendChild(userList.element);
 * userList.on('selectionChange', (event) => {
 *   console.log('Selected:', event.selected);
 * });
 * ```
 * 
 * @category Components
 */

export { default } from './list';
export { default as createListItem } from './list-item';
export {
  // Types
  ListConfig,
  ListComponent,
  ListItemConfig,
  ListSectionConfig,
  ListType,
  ListLayout,
  ListItemLayout,

  // Constants
  LIST_TYPES,
  LIST_LAYOUTS,
  LIST_ITEM_LAYOUTS,
  LIST_CLASSES,
  LIST_SCHEMA,
  LIST_ITEM_STATES
} from './types';