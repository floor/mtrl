// src/core/compose/component.ts
/**
 * @module core/compose/component
 * @description Core utilities for component composition and creation with built-in mobile support
 */

import { createElement, CreateElementOptions, removeEventHandlers } from '../dom/create';
import {
  normalizeEvent,
  hasTouchSupport,
  TOUCH_CONFIG,
  PASSIVE_EVENTS
} from '../utils/mobile';

/**
 * Touch state interface to track touch interactions
 */
export interface TouchState {
  startTime: number;
  startPosition: { x: number; y: number };
  isTouching: boolean;
  activeTarget: EventTarget | null;
}

/**
 * Base component interface with prefix utilities
 */
export interface BaseComponent {
  config: Record<string, any>;
  componentName?: string;
  getClass: (name: string) => string;
  getModifierClass: (base: string, modifier: string) => string;
  getElementClass: (base: string, element: string) => string;
  touchState: TouchState;
  updateTouchState: (event: Event, status: 'start' | 'end') => void;
}

/**
 * Element component extends base with element
 */
export interface ElementComponent extends BaseComponent {
  element: HTMLElement;
  addClass: (...classes: string[]) => ElementComponent;
  destroy: () => void;
}

/**
 * Options for withElement enhancer
 */
export interface WithElementOptions {
  tag?: string;
  componentName?: string;
  attributes?: Record<string, any>;
  className?: string | string[];
  forwardEvents?: Record<string, boolean | ((component: any, event: Event) => boolean)>;
  interactive?: boolean;
  container?: HTMLElement;
}

/**
 * Creates helper functions for managing CSS class names with a prefix
 * @param {string} prefix - Prefix to apply to class names
 * @returns {Object} Class name utilities
 */
const withPrefix = (prefix: string) => ({
  /**
   * Gets a prefixed class name
   * @param {string} name - Base class name
   * @returns {string} Prefixed class name
   */
  getClass: (name: string): string => `${prefix}-${name}`,
  
  /**
   * Gets a prefixed modifier class name
   * @param {string} base - Base class name
   * @param {string} modifier - Modifier name
   * @returns {string} Prefixed modifier class
   */
  getModifierClass: (base: string, modifier: string): string => `${base}--${modifier}`,
  
  /**
   * Gets a prefixed element class name
   * @param {string} base - Base class name
   * @param {string} element - Element name
   * @returns {string} Prefixed element class
   */
  getElementClass: (base: string, element: string): string => `${base}-${element}`
});

/**
 * Creates a base component with configuration and prefix utilities.
 * This forms the foundation for all components in the system.
 *
 * @param {Object} config - Component configuration
 * @returns {BaseComponent} Base component with prefix utilities
 */
export const createBase = (config: Record<string, any> = {}): BaseComponent => ({
  config,
  componentName: config.componentName,
  ...withPrefix(config.prefix || 'mtrl'),

  /**
   * Manages the touch interaction state for the component.
   */
  touchState: {
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    isTouching: false,
    activeTarget: null
  },

  /**
   * Updates the component's touch state based on user interactions.
   * Tracks touch position and timing for gesture recognition.
   */
  updateTouchState(event: Event, status: 'start' | 'end'): void {
    // Cast to MouseEvent as a safe fallback when working with general Events
    const normalized = normalizeEvent(event as MouseEvent);

    if (status === 'start') {
      this.touchState = {
        startTime: Date.now(),
        startPosition: {
          x: normalized.clientX,
          y: normalized.clientY
        },
        isTouching: true,
        activeTarget: normalized.target
      };
    } else if (status === 'end') {
      this.touchState.isTouching = false;
      this.touchState.activeTarget = null;
    }
  }
});

/**
 * Higher-order function that adds a DOM element to a component
 * @param {WithElementOptions} options - Element creation options
 * @returns {Function} Component enhancer
 */
export const withElement = (options: WithElementOptions = {}) => 
  <T extends BaseComponent>(component: T): T & ElementComponent => {
    /**
     * Handles the start of a touch interaction.
     */
    const handleTouchStart = (event: Event): void => {
      base.updateTouchState(event, 'start');
      element.classList.add(`${base.getClass('touch-active')}`);

      if (options.forwardEvents?.touchstart && 'emit' in component) {
        (component as any).emit('touchstart', normalizeEvent(event));
      }
    };

    /**
     * Handles the end of a touch interaction.
     */
    const handleTouchEnd = (event: Event): void => {
      if (!base.touchState.isTouching) return;

      const touchDuration = Date.now() - base.touchState.startTime;
      element.classList.remove(`${base.getClass('touch-active')}`);
      base.updateTouchState(event, 'end');

      // Emit tap event for short touches
      if (touchDuration < TOUCH_CONFIG.TAP_THRESHOLD && 'emit' in component) {
        (component as any).emit('tap', normalizeEvent(event));
      }

      if (options.forwardEvents?.touchend && 'emit' in component) {
        (component as any).emit('touchend', normalizeEvent(event));
      }
    };

    /**
     * Handles touch movement.
     */
    const handleTouchMove = (event: Event): void => {
      if (!base.touchState.isTouching) return;

      const normalized = normalizeEvent(event);
      const deltaX = normalized.clientX - base.touchState.startPosition.x;
      const deltaY = normalized.clientY - base.touchState.startPosition.y;

      // Detect and emit swipe gestures
      if (Math.abs(deltaX) > TOUCH_CONFIG.SWIPE_THRESHOLD && 'emit' in component) {
        (component as any).emit('swipe', {
          direction: deltaX > 0 ? 'right' : 'left',
          deltaX,
          deltaY
        });
      }

      if (options.forwardEvents?.touchmove && 'emit' in component) {
        (component as any).emit('touchmove', { ...normalized, deltaX, deltaY });
      }
    };

    // Get the base component for reference
    const base = component;

    // Check for parent/container in component config
    let container = component.config.parent || component.config.container || options.container;
    
    // Handle string selectors
    if (typeof container === 'string') {
      container = document.querySelector(container) as HTMLElement | null;
    }

    // Create element options from component options
    const elementOptions: CreateElementOptions = {
      tag: options.tag || 'div',
      className: [
        base.getClass(options.componentName || base.componentName || 'component'),
        hasTouchSupport() && options.interactive ? base.getClass('interactive') : null,
        ...(Array.isArray(options.className) ? options.className : [options.className])
      ].filter(Boolean),
      attributes: options.attributes || {},
      forwardEvents: options.forwardEvents || {},
      context: component, // Pass component as context for events
      container: container // Pass the container option to createElement
    };

    // Create the element with appropriate classes
    const element = createElement(elementOptions);

    // Add event listeners only if touch is supported and the component is interactive
    if (hasTouchSupport() && options.interactive) {
      element.addEventListener('touchstart', handleTouchStart, PASSIVE_EVENTS);
      element.addEventListener('touchend', handleTouchEnd);
      element.addEventListener('touchmove', handleTouchMove, PASSIVE_EVENTS);
    }

    return {
      ...component,
      element,

      /**
       * Adds CSS classes to the element
       * @param {...string} classes - CSS classes to add
       * @returns {ElementComponent} Component instance for chaining
       */
      addClass(...classes: string[]): ElementComponent {
        element.classList.add(...classes.filter(Boolean));
        return this;
      },

      /**
       * Removes the element and cleans up event listeners.
       * Ensures proper resource cleanup when the component is destroyed.
       */
      destroy(): void {
        if (hasTouchSupport() && options.interactive) {
          element.removeEventListener('touchstart', handleTouchStart);
          element.removeEventListener('touchend', handleTouchEnd);
          element.removeEventListener('touchmove', handleTouchMove);
        }
        
        // Clean up any registered event handlers using our new utility
        removeEventHandlers(element);
        
        element.remove();
      }
    };
  };