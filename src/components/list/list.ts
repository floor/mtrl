// src/components/list/list.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withDisabled, withLifecycle } from '../../core/compose/features';
import { withAPI } from './api';
import { withListContent } from './features';
import { ListConfig } from './types';
import { createBaseConfig, getElementConfig } from './config';

/**
 * Creates a List component
 * @param {ListConfig} config - List configuration
 * @returns {Object} List component instance
 */
const createList = (config: ListConfig = {}): any => {
  const baseConfig = createBaseConfig(config);

  try {
    return pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withDisabled(baseConfig),
      withLifecycle(),
      withListContent(baseConfig),
      comp => withAPI({
        disabled: comp.disabled,
        lifecycle: comp.lifecycle
      })(comp)
    )(baseConfig);
  } catch (error) {
    console.error('List creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create list: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createList;