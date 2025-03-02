// src/components/tabs/tabs.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withVariant,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withAPI } from './api';
import { TabsConfig } from './types';
import { TABS_VARIANTS } from './constants';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Tabs component
 * @param {TabsConfig} config - Tabs configuration object
 * @returns {TabsComponent} Tabs component instance
 */
const createTabs = (config: TabsConfig = {}) => {
  const baseConfig = createBaseConfig(config);

  try {
    const tabs = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Initialize tabs
    if (baseConfig.items && baseConfig.items.length > 0) {
      tabs.setItems(baseConfig.items);
    }

    // Set active tab if specified
    if (baseConfig.activeIndex !== undefined) {
      tabs.setActiveTab(baseConfig.activeIndex);
    }

    return tabs;
  } catch (error) {
    console.error('Tabs creation error:', error);
    throw new Error(`Failed to create tabs: ${(error as Error).message}`);
  }
};

export default createTabs;