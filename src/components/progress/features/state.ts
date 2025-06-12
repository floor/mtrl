// src/components/progress/features/state.ts - Canvas-compatible state management

import { ProgressConfig, ProgressShape } from "../types";
import { PROGRESS_CLASSES, PROGRESS_SHAPES } from "../constants";
import { addClass } from "../../../core/dom";

/**
 * Progress component state
 */
interface ProgressState {
  value: number;
  max: number;
  buffer: number;
  indeterminate: boolean;
  thickness: number | string; // Allow both number and string for thickness
  shape: ProgressShape;
  labelFormatter: (value: number, max: number) => string;
  label?: HTMLElement;
  showLabel?: boolean;
}

/**
 * Component with lifecycle methods and canvas drawing
 */
interface ComponentWithLifecycle {
  element: HTMLElement;
  canvas?: HTMLCanvasElement;
  draw?: () => void;
  lifecycle?: {
    init?: () => void;
    destroy?: () => void;
  };
  getClass?: (name: string) => string;
  // API methods that may be available after full composition
  setIndeterminate?: (indeterminate: boolean) => unknown;
  setValue?: (value: number) => unknown;
  setBuffer?: (buffer: number) => unknown;
  setShape?: (shape: ProgressShape) => unknown;
  showLabel?: () => unknown;
  setThickness?: (thickness: number | string) => unknown;
  state?: ProgressState;
  [key: string]: any;
}

/**
 * Adds state management for canvas-based progress component
 *
 * @param config Progress configuration
 * @returns Component enhancer with state management
 */
export const withState =
  (config: ProgressConfig) =>
  (
    component: ComponentWithLifecycle
  ): ComponentWithLifecycle & { state: ProgressState } => {
    // Apply indeterminate class immediately if needed
    if (config.indeterminate && component.element) {
      addClass(component.element, PROGRESS_CLASSES.INDETERMINATE);
      component.element.removeAttribute("aria-valuenow");
    }

    // Remove any existing thickness classes - we'll handle thickness via canvas
    if (component.element) {
      const containerClass =
        component.getClass?.(PROGRESS_CLASSES.CONTAINER) || "";
      component.element.classList.remove(
        `${containerClass}--thin`,
        `${containerClass}--thick`
      );
    }

    // Apply shape class immediately if needed (linear only)
    if (
      config.shape &&
      config.shape !== PROGRESS_SHAPES.FLAT &&
      component.element
    ) {
      const isCircular = component.element.classList.contains(
        component.getClass?.(PROGRESS_CLASSES.CIRCULAR) || ""
      );
      if (!isCircular) {
        const containerClass =
          component.getClass?.(PROGRESS_CLASSES.CONTAINER) || "";
        addClass(component.element, `${containerClass}--${config.shape}`);
      }
    }

    // Initialize state values
    const state: ProgressState = {
      value: config.value ?? 0,
      max: config.max ?? 100,
      buffer: config.buffer ?? 0,
      indeterminate: config.indeterminate === true,
      // Store thickness as is (string or number) to maintain the original value
      thickness: config.thickness ?? "thin",
      shape: config.shape ?? PROGRESS_SHAPES.FLAT,
      labelFormatter:
        config.labelFormatter ??
        ((v: number, m: number): string => `${Math.round((v / m) * 100)}%`),
      showLabel: config.showLabel,
    };

    // Store original lifecycle hooks if they exist
    const originalInit = component.lifecycle?.init;
    const originalDestroy = component.lifecycle?.destroy;

    // Add state to component
    component.state = state;

    // Add lifecycle hooks
    component.lifecycle = {
      init: () => {
        // Schedule API initialization for next frame
        // This ensures all features and API methods are properly attached
        requestAnimationFrame(() => {
          try {
            // Initialize API state based on configuration
            if (state.indeterminate) {
              component.setIndeterminate?.(true);
            } else {
              component.setValue?.(state.value);
              if (config.buffer !== undefined) {
                component.setBuffer?.(state.buffer);
              }
            }

            // Set initial shape if configured (and not default)
            if (state.shape !== PROGRESS_SHAPES.FLAT && component.setShape) {
              component.setShape(state.shape);
            }

            // Initialize thickness
            if (state.thickness) {
              // If API is available, use it to set thickness
              if (component.setThickness) {
                component.setThickness(state.thickness);
              } else {
                // Otherwise, just store it in state and let canvas handle it
                component.state.thickness = state.thickness;
              }
            }
          } catch (error) {
            console.error("Error initializing progress state:", error);
          }
        });

        if (originalInit) originalInit();
      },
      destroy: () => {
        if (originalDestroy) originalDestroy();
      },
    };

    return {
      ...component,
      state,
    };
  };
