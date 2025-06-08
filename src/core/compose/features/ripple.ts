// src/core/compose/features/ripple.ts

import { BaseComponent, ElementComponent } from "../component";
import { LifecycleComponent } from "./lifecycle";
import { RIPPLE_CONFIG } from "./constants";
import { PREFIX } from "../../config";

/**
 * Ripple configuration interface
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
   * Opacity values for start and end [start, end]
   */
  opacity?: [string, string];
}

/**
 * Document listener for cleanup tracking
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
   * Mounts ripple effect to an element
   * @param element - Target element
   */
  mount: (element: HTMLElement) => void;

  /**
   * Unmounts ripple effect from an element
   * @param element - Target element
   */
  unmount: (element: HTMLElement) => void;
}

/**
 * Configuration for ripple feature
 */
export interface RippleFeatureConfig {
  ripple?: boolean;
  rippleConfig?: RippleConfig;
  [key: string]: any;
}

/**
 * Component with ripple capabilities
 */
export interface RippleComponent extends BaseComponent {
  ripple: RippleController;
}

/**
 * Creates a ripple controller for managing ripple effects
 * @param config - Ripple configuration
 * @returns Ripple controller
 */
const createRipple = (config: RippleConfig = {}): RippleController => {
  const options = {
    ...RIPPLE_CONFIG,
    ...config,
    opacity: config.opacity || RIPPLE_CONFIG.opacity,
  };

  // Track active ripples for proper cleanup
  const activeRipples = new WeakMap<HTMLElement, Set<HTMLElement>>();
  // Track document listeners
  let documentListeners: DocumentListener[] = [];

  const createRippleElement = (): HTMLDivElement => {
    const ripple = document.createElement("div");
    ripple.className = `${PREFIX}-ripple-wave`;
    // No inline transition style - let CSS handle it
    return ripple;
  };

  const addDocumentListener = (event: string, handler: EventListener): void => {
    if (typeof document.addEventListener === "function") {
      document.addEventListener(event, handler);
      documentListeners.push({ event, handler });
    }
  };

  const removeDocumentListener = (
    event: string,
    handler: EventListener
  ): void => {
    if (typeof document.removeEventListener === "function") {
      document.removeEventListener(event, handler);
      documentListeners = documentListeners.filter(
        (listener) =>
          !(listener.event === event && listener.handler === handler)
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
    const x = event.clientX - bounds.left - size / 2;
    const y = event.clientY - bounds.top - size / 2;

    // Set explicit size and position
    Object.assign(ripple.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`,
    });

    // Append to container
    rippleContainer.appendChild(ripple);

    // Force reflow
    ripple.offsetHeight;

    // Add active class to trigger animation
    requestAnimationFrame(() => {
      ripple.classList.add("active");
    });

    const cleanup = () => {
      // Remove document listeners
      removeDocumentListener("mouseup", cleanup);
      removeDocumentListener("mouseleave", cleanup);

      // Remove active class and add fade-out class
      ripple.classList.remove("active");
      ripple.classList.add("fade-out");

      // Remove after animation
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
        // Remove from tracking
        activeRipples.get(container)?.delete(ripple);
      }, options.duration);
    };

    addDocumentListener("mouseup", cleanup);
    addDocumentListener("mouseleave", cleanup);
  };

  return {
    mount: (element: HTMLElement): void => {
      if (!element) return;

      // Ensure proper positioning context
      const currentPosition = window.getComputedStyle(element).position;
      if (currentPosition === "static") {
        element.style.position = "relative";
      }

      // Create ripple container if it doesn't exist
      let rippleContainer = element.querySelector(`.${PREFIX}-ripple`);
      if (!rippleContainer) {
        rippleContainer = document.createElement("div");
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

      element.addEventListener("mousedown", mousedownHandler);
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
        element.__rippleHandlers.forEach((handler) => {
          element.removeEventListener("mousedown", handler);
        });
        element.__rippleHandlers = [];
      }

      // Remove all active ripples immediately
      if (activeRipples.has(element)) {
        const ripples = activeRipples.get(element);
        if (ripples) {
          ripples.forEach((ripple) => {
            if (ripple.parentNode) {
              ripple.parentNode.removeChild(ripple);
            }
          });
        }
        activeRipples.delete(element);
      }

      // Remove ripple container
      if (element.__rippleContainer && element.__rippleContainer.parentNode) {
        element.__rippleContainer.parentNode.removeChild(
          element.__rippleContainer
        );
        delete element.__rippleContainer;
      }
    },
  };
};

// Extend the HTMLElement interface
declare global {
  interface HTMLElement {
    __rippleHandlers?: Array<(e: MouseEvent) => void>;
    __rippleContainer?: HTMLElement;
  }
}

/**
 * Adds ripple effect functionality to a component
 *
 * @param config - Configuration object
 * @returns Function that enhances a component with ripple effect
 */
export const withRipple =
  <T extends RippleFeatureConfig>(config: T) =>
  <C extends ElementComponent & Partial<LifecycleComponent>>(
    component: C
  ): C & RippleComponent => {
    if (!config.ripple) return component as C & RippleComponent;

    const rippleInstance = createRipple(config.rippleConfig);

    // Immediately mount ripple to ensure it's available right away
    rippleInstance.mount(component.element);

    // If component has lifecycle methods, integrate ripple with them
    if (component.lifecycle) {
      const originalMount = component.lifecycle.mount;
      const originalDestroy = component.lifecycle.destroy;

      component.lifecycle.mount = () => {
        originalMount.call(component.lifecycle);
        // We don't need to mount again here since we already did it above
      };

      component.lifecycle.destroy = () => {
        rippleInstance.unmount(component.element);
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      ripple: rippleInstance,
    };
  };
