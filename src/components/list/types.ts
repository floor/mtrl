// src/components/list/types.ts

/**
 * List types/variants
 * 
 * Different selection modes available for lists.
 * 
 * @category Components
 */
export const LIST_TYPES = {
  DEFAULT: 'default', // Standard list
  SINGLE_SELECT: 'single', // Single selection list
  MULTI_SELECT: 'multi', // Multiple selection list
  RADIO: 'radio' // Radio button list
} as const;

/**
 * List layout variants
 * 
 * Layout options for list items and content arrangement.
 * 
 * @category Components
 */
export const LIST_LAYOUTS = {
  HORIZONTAL: 'horizontal', // Default horizontal layout
  VERTICAL: 'vertical' // Items with more content stacked vertically
} as const;

/**
 * List item layouts
 * 
 * Individual item layout options controlling content arrangement.
 * 
 * @category Components
 */
export const LIST_ITEM_LAYOUTS = {
  HORIZONTAL: 'horizontal', // Default horizontal layout
  VERTICAL: 'vertical' // Stacked layout with vertical alignment
} as const;

/**
 * List element class names
 * 
 * CSS class names for the various elements that make up a list.
 * 
 * @internal
 */
export const LIST_CLASSES = {
  ROOT: 'list',
  GROUP: 'list-group',
  GROUP_TITLE: 'list-group-title',
  DIVIDER: 'list-divider',
  SECTION: 'list-section',
  SECTION_TITLE: 'list-section-title',
  ITEM: 'list-item',
  ITEM_CONTENT: 'list-item-content',
  ITEM_LEADING: 'list-item-leading',
  ITEM_TEXT: 'list-item-text',
  ITEM_OVERLINE: 'list-item-overline',
  ITEM_HEADLINE: 'list-item-headline',
  ITEM_SUPPORTING: 'list-item-supporting',
  ITEM_META: 'list-item-meta',
  ITEM_TRAILING: 'list-item-trailing'
} as const;

/**
 * List validation schema
 * 
 * JSON Schema for validating list configuration options.
 * 
 * @internal
 */
export const LIST_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.values(LIST_TYPES),
      default: LIST_TYPES.DEFAULT
    },
    layout: {
      type: 'string',
      enum: Object.values(LIST_LAYOUTS),
      default: LIST_LAYOUTS.HORIZONTAL
    },
    items: {
      type: 'array',
      items: {
        type: 'object'
      },
      default: []
    },
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true },
          title: { type: 'string' },
          items: { type: 'array' }
        }
      },
      optional: true
    },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true },
          title: { type: 'string', required: true },
          items: { type: 'array', required: true }
        }
      },
      optional: true
    },
    disabled: {
      type: 'boolean',
      default: false
    },
    class: {
      type: 'string',
      optional: true
    }
  }
} as const;

/**
 * List item states
 * 
 * Visual states that list items can have.
 * 
 * @category Components
 */
export const LIST_ITEM_STATES = {
  SELECTED: 'selected',
  DISABLED: 'disabled',
  FOCUSED: 'focused',
  HOVERED: 'hovered'
} as const;

/**
 * List type variants
 * @category Components
 */
export type ListType = 'default' | 'single' | 'multi' | 'radio';

/**
 * List layout variants
 * @category Components
 */
export type ListLayout = 'horizontal' | 'vertical';

/**
 * List item layout variants
 * @category Components
 */
export type ListItemLayout = 'horizontal' | 'vertical';

/**
 * List element class names
 * @internal
 */
export interface ListClasses {
  ROOT: string;
  GROUP: string;
  GROUP_TITLE: string;
  DIVIDER: string;
  SECTION: string;
  SECTION_TITLE: string;
  ITEM: string;
  ITEM_CONTENT: string;
  ITEM_LEADING: string;
  ITEM_TEXT: string;
  ITEM_OVERLINE: string;
  ITEM_HEADLINE: string;
  ITEM_SUPPORTING: string;
  ITEM_META: string;
  ITEM_TRAILING: string;
}

/**
 * List item states
 * @internal
 */
