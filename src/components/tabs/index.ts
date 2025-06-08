// src/components/tabs/index.ts
import createTabs from "./tabs";
import { addScrollIndicators } from "./scroll-indicators";
import { setupResponsiveBehavior } from "./responsive";
import { createTabsState } from "./state";
import { createTabIndicator } from "./indicator";
import { updateTabPanels, setupKeyboardNavigation } from "./utils";

// Export constants
export {
  TAB_VARIANTS,
  TAB_STATES,
  TAB_INDICATOR_WIDTH_STRATEGIES,
  TAB_EVENTS,
  TABS_EVENTS,
  TABS_DEFAULTS,
  TABS_CLASSES,
  TAB_CLASSES,
} from "./constants";

export {
  // Types
  TabsConfig,
  TabsComponent,
  TabComponent,
  TabConfig,
  TabChangeEventData,
  IndicatorConfig,
} from "./types";

// Export enhancers and utilities
export {
  addScrollIndicators,
  setupResponsiveBehavior,
  createTabsState,
  createTabIndicator,
  updateTabPanels,
  setupKeyboardNavigation,
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
  IndicatorComponent,
} from "./features";

// Default export
export default createTabs;
