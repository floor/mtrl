// src/core/build/ripple.ts
import { RIPPLE_CONFIG, RIPPLE_TIMING } from './constants';
import { PREFIX } from '../config';

// ... existing interfaces ...

export const createRipple = (config: RippleConfig = {}): RippleController => {
  const options = {
    ...RIPPLE_CONFIG,
    ...config,
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

  // Track active ripples for proper cleanup
  const activeRipples = new WeakMap<HTMLElement, Set<HTMLElement>>();

  const createRippleElement = (): HTMLDivElement => {
    const ripple = document.createElement('div');
    ripple.className = `${PREFIX}-ripple-wave`;
    // No inline transition style - let CSS handle it
    return ripple;
  };

  let documentListeners: DocumentListener[] = [];

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
    if (!container || !container.__rippleContainer) return;

    const rippleContainer = container.__rippleContainer;
    const bounds = container.getBoundingClientRect();
    const ripple = createRippleElement();

    // Calculate ripple size - should be larger than the container
    // Use the maximum dimension of the container multiplied by 2
    const size = Math.max(bounds.width, bounds.height) * 2;
    
    // Calculate position to center the ripple on the click point
    const x = event.clientX - bounds.left - (size / 2);
    const y = event.clientY - bounds.top - (size / 2);

    // Set explicit size and position
    Object.assign(ripple.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`
    });

    // Append to container
    rippleContainer.appendChild(ripple);

    // Force reflow
    ripple.offsetHeight;

    // Add active class to trigger animation
    requestAnimationFrame(() => {
      ripple.classList.add('active');
    });

    const cleanup = () => {
      // Remove document listeners
      removeDocumentListener('mouseup', cleanup);
      removeDocumentListener('mouseleave', cleanup);

      // Remove active class and add fade-out class
      ripple.classList.remove('active');
      ripple.classList.add('fade-out');
      
      // Remove after animation
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
        // Remove from tracking
        activeRipples.get(container)?.delete(ripple);
      }, options.duration);
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
      
      // Create ripple container if it doesn't exist
      let rippleContainer = element.querySelector(`.${PREFIX}-ripple`);
      if (!rippleContainer) {
        rippleContainer = document.createElement('div');
        rippleContainer.className = `${PREFIX}-ripple`;
        element.appendChild(rippleContainer);
      }

      // Store reference to container
      element.__rippleContainer = rippleContainer as HTMLElement;
      
      // Initialize ripple tracking
      activeRipples.set(element, new Set());
      
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

      // Remove all active ripples immediately
      if (activeRipples.has(element)) {
        const ripples = activeRipples.get(element);
        if (ripples) {
          ripples.forEach(ripple => {
            if (ripple.parentNode) {
              ripple.parentNode.removeChild(ripple);
            }
          });
        }
        activeRipples.delete(element);
      }

      // Remove ripple container
      if (element.__rippleContainer && element.__rippleContainer.parentNode) {
        element.__rippleContainer.parentNode.removeChild(element.__rippleContainer);
        delete element.__rippleContainer;
      }
    }
  };
};

// Extend the HTMLElement interface
declare global {
  interface HTMLElement {
    __rippleHandlers?: Array<(e: MouseEvent) => void>;
    __rippleContainer?: HTMLElement;
  }
}