// src/components/tabs/tabs.ts
import { pipe } from '../../core/compose';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withAPI, getApiConfig } from './api';
import { 
  withTabsManagement, 
  withScrollable, 
  withDivider,
  withIndicator
} from './features';
import { createTabsConfig, getTabsElementConfig } from './config';
import { TabsConfig, TabsComponent } from './types';
import { addTabStateStyles } from './state';
import { setupKeyboardNavigation } from './utils';

/**
 * Creates a new Tabs component following MD3 guidelines
 * 
 * A Tabs component allows content to be organized across multiple screens, 
 * datasets, or other interactions. Tabs can include text, icons, or both,
 * and can be configured with various features such as scrolling, indicators,
 * and dividers.
 * 
 * @param {TabsConfig} config - Tabs configuration object
 * @returns {TabsComponent} Tabs component instance
 * 
 * @example
 * ```typescript
 * // Create basic tabs with three items
 * const tabs = fTabs({
 *   tabs: [
 *     { text: 'Home', value: 'home', state: 'active' },
 *     { text: 'Products', value: 'products' },
 *     { text: 'About', value: 'about' }
 *   ]
 * });
 * 
 * // Create tabs with icons and scrolling
 * const iconTabs = fTabs({
 *   tabs: [
 *     { icon: '<i class="material-icons">home</i>', text: 'Home', value: 'home' },
 *     { icon: '<i class="material-icons">shopping_cart</i>', text: 'Products', value: 'products' },
 *     { icon: '<i class="material-icons">person</i>', text: 'Profile', value: 'profile' },
 *     { icon: '<i class="material-icons">settings</i>', text: 'Settings', value: 'settings' }
 *   ],
 *   scrollable: true,
 *   indicatorStyle: 'underline'
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
const fTabs = (config: TabsConfig = {}): TabsComponent => {
  const baseConfig = createTabsConfig(config);
  
  // Add ripple styles for state transitions
  addTabStateStyles();

  try {
    // Build the tabs component with all features
    const component = pipe(
      createBase,
      withEvents(),
      getTabsElementConfig(baseConfig),
      withScrollable(baseConfig),
      withTabsManagement(baseConfig),
      withDivider(baseConfig),
      withIndicator(baseConfig),  // Add indicator feature
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);
    
    // Set up keyboard navigation
    setupKeyboardNavigation(component);
    
    return component;
  } catch (error) {
    console.error('Tabs creation error:', error);
    throw new Error(`Failed to create tabs: ${(error as Error).message}`);
  }
};

export default fTabs;