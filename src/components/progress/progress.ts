// src/components/progress/progress.ts

import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withVariant,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withLayout, withDom } from '../../core/composition/features';
import { withAPI } from './api';
import { ProgressConfig, ProgressComponent } from './types';
import { 
  createBaseConfig, 
  getElementConfig, 
  getApiConfig
} from './config';
import { PROGRESS_VARIANTS, PROGRESS_CLASSES } from './constants';
import { withState, withSetup } from './features';

/**
 * Creates a new Progress component
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
    // Create a local state object as a fallback
    const localState = {
      value: baseConfig.value || 0,
      max: baseConfig.max || 100,
      buffer: baseConfig.buffer || 0,
      indeterminate: baseConfig.indeterminate || false,
      labelFormatter: (v: number, m: number) => `${Math.round((v / m) * 100)}%`,
      label: undefined as HTMLElement | undefined
    };
    
    // Create the component with the pipe pattern
    const component = pipe(
      createBase,
      withEvents(),
      withLayout(baseConfig),
      withDom(),
      withVariant(baseConfig),
      withDisabled(baseConfig),
      withState(baseConfig),
      // Add API
      comp => {
        // Use the component's state or fall back to local state
        const stateObj = comp.state || localState;
        return withAPI(getApiConfig(comp, stateObj))(comp);
      },
      withSetup(baseConfig),
      withLifecycle()
    )(baseConfig);

    return component;
  } catch (error) {
    console.error('Progress creation error:', error);
    throw new Error(`Failed to create progress: ${(error as Error).message}`);
  }
};

export default createProgress;