// src/components/list/types.ts

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