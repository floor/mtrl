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

export type {
  // Types
  TabsConfig,
  TabsComponent,
  TabComponent,
  TabConfig,
  TabChangeEventData,
  // Public: TabsConfig.indicator takes it (FLO-381 keeps it)
  IndicatorConfig,
} from "./types";

// Export enhancers and utilities
export {
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  addScrollIndicators,
  // Public and documented (md3.io tabs); a responsive option on createTabs replaces it in 1.1 (FLO-381)
  setupResponsiveBehavior,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  createTabsState,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  createTabIndicator,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  updateTabPanels,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  setupKeyboardNavigation,
};

// Export features
export {
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  withTabsManagement,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  withScrollable,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  withDivider,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  withIndicator,
} from "./features";
export type {
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  TabsManagementConfig,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  TabsManagementComponent,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  ScrollableConfig,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  ScrollableComponent,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  DividerConfig,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  IndicatorFeatureConfig,
  /** @deprecated Internal, no replacement: removed from mtrl/components/tabs in 1.0.0 (FLO-381). */
  IndicatorComponent,
} from "./features";

// Default export
export default createTabs;

// A single tab, for a tablist built by hand or `addTab` with an instance (FLO-384)
export { createTab } from "./tab";
export * from "./constants";
