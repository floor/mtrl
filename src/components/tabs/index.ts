// src/components/tabs/index.ts
import createTabs from './tabs';
import { createTab } from './tab';
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

// Default export
export default createTabs;