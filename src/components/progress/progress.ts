// src/components/progress/progress.ts

import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import {
  withEvents,
  withVariant,
  withDisabled,
  withLifecycle,
} from "../../core/compose/features";
import { withCanvas } from "./features/canvas";
import { withState } from "./features/state";
import { withAPI } from "./api";
import { ProgressConfig, ProgressComponent } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Creates a new Progress component using canvas rendering
 * @param {ProgressConfig} config - Progress configuration object
 * @returns {ProgressComponent} Progress component instance
 *
 * @example
 * ```ts
 * // Create a linear determinate progress bar
 * const progress = createProgress({
 *   variant: 'linear',
 *   value: 42,
 *   showLabel: true
 * });
 *
 * // Create an indeterminate circular progress
 * const loader = createProgress({
 *   variant: 'circular',
 *   indeterminate: true
 * });
 * ```
 */
const createProgress = (config: ProgressConfig = {}): ProgressComponent => {
  // Create base configuration
  const baseConfig = createBaseConfig(config);

  try {
    // Create the component with the pipe pattern using canvas instead of complex DOM
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)), // Simple container element
      withVariant(baseConfig), // Add variant classes
      withDisabled(baseConfig), // Add disabled state
      withState(baseConfig), // Add state management first
      withCanvas(baseConfig), // Add canvas rendering after state
      (comp) => {
        // Add API after both state and canvas
        return withAPI(getApiConfig(comp))(comp);
      },
      withLifecycle()
    )(baseConfig);

    // Initialize the component lifecycle if it has an init method
    if (component.lifecycle?.init) {
      component.lifecycle.init();
    }

    return component;
  } catch (error) {
    console.error("Progress creation error:", error);
    throw new Error(`Failed to create progress: ${(error as Error).message}`);
  }
};

export default createProgress;
