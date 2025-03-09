// src/components/tabs/index.ts
import createTabs from './tabs';
import { createTab } from './tab';
import { addScrollIndicators } from './scroll-indicators';
import { setupResponsiveBehavior } from './responsive';
import { createTabsState } from './state';

export { 
  // Main component creators
  createTabs,
  createTab,
  
  // Constants
  TABS_VARIANTS, 
  TAB_STATES, 
  TAB_LAYOUT,
  TAB_INTERACTION_STATES,
  TAB_ANIMATION,
  TAB_A11Y,
  TAB_COLORS
} from './constants';

export { 
  // Types
  TabsConfig, 
  TabsComponent, 
  TabComponent, 
  TabConfig, 
  TabChangeEventData 
} from './types';

// Export enhancers
export { 
  addScrollIndicators,
  setupResponsiveBehavior,
  createTabsState
};

// Default export
export default createTabs;