export type ListItemState = 'selected' | 'disabled' | 'focused' | 'hovered';

/**
 * List item configuration
 * 
 * Configuration options for creating a list item with customizable content
 * and appearance following Material Design 3 guidelines.
 * 
 * @category Components
 */
export interface ListItemConfig {
  /** Unique identifier for the item */
  id: string;
  
  /** Item layout (horizontal/vertical) */
  layout?: ListLayout | string;
  
  /** Leading content (icon/avatar) */
  leading?: string | HTMLElement;
  
  /** Primary text */
  headline?: string;
  
  /** Secondary text */
  supportingText?: string;
  
  /** Trailing content (icon/meta) */
  trailing?: string | HTMLElement;
  
  /** Text above headline (vertical only) */
  overline?: string;
  
  /** Meta information (vertical only) */
  meta?: string | HTMLElement;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** Whether the item is selected */
  selected?: boolean;
  
  /** Additional CSS classes */
  class?: string;
  
  /** ARIA role */
  role?: string;
  
  /** Whether this is a divider instead of an item */
  divider?: boolean;
}

/**
 * List section configuration
 * 
 * Configuration for a list section, which groups items under a title.
 * Sections help organize list content into logical groups.
 * 
 * @category Components
 */
export interface ListSectionConfig {
  /** Unique identifier for the section */
  id: string;
  
  /** Section title text */
  title: string;
  
  /** Items in this section */
  items: ListItemConfig[];
}

/**
 * Selection change event data
 * 
 * Data structure provided with selectionChange events
 * when list items are selected or deselected.
 * 
 * @category Components
 */
export interface SelectionChangeEvent {
  /** Array of selected item IDs */
  selected: string[];
  
  /** The item that was clicked */
  item?: ListItemData;
  
  /** List selection type */
  type: ListType | string;
}

/**
 * List item data
 * 
 * Internal data structure for tracking list items and their state.
 * 
 * @internal
 */
export interface ListItemData {
  /** The item's DOM element */
  element: HTMLElement;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** Internal properties */
  [key: string]: any;
}

/**
 * Configuration interface for the List component
 * 
 * Comprehensive options for creating and customizing a List
 * according to Material Design 3 guidelines.
 * 
 * @category Components
 */
export interface ListConfig {
  /** List selection type */
  type?: ListType | string;
  
  /** List layout */
  layout?: ListLayout | string;
  
  /** List items */
  items?: ListItemConfig[];
  
  /** List sections */
  sections?: ListSectionConfig[];
  
  /** Whether the list is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Prefix for class names */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
}

/**
 * List component interface
 * 
 * Public API for the List component, providing methods for
 * item management, selection handling, and event management.
 * 
 * @category Components
 */
export interface ListComponent {
  /** The root element of the list */
  element: HTMLElement;
  
  /** Map of list items */
  items: Map<string, ListItemData>;
  
  /** Set of selected item IDs */
  selectedItems: Set<string>;
  
  /** Gets the currently selected items */
  getSelected: () => string[];
  
  /** Sets the selected items */
  setSelected: (ids: string[]) => void;
  
  /** Adds a new item to the list */
  addItem: (itemConfig: ListItemConfig) => void;
  
  /** Removes an item from the list */
  removeItem: (id: string) => void;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => ListComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => ListComponent;
  
  /** Enables the list */
  enable: () => ListComponent;
  
  /** Disables the list */
  disable: () => ListComponent;
  
  /** Destroys the list component and cleans up resources */
  destroy: () => void;
}

/**
 * Base component interface
 * 
 * Internal interface for component composition in the List component.
 * 
 * @internal
 */
export interface BaseComponent {
  element: HTMLElement;
  prefix?: string;
  items?: Map<string, ListItemData>;
  selectedItems?: Set<string>;
  emit?: (event: string, data: any) => void;
  on?: (event: string, handler: Function) => any;
  off?: (event: string, handler: Function) => any;
  lifecycle?: {
    destroy: () => void;
  };
  disabled?: {
    enable: () => any;
    disable: () => any;
  };
  [key: string]: any;
}