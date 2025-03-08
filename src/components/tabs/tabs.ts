// src/components/tabs/tabs.ts
import { pipe } from '../../core/compose';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withAPI, getApiConfig } from './api';
import { withTabsManagement, withScrollable, withDivider } from './features';
import { createTabsConfig, getTabsElementConfig } from './config';
import { TabsConfig, TabsComponent } from './types';

/**
 * Creates a new Tabs component
 * @param {TabsConfig} config - Tabs configuration object
 * @returns {TabsComponent} Tabs component instance
 * @example
 * ```typescript
 * // Create basic tabs with three items
 * const tabs = createTabs({
 *   tabs: [
 *     { text: 'Home', value: 'home', state: 'active' },
 *     { text: 'Products', value: 'products' },
 *     { text: 'About', value: 'about' }
 *   ]
 * });
 * 
 * // Add tabs to DOM
 * document.body.appendChild(tabs.element);
 * 
 * // Listen for tab changes
 * tabs.on('change', (e) => {
 *   console.log(`Active tab: ${e.value}`);
 * });
 * ```
 */
const createTabs = (config: TabsConfig = {}): TabsComponent => {
  const baseConfig = createTabsConfig(config);

  try {
    // Build the tabs component with all features
    const component = pipe(
      createBase,
      withEvents(),
      getTabsElementConfig(baseConfig),
      withScrollable(baseConfig),
      withTabsManagement(baseConfig),
      withDivider(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return component;
  } catch (error) {
    console.error('Tabs creation error:', error);
    throw new Error(`Failed to create tabs: ${(error as Error).message}`);
  }
};

export default createTabs;