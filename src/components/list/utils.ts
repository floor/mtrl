// src/components/list/utils.ts
import { LIST_CLASSES } from './constants';

/**
 * Creates a divider element
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Divider element
 */
export const createDivider = (prefix: string): HTMLElement => {
  const divider = document.createElement('div');
  divider.className = `${prefix}-${LIST_CLASSES.DIVIDER}`;
  divider.setAttribute('role', 'separator');
  return divider;
};

/**
 * Creates a section title element
 * @param {string} title - Section title text
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Section title element
 */
export const createSectionTitle = (title: string, prefix: string): HTMLElement => {
  const titleEl = document.createElement('div');
  titleEl.className = `${prefix}-${LIST_CLASSES.SECTION_TITLE}`;
  titleEl.textContent = title;
  return titleEl;
};

/**
 * Creates a DOM element with optional class and content
 * @param {string} tag - HTML tag name
 * @param {string} className - CSS class name
 * @param {string|HTMLElement} [content] - Element content or child element
 * @returns {HTMLElement} Created element
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