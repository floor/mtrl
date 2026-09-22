// src/components/tabs/state.ts
import { TabComponent } from './types';
import { TabIndicator } from './indicator';

/**
 * State manager for MD3 tab states
 * Handles proper state transitions between tabs
 */
export interface TabsStateManager {
  /**
   * Activates a tab and handles state transitions
   * @param tab - The tab to activate
   * @param immediate - Whether to skip animation
   */
  activateTab: (tab: TabComponent, immediate?: boolean) => void;
  
  /**
   * Gets the currently active tab
   */
  getActiveTab: () => TabComponent | null;
  
  /**
   * Cleans up event listeners
   */
  destroy: () => void;
}

/**
 * Options for creating a tabs state manager
 */
export interface TabsStateOptions {
  /**
   * Initial tabs to manage
   */
  tabs: TabComponent[];
  
  /**
   * Optional callback when active tab changes
   */
  onChange?: (data: { tab: TabComponent; value: string }) => void;
  
  /**
   * Optional indicator component
   */
  indicator?: TabIndicator;
}

/**
 * Creates a state manager for MD3 tabs
 * @param options - State manager options
 * @returns A tabs state manager instance
 */
export const createTabsState = (options: TabsStateOptions): TabsStateManager => {
  const { tabs = [], onChange, indicator } = options;
  let activeTab: TabComponent | null = null;
  
  // Find initial active tab if any
  const initialActiveTab = tabs.find(tab => tab.isActive());
  if (initialActiveTab) {
    activeTab = initialActiveTab;
    
    // Position indicator at initial active tab
    if (indicator) {
      // Delay initial positioning to ensure DOM is ready
      setTimeout(() => {
        indicator.moveToTab(initialActiveTab, true);
      }, 50);
    }
  }
  
  /**
   * Activates a tab with proper state transitions
   */
  const activateTab = (tab: TabComponent, immediate = false): void => {
    if (!tab || (activeTab === tab)) return;
    
    // First deactivate the current active tab
    if (activeTab) {
      activeTab.deactivate();
    }
    
    // Activate the new tab
    tab.activate();
    activeTab = tab;
    
    // Move indicator to this tab
    if (indicator) {
      // Small delay to ensure DOM updates before indicator positioning
      setTimeout(() => {
        indicator.moveToTab(tab, immediate);
      }, 10);
    }
    
    // Trigger change callback
    if (onChange) {
      onChange({
        tab,
        value: tab.getValue()
      });
    }
  };
  
  /**
   * Gets the currently active tab
   */
  const getActiveTab = (): TabComponent | null => {
    return activeTab;
  };
  
  /**
   * Cleans up resources
   */
  const destroy = (): void => {
    // Clean up any event listeners or timers
    activeTab = null;
  };
  
  return {
    activateTab,
    getActiveTab,
    destroy
  };
};
