// src/core/compose/features/ripple.ts

import { BaseComponent, ElementComponent } from "../component";
import { LifecycleComponent } from "./lifecycle";
import { RIPPLE_CONFIG } from "./constants";
import { getCleanup } from "../cleanup";
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
export const createRipple = (config: RippleConfig = {}): RippleController => {
  const options = {
    ...RIPPLE_CONFIG,
    ...config,
    opacity: config.opacity || RIPPLE_CONFIG.opacity,
  };

  const mounts = new WeakMap<HTMLElement, () => void>();

  return {
    mount(element) {
      if (!element || mounts.has(element)) return;
      const doc = element.ownerDocument;
      const view = doc.defaultView;
      if (!view) return;
      if (view.getComputedStyle(element).position === "static") {
        element.style.position = "relative";
      }
      const container = doc.createElement("div");
      container.className = `${PREFIX}-ripple`;
      element.appendChild(container);
      const waves = new Set<() => void>();

      const press = (event: MouseEvent): void => {
        const bounds = element.getBoundingClientRect();
        const size = Math.max(bounds.width, bounds.height) * 2;
        const wave = doc.createElement("div");
        wave.className = `${PREFIX}-ripple-wave active`;
        Object.assign(wave.style, {
          width: `${size}px`, height: `${size}px`,
          left: `${event.clientX - bounds.left - size / 2}px`,
          top: `${event.clientY - bounds.top - size / 2}px`,
        });
        let timer: number | undefined;
        let released = false;
        const removeListeners = (): void => {
          doc.removeEventListener("mouseup", release);
          doc.removeEventListener("mouseleave", release);
        };
        const dispose = (): void => {
          removeListeners();
          if (timer !== undefined) view.clearTimeout(timer);
          wave.remove();
          waves.delete(dispose);
        };
        const release = (): void => {
          if (released) return;
          released = true;
          removeListeners();
          wave.classList.add("fade-out");
          timer = view.setTimeout(dispose, options.duration);
        };
        waves.add(dispose);
        doc.addEventListener("mouseup", release);
        doc.addEventListener("mouseleave", release);
        container.appendChild(wave);
      };
      element.addEventListener("mousedown", press);
      mounts.set(element, () => {
        element.removeEventListener("mousedown", press);
        for (const dispose of waves) dispose();
        container.remove();
      });
    },
    unmount(element) {
      mounts.get(element)?.();
      mounts.delete(element);
    },
  };
};

/**
 * Adds ripple effect functionality to a component
 *
 * @param config - Configuration object
 * @returns Function that enhances a component with ripple effect
 */
export const withRipple =
  // `& object` lets a component config that shares no key with RippleFeatureConfig through.
  <T extends RippleFeatureConfig & object>(config: T) =>
  <C extends ElementComponent & Partial<LifecycleComponent>>(
    component: C
  ): C & RippleComponent => {
    if (!config.ripple) return component as C & RippleComponent;

    const rippleInstance = createRipple(config.rippleConfig);

    // Immediately mount ripple to ensure it's available right away
    rippleInstance.mount(component.element);

    const resources = getCleanup(component);
    resources.add(() => rippleInstance.unmount(component.element));

    return {
      ...component,
      ripple: rippleInstance,
    };
  };
