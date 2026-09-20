// src/components/button/features/progress.ts
import type { ProgressConfig, ProgressComponent } from "../../progress/types";
import { addClass, removeClass } from "../../../core/dom";
import { ButtonConfig, IconAPI } from "../types";

/**
 * Component with progress capabilities
 */
interface ProgressEnhancedComponent {
  element: HTMLElement;
  icon?: IconAPI;
  getClass: (name: string) => string;
  progress?: ProgressComponent;
  disabled?: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle?: {
    destroy: () => void;
  };
  setText?: (text: string) => unknown;
  getText?: () => string;
  /** The label manager withText installs; the setText/getText above only exist after withAPI. */
  text?: {
    setText: (text: string) => unknown;
    getText: () => string;
  };
  showProgress?: () => Promise<ProgressEnhancedComponent>;
  showProgressSync?: () => ProgressEnhancedComponent;
  hideProgress?: () => Promise<ProgressEnhancedComponent>;
  hideProgressSync?: () => ProgressEnhancedComponent;
  setProgress?: (value: number) => Promise<ProgressEnhancedComponent>;
  setProgressSync?: (value: number) => ProgressEnhancedComponent;
  setIndeterminate?: (
    indeterminate: boolean
  ) => Promise<ProgressEnhancedComponent>;
  setIndeterminateSync?: (indeterminate: boolean) => ProgressEnhancedComponent;
  setLoading?: (
    loading: boolean,
    text?: string
  ) => Promise<ProgressEnhancedComponent>;
  setLoadingSync?: (
    loading: boolean,
    text?: string
  ) => ProgressEnhancedComponent;
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
  <C extends ProgressEnhancedComponent>(component: C): C => {
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
            // Event handlers may ride along with the progress config
            const { on, ...restConfig } = config.progress as ProgressConfig & {
              on?: Record<string, Function>;
            };
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
            p.on(event, handler);
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

    // Add progress methods that lazy-load the progress component. Each is held
    // in a local first: the interface marks them optional because they only
    // exist once this feature has run, and the wrappers below call the local,
    // which is always there.
    const showProgress = async (): Promise<C> => {
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
    component.showProgress = showProgress;

    // Synchronous wrapper for convenience
    component.showProgressSync = (): C => {
      void showProgress();
      return component;
    };

    const hideProgress = async (): Promise<C> => {
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
    component.hideProgress = hideProgress;

    // Synchronous wrapper
    component.hideProgressSync = (): C => {
      void hideProgress();
      return component;
    };

    const setProgress = async (value: number): Promise<C> => {
      const p = await ensureProgress();
      p.setValue(value);
      return component;
    };
    component.setProgress = setProgress;

    // Synchronous wrapper
    component.setProgressSync = (value: number): C => {
      void setProgress(value);
      return component;
    };

    const setIndeterminate = async (indeterminate: boolean): Promise<C> => {
      const p = await ensureProgress();
      p.setIndeterminate(indeterminate);
      return component;
    };
    component.setIndeterminate = setIndeterminate;

    // Synchronous wrapper
    component.setIndeterminateSync = (indeterminate: boolean): C => {
      void setIndeterminate(indeterminate);
      return component;
    };

    // This feature runs before withAPI, so the component it sees carries the
    // label as the `text` manager from withText, not the setText/getText the API
    // adds later on a separate object. Reading only those left every label swap
    // below unreachable: setLoading(true, "Saving") kept the old label and never
    // restored it. Prefer the manager; fall back for components built otherwise.
    const readLabel = (): string | undefined =>
      component.text ? component.text.getText() : component.getText?.();
    const writeLabel = (value: string): void => {
      if (component.text) component.text.setText(value);
      else component.setText?.(value);
    };

    const setLoading = async (loading: boolean, text?: string): Promise<C> => {
      if (loading && !isLoading) {
        originalText = readLabel() ?? "";
        isLoading = true;
        // Tell assistive technology the button is working, not merely disabled
        component.element.setAttribute("aria-busy", "true");
        await showProgress();
        // Call disable on the internal disabled manager
        if (component.disabled?.disable) {
          component.disabled.disable();
        }
        if (text) writeLabel(text);
      } else if (!loading && isLoading) {
        isLoading = false;
        component.element.removeAttribute("aria-busy");
        await hideProgress();
        // Call enable on the internal disabled manager
        if (component.disabled?.enable) {
          component.disabled.enable();
        }
        if (text) writeLabel(text);
        else if (originalText) writeLabel(originalText);
      }
      return component;
    };
    component.setLoading = setLoading;

    // Synchronous wrapper - most commonly used
    component.setLoadingSync = (loading: boolean, text?: string): C => {
      void setLoading(loading, text);
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
      void ensureProgress().then(() => showProgress());
    }

    return component;
  };
