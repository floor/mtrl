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
 * Event handler storage to facilitate cleanup
 */
export interface EventHandlerStorage {
  [eventName: string]: EventListener;
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
    if (value != null) element.setAttribute(key, String(value));
  });

  // Initialize event handler storage if not present
  if (!element.__eventHandlers) {
    element.__eventHandlers = {};
  }

  // Handle event forwarding if context has emit method or is a component with on method
  if (forwardEvents && (context?.emit || context?.on)) {
    Object.entries(forwardEvents).forEach(([nativeEvent, eventConfig]) => {
      // Create a wrapper handler function to evaluate condition and forward event
      const handler = (event: Event) => {
        // Determine if the event should be forwarded
        let shouldForward = true;
        
        if (typeof eventConfig === 'function') {
          try {
            // If it's a function, call with component context and event
            shouldForward = eventConfig({ ...context, element }, event);
          } catch (error) {
            console.warn(`Error in event condition for ${nativeEvent}:`, error);
            shouldForward = false;
          }
        } else {
          // If it's a boolean, use directly
          shouldForward = Boolean(eventConfig);
        }
        
        // Forward the event if condition passes
        if (shouldForward) {
          if (context.emit) {
            context.emit(nativeEvent, { event, element, originalEvent: event });
          } else if (context.on) {
            // This is a component with on method but no emit method
            // Dispatch a custom event that can be listened to
            const customEvent = new CustomEvent(nativeEvent, {
              detail: { event, element, originalEvent: event },
              bubbles: true,
              cancelable: true
            });
            element.dispatchEvent(customEvent);
          }
        }
      };
      
      // Store the handler for future removal
      element.__eventHandlers[nativeEvent] = handler;
      
      // Add the actual event listener
      element.addEventListener(nativeEvent, handler);
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
 * Removes event handlers from an element
 * @param element - Element to cleanup
 */
export const removeEventHandlers = (element: HTMLElement): void => {
  if (element.__eventHandlers) {
    Object.entries(element.__eventHandlers).forEach(([eventName, handler]) => {
      element.removeEventListener(eventName, handler);
    });
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

// Extend HTMLElement interface to add eventHandlers property
declare global {
  interface HTMLElement {
    __eventHandlers?: EventHandlerStorage;
  }
}