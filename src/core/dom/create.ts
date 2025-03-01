// src/core/dom/create.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

import { setAttributes } from './attributes';
import { normalizeClasses } from '../utils';

/**
 * Options for element creation
 */
export interface CreateElementOptions {
  /**
   * HTML tag name
   */
  tag?: string;
  
  /**
   * Container to append element to
   */
  container?: HTMLElement | null;
  
  /**
   * Inner HTML content
   */
  html?: string;
  
  /**
   * Text content
   */
  text?: string;
  
  /**
   * Element ID
   */
  id?: string;
  
  /**
   * Dataset attributes
   */
  data?: Record<string, string>;
  
  /**
   * CSS classes
   */
  className?: string | string[] | null;
  
  /**
   * HTML attributes
   */
  attrs?: Record<string, any>;
  
  /**
   * Events to forward when component has emit method
   */
  forwardEvents?: Record<string, boolean | ((context: any, event: Event) => boolean)>;
  
  /**
   * Callback after element creation
   */
  onCreate?: (element: HTMLElement, context?: any) => void;
  
  /**
   * Component context
   */
  context?: any;
  
  /**
   * Additional attributes
   */
  [key: string]: any;
}

/**
 * Creates a DOM element with the specified options
 *
 * @param {CreateElementOptions} options - Element creation options
 * @returns {HTMLElement} Created element
 */
export const createElement = (options: CreateElementOptions = {}): HTMLElement => {
  const {
    tag = 'div',
    container = null,
    html = '',
    text = '',
    id = '',
    data = {},
    className,
    attrs = {},
    forwardEvents = {},
    onCreate,
    context,
    ...rest
  } = options;

  const element = document.createElement(tag);

  // Handle content
  if (html) element.innerHTML = html;
  if (text) element.textContent = text;
  if (id) element.id = id;

  // Handle classes
  if (className) {
    const normalizedClasses = normalizeClasses(className);
    if (normalizedClasses.length) {
      element.classList.add(...normalizedClasses);
    }
  }

  // Handle data attributes
  Object.entries(data).forEach(([key, value]) => {
    element.dataset[key] = value;
  });

  // Handle all other attributes
  const allAttrs = { ...attrs, ...rest };
  Object.entries(allAttrs).forEach(([key, value]) => {
    if (value != null) element.setAttribute(key, value);
  });

  // Handle event forwarding if context has emit method
  if (context?.emit && forwardEvents) {
    Object.entries(forwardEvents).forEach(([nativeEvent, eventConfig]) => {
      const shouldForward = typeof eventConfig === 'function'
        ? eventConfig
        : () => true;

      element.addEventListener(nativeEvent, (event) => {
        if (shouldForward({ ...context, element }, event)) {
          context.emit(nativeEvent, { event });
        }
      });
    });
  }

  // Append to container if provided
  if (container) {
    container.appendChild(element);
  }

  if (typeof onCreate === 'function') {
    onCreate(element, context);
  }

  return element;
};

/**
 * Higher-order function to add attributes to an element
 * @param {Record<string, any>} attrs - Attributes to add
 * @returns {(element: HTMLElement) => HTMLElement} Element transformer
 */
export const withAttributes = (attrs: Record<string, any>) => 
  (element: HTMLElement): HTMLElement => {
    setAttributes(element, attrs);
    return element;
  };

/**
 * Higher-order function to add classes to an element
 * @param {...(string | string[])} classes - Classes to add
 * @returns {(element: HTMLElement) => HTMLElement} Element transformer
 */
export const withClasses = (...classes: (string | string[])[]) => 
  (element: HTMLElement): HTMLElement => {
    const normalizedClasses = normalizeClasses(...classes);
    if (normalizedClasses.length) {
      element.classList.add(...normalizedClasses);
    }
    return element;
  };

/**
 * Higher-order function to add content to an element
 * @param {Node|string} content - Content to add
 * @returns {(element: HTMLElement) => HTMLElement} Element transformer
 */
export const withContent = (content: Node | string) => 
  (element: HTMLElement): HTMLElement => {
    if (content instanceof Node) {
      element.appendChild(content);
    } else {
      element.textContent = content;
    }
    return element;
  };