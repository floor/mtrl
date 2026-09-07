// src/components/loading-indicator/loading-indicator.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withLifecycle } from '../../core/compose/features';
import { withRenderer } from './features/renderer';
import { withAPI } from './api';
import { LoadingIndicatorConfig, LoadingIndicatorComponent } from './types';
import { createBaseConfig, getElementConfig } from './config';

/**
 * Creates a loading indicator: the Material 3 expressive shape morph for
 * waits under about five seconds. It animates from creation.
 * @param {LoadingIndicatorConfig} config - Loading indicator configuration
 * @returns {LoadingIndicatorComponent} Loading indicator component instance
 */
const createLoadingIndicator = (config: LoadingIndicatorConfig = {}): LoadingIndicatorComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    return pipe(
      createBase,
      withElement(getElementConfig(baseConfig)),
      withLifecycle(),
      withRenderer(baseConfig),
      (comp) => withAPI({ config: baseConfig, lifecycle: { destroy: comp.lifecycle?.destroy || (() => {}) } })(comp)
    )(baseConfig) as LoadingIndicatorComponent;
  } catch (error) {
    console.error('Loading indicator creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create loading indicator: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createLoadingIndicator;
