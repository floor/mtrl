// src/components/tabs/index.ts
import createTabs from './tabs';
export { TABS_VARIANTS, TAB_STATES, TAB_LAYOUT } from './constants';
export { TabsConfig, TabsComponent, TabComponent, TabConfig, TabChangeEventData } from './types';

export default createTabs;
export { createTabs };