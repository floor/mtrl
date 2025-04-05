// src/components/tabs/index.ts
import fTabs from './tabs';
import { fTab } from './tab';
import { addScrollIndicators } from './scroll-indicators';
import { setupResponsiveBehavior } from './responsive';
import { createTabsState } from './state';
import { createTabIndicator } from './indicator';
import { updateTabPanels, setupKeyboardNavigation } from './utils';

export { 
  // Types
  TabsConfig, 
  TabsComponent, 
  TabComponent, 
  TabConfig, 
  TabChangeEventData,
  IndicatorConfig
} from './types';

// Export enhancers and utilities
export { 
  addScrollIndicators,
  setupResponsiveBehavior,
  createTabsState,
  createTabIndicator,
  updateTabPanels,
  setupKeyboardNavigation
};

// Export features
export {
  withTabsManagement,
  withScrollable,
  withDivider,
  withIndicator,
  TabsManagementConfig,
  TabsManagementComponent,
  ScrollableConfig,
  ScrollableComponent,
  DividerConfig,
  IndicatorFeatureConfig,
  IndicatorComponent
} from './features';

// Export main components with both new and legacy names
export default fTabs;
export { fTabs, fTabs as createTabs };
export { fTab, fTab as createTab };