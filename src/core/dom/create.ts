// src/core/dom/create.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

import { setAttributes } from './attributes';
import { normalizeClasses } from '../utils';
import { PREFIX } from '../config';

/**
 * Event handler function type
 */
export type EventHandler = (event: Event) => void;

/**
 * Event condition type - either a boolean or a function that returns a boolean
 */
export type EventCondition = boolean | ((context: any, event: Event) => boolean);

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
   * Element ariaLabel
   */
  ariaLabel?: string;
  
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
  forwardEvents?: Record<string, EventCondition>;
  
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
 * Event handler storage to facilitate cleanup
 */
export interface EventHandlerStorage {
  [eventName: string]: EventHandler;
}

// Constant for prefix with dash
const PREFIX_WITH_DASH = `${PREFIX}-`;

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

  // Apply basic properties
  if (html) element.innerHTML = html;
  if (text) element.textContent = text;
  if (id) element.id = id;

  // Handle classes
  if (className) {
    const classes = normalizeClasses(className);
    if (classes.length) {
      // Apply prefix to classes in a single operation
      element.classList.add(...classes.map(cls => 
        cls && !cls.startsWith(PREFIX_WITH_DASH) ? PREFIX_WITH_DASH + cls : cls
      ).filter(Boolean));
    }
  }

  // Handle data attributes directly
  for (const key in data) {
    element.dataset[key] = data[key];
  }

  // Handle regular attributes
  const allAttrs = { ...attrs, ...rest };
  for (const key in allAttrs) {
    const value = allAttrs[key];
    if (value != null) element.setAttribute(key, String(value));
  }

  // Handle event forwarding
  if (forwardEvents && (context?.emit || context?.on)) {
    element.__eventHandlers = {};
    
    for (const nativeEvent in forwardEvents) {
      const eventConfig = forwardEvents[nativeEvent];
      
      const handler = (event: Event) => {
        let shouldForward = true;
        
        if (typeof eventConfig === 'function') {
          try {
            // Create a lightweight context clone
            const ctxWithElement = { ...context, element };
            shouldForward = eventConfig(ctxWithElement, event);
          } catch (error) {
            console.warn(`Error in event condition for ${nativeEvent}:`, error);
            shouldForward = false;
          }
        } else {
          shouldForward = Boolean(eventConfig);
        }
        
        if (shouldForward) {
          if (context.emit) {
            context.emit(nativeEvent, { event, element, originalEvent: event });
          } else if (context.on) {
            element.dispatchEvent(new CustomEvent(nativeEvent, {
              detail: { event, element, originalEvent: event },
              bubbles: true,
              cancelable: true
            }));
          }
        }
      };
      
      element.__eventHandlers[nativeEvent] = handler;
      element.addEventListener(nativeEvent, handler);
    }
  }

  // Append to container if provided
  if (container) container.appendChild(element);
  if (onCreate) onCreate(element, context);

  return element;
};

/**
 * Removes event handlers from an element
 * @param element - Element to cleanup
 */
export const removeEventHandlers = (element: HTMLElement): void => {
  const handlers = element.__eventHandlers;
  if (handlers) {
    for (const event in handlers) {
      element.removeEventListener(event, handlers[event]);
    }
    delete element.__eventHandlers;
  }
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
      element.classList.add(...normalizedClasses.map(cls => 
        cls && !cls.startsWith(PREFIX_WITH_DASH) ? PREFIX_WITH_DASH + cls : cls
      ).filter(Boolean));
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
    if (content instanceof Node) element.appendChild(content);
    else element.textContent = content;
    return element;
  };

// Extend HTMLElement interface to add eventHandlers property
declare global {
  interface HTMLElement {
    /**
     * Storage for event handlers to enable cleanup
     */
    __eventHandlers?: EventHandlerStorage;
  }
}