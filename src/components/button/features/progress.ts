// src/components/button/features/progress.ts
import type { ProgressConfig, ProgressComponent } from "../../progress/types";
import { addClass, removeClass } from "../../../core/dom";
import { ButtonConfig } from "../types";

/**
 * Component with progress capabilities
 */
interface ProgressEnhancedComponent {
  element: HTMLElement;
  icon?: any;
  getClass: (name: string) => string;
  progress?: ProgressComponent;
  disabled?: {
    enable: () => void;
    disable: () => void;
  };
  setText?: (text: string) => any;
  getText?: () => string;
  [key: string]: any;
}

/**
 * Dynamically imports and creates a progress component
 * @param config Progress configuration
 * @returns Promise resolving to the progress component
 */
const createProgressLazy = async (
  config: ProgressConfig
): Promise<ProgressComponent> => {
  // Dynamic import directly from progress.ts to avoid index re-exports
  const { default: createProgress } = await import("../../progress/progress");
  return createProgress(config);
};

/**
 * Adds progress functionality to a button component
 *
 * @param config - Button configuration with progress options
 * @returns Component enhancer function
 */
export const withProgress =
  (config: ButtonConfig) =>
  (component: ProgressEnhancedComponent): ProgressEnhancedComponent => {
    // Skip if no progress config
    if (!config.progress) {
      return component;
    }

    // Extract event handlers if present
    let progressEventHandlers: Record<string, Function> = {};

    // Determine progress configuration
    const progressConfig: ProgressConfig =
      typeof config.progress === "boolean"
        ? { variant: "circular", size: 20, thickness: 2, indeterminate: true }
        : (() => {
            const { on, ...restConfig } = config.progress as any;
            if (on) {
              progressEventHandlers = on;
            }
            return {
              variant: "circular",
              size: 20,
              thickness: 2,
              indeterminate: true,
              ...restConfig,
            };
          })();

    // Progress will be created lazily
    let progress: ProgressComponent | null = null;
    let progressPromise: Promise<ProgressComponent> | null = null;
    let isLoading = false;
    let originalText = "";

    // Helper to ensure progress is loaded
    const ensureProgress = async (): Promise<ProgressComponent> => {
      if (progress) return progress;

      if (!progressPromise) {
        progressPromise = createProgressLazy(progressConfig).then((p) => {
          progress = p;

          // Add button-specific class to the progress element
          addClass(progress.element, component.getClass("button-progress"));

          // Initially hide progress
          progress.element.style.display = "none";

          // Attach event handlers if any were provided
          Object.entries(progressEventHandlers).forEach(([event, handler]) => {
            progress!.on(event, handler);
          });

          // Store progress reference
          component.progress = progress;

          return progress;
        });
      }

      return progressPromise;
    };

    // Helper to get insertion point for progress
    const getProgressInsertionPoint = () => {
      // Try to insert after icon if it exists
      const iconElement = component.element.querySelector(
        `.${component.getClass("button-icon")}`
      );
      if (iconElement && iconElement.nextSibling) {
        return iconElement.nextSibling;
      }

      // Otherwise insert at the beginning
      return component.element.firstChild;
    };

    // Add progress methods that lazy-load the progress component
    component.showProgress = async function () {
      const p = await ensureProgress();

      if (p.element) {
        // Ensure progress element is in the DOM
        if (!component.element.contains(p.element)) {
          const insertPoint = getProgressInsertionPoint();
          if (insertPoint) {
            component.element.insertBefore(p.element, insertPoint);
          } else {
            component.element.appendChild(p.element);
          }
        }

        p.element.style.display = "";
        addClass(
          component.element,
          `${component.getClass("button")}--progress`
        );

        // Hide the icon if it exists
        const iconElement = component.element.querySelector(
          `.${component.getClass("button-icon")}`
        );
        if (iconElement instanceof HTMLElement) {
          iconElement.style.display = "none";
        }
      }
      return component;
    };

    // Synchronous wrapper for convenience
    component.showProgressSync = function () {
      component.showProgress();
      return component;
    };

    component.hideProgress = async function () {
      // If progress hasn't been created yet, just return
      if (!progress) return component;

      progress.element.style.display = "none";
      removeClass(
        component.element,
        `${component.getClass("button")}--progress`
      );

      // Show the icon again if it exists
      const iconElement = component.element.querySelector(
        `.${component.getClass("button-icon")}`
      );
      if (iconElement instanceof HTMLElement) {
        iconElement.style.display = "";
      }

      return component;
    };

    // Synchronous wrapper
    component.hideProgressSync = function () {
      component.hideProgress();
      return component;
    };

    component.setProgress = async function (value: number) {
      const p = await ensureProgress();
      p.setValue(value);
      return component;
    };

    // Synchronous wrapper
    component.setProgressSync = function (value: number) {
      component.setProgress(value);
      return component;
    };

    component.setIndeterminate = async function (indeterminate: boolean) {
      const p = await ensureProgress();
      p.setIndeterminate(indeterminate);
      return component;
    };

    // Synchronous wrapper
    component.setIndeterminateSync = function (indeterminate: boolean) {
      component.setIndeterminate(indeterminate);
      return component;
    };

    component.setLoading = async function (loading: boolean, text?: string) {
      if (loading && !isLoading) {
        // Store original text if we have setText method
        if (component.setText && component.getText) {
          originalText = component.getText();
        }
        isLoading = true;
        await component.showProgress();
        // Call disable on the internal disabled manager
        if (component.disabled?.disable) {
          component.disabled.disable();
        }
        if (text && component.setText) {
          component.setText(text);
        }
      } else if (!loading && isLoading) {
        isLoading = false;
        await component.hideProgress();
        // Call enable on the internal disabled manager
        if (component.disabled?.enable) {
          component.disabled.enable();
        }
        if (text && component.setText) {
          component.setText(text);
        } else if (originalText && component.setText) {
          component.setText(originalText);
        }
      }
      return component;
    };

    // Synchronous wrapper - most commonly used
    component.setLoadingSync = function (loading: boolean, text?: string) {
      component.setLoading(loading, text);
      return component;
    };

    // Update destroy to clean up progress if it was created
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        if (progress) {
          progress.destroy();
        }
        if (progress && progress.element.parentNode) {
          progress.element.parentNode.removeChild(progress.element);
        }
        originalDestroy();
      };
    }

    // If showProgress is true, initialize immediately
    if (config.showProgress) {
      ensureProgress().then(() => {
        component.showProgress();
      });
    }

    return component;
  };
