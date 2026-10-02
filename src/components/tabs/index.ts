// src/components/tabs/index.ts
import createTabs from "./tabs";
import { setupResponsiveBehavior } from "./responsive";
import { tabIdFor, tabPanelIdFor } from "./utils";

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
  TabsVariant,
  TabsComponent,
  TabComponent,
  TabConfig,
  TabChangeEventData,
  TabEvents,
  TabsEvents,
  // Public: TabsConfig.indicator takes it (FLO-381 keeps it)
  IndicatorConfig,
} from "./types";

// Public and documented (md3.io tabs); a responsive option on createTabs
// replaces it in 1.1 (FLO-381)
export { setupResponsiveBehavior };
// Public: a page that writes its own panels names them with the derived ids (FLO-430)
export { tabIdFor, tabPanelIdFor };
export type { ResponsiveConfig } from "./responsive";
// Public: TabsComponent.getIndicator returns it (FLO-381)
export type { TabIndicator } from "./indicator";

// Default export
export default createTabs;

// A single tab, for a tablist built by hand or `addTab` with an instance (FLO-384)
export { createTab } from "./tab";
