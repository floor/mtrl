// src/components/list/utils.ts

// List element class names as strings for internal use
const LIST_CLASS_NAMES = {
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
};

/**
 * Creates a divider element for lists
 * 
 * Creates a horizontal divider that can be used to separate list items
 * following Material Design 3 guidelines.
 * 
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Divider element
 * 
 * @internal
 */
export const createDivider = (prefix: string): HTMLElement => {
  const divider = document.createElement('div');
  divider.className = `${prefix}-${LIST_CLASS_NAMES.DIVIDER}`;
  divider.setAttribute('role', 'separator');
  return divider;
};

/**
 * Creates a section title element for lists
 * 
 * Creates a section header element used to group list items into logical sections
 * following Material Design 3 guidelines for list organization.
 * 
 * @param {string} title - Section title text
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Section title element
 * 
 * @internal
 */
export const createSectionTitle = (title: string, prefix: string): HTMLElement => {
  const titleEl = document.createElement('div');
  titleEl.className = `${prefix}-${LIST_CLASS_NAMES.SECTION_TITLE}`;
  titleEl.textContent = title;
  return titleEl;
};

/**
 * Creates a DOM element with optional class and content
 * 
 * Utility function for creating DOM elements with proper class names and content
 * for list items and their sub-elements.
 * 
 * @param {string} tag - HTML tag name
 * @param {string} className - CSS class name
 * @param {string|HTMLElement} [content] - Element content or child element
 * @returns {HTMLElement} Created element
 * 
 * @internal
 */
export const createElement = (tag: string, className: string, content?: string | HTMLElement): HTMLElement => {
  const element = document.createElement(tag);
  element.className = className;
  if (content) {
    if (typeof content === 'string') {
      element.textContent = content;
    } else {
      element.appendChild(content);
    }
  }
  return element;
};

/**
 * Gets the class name for a list element
 * 
 * Retrieves the standard class name for list elements from a consistent
 * centralized naming scheme.
 * 
 * @param {string} element - Element name
 * @returns {string} The class name string
 * 
 * @internal
 */
export const getListClass = (element: keyof typeof LIST_CLASS_NAMES): string => {
  return LIST_CLASS_NAMES[element];
};