// src/core/build/ripple.ts

import { RIPPLE_CONFIG, RIPPLE_TIMING } from './constants';

/**
 * Ripple animation configuration
 */
export interface RippleConfig {
  /**
   * Animation duration in milliseconds
   */
  duration?: number;
  
  /**
   * Animation timing function
   */
  timing?: string;
  
  /**
   * Opacity start and end values
   */
  opacity?: [string, string];
}

/**
 * End coordinates for ripple animation
 */
interface EndCoordinates {
  size: string;
  top: string;
  left: string;
}

/**
 * Document event listener
 */
interface DocumentListener {
  event: string;
  handler: EventListener;
}

/**
 * Ripple controller interface
 */
export interface RippleController {
  /**
   * Attaches ripple effect to an element
   * @param element - Target element
   */
  mount: (element: HTMLElement) => void;
  
  /**
   * Removes ripple effect from an element
   * @param element - Target element
   */
  unmount: (element: HTMLElement) => void;
}

/**
 * Creates a ripple effect instance
 * 
 * @param config - Ripple configuration
 * @returns Ripple controller instance
 */
export const createRipple = (config: RippleConfig = {}): RippleController => {
  // Make sure we fully merge the config options
  const options = {
    ...RIPPLE_CONFIG,
    ...config,
    // Handle nested objects like opacity array
    opacity: config.opacity || RIPPLE_CONFIG.opacity
  };

  const getEndCoordinates = (bounds: DOMRect): EndCoordinates => {
    const size = Math.max(bounds.width, bounds.height);
    const top = bounds.height > bounds.width
      ? -bounds.height / 2
      : -(bounds.width - bounds.height / 2);

    return {
      size: `${size * 2}px`,
      top: `${top}px`,
      left: `${size / -2}px`
    };
  };

  const createRippleElement = (): HTMLDivElement => {
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    // Initial styles already set in CSS
    ripple.style.transition = `all ${options.duration}ms ${options.timing}`;
    return ripple;
  };

  // Store document event listeners for cleanup
  let documentListeners: DocumentListener[] = [];

  // Safe document event handling
  const addDocumentListener = (event: string, handler: EventListener): void => {
    if (typeof document.addEventListener === 'function') {
      document.addEventListener(event, handler);
      documentListeners.push({ event, handler });
    }
  };

  const removeDocumentListener = (event: string, handler: EventListener): void => {
    if (typeof document.removeEventListener === 'function') {
      document.removeEventListener(event, handler);
      documentListeners = documentListeners.filter(
        listener => !(listener.event === event && listener.handler === handler)
      );
    }
  };

  const animate = (event: MouseEvent, container: HTMLElement): void => {
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    const ripple = createRippleElement();

    // Set initial position and state
    Object.assign(ripple.style, {
      left: `${event.offsetX || bounds.width / 2}px`,
      top: `${event.offsetY || bounds.height / 2}px`,
      transform: 'scale(0)',
      opacity: options.opacity[0]
    });

    container.appendChild(ripple);

    // Force reflow
    // eslint-disable-next-line no-unused-expressions
    ripple.offsetHeight;

    // Animate to end position
    const end = getEndCoordinates(bounds);
    Object.assign(ripple.style, {
      ...end,
      transform: 'scale(1)',
      opacity: options.opacity[1]
    });

    const cleanup = () => {
      ripple.style.opacity = '0';

      // Use setTimeout to remove element after animation
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, options.duration);

      removeDocumentListener('mouseup', cleanup);
      removeDocumentListener('mouseleave', cleanup);
    };

    addDocumentListener('mouseup', cleanup);
    addDocumentListener('mouseleave', cleanup);
  };

  return {
    mount: (element: HTMLElement): void => {
      if (!element) return;

      // Ensure proper positioning context
      const currentPosition = window.getComputedStyle(element).position;
      if (currentPosition === 'static') {
        element.style.position = 'relative';
      }
      element.style.overflow = 'hidden';

      // Store the mousedown handler to be able to remove it later
      const mousedownHandler = (e: MouseEvent) => animate(e, element);

      // Store handler reference on the element
      if (!element.__rippleHandlers) {
        element.__rippleHandlers = [];
      }
      element.__rippleHandlers.push(mousedownHandler);

      element.addEventListener('mousedown', mousedownHandler);
    },

    unmount: (element: HTMLElement): void => {
      if (!element) return;

      // Clear document event listeners
      documentListeners.forEach(({ event, handler }) => {
        removeDocumentListener(event, handler);
      });
      documentListeners = [];

      // Remove event listeners
      if (element.__rippleHandlers) {
        element.__rippleHandlers.forEach(handler => {
          element.removeEventListener('mousedown', handler);
        });
        element.__rippleHandlers = [];
      }

      // Remove all ripple elements
      const ripples = element.querySelectorAll('.ripple');
      ripples.forEach(ripple => {
        // Call remove directly to match the test expectation
        ripple.remove();
      });
    }
  };
};

// Extend the HTMLElement interface to add rippleHandlers property
declare global {
  interface HTMLElement {
    __rippleHandlers?: Array<(e: MouseEvent) => void>;
  }
}