// src/components/tabs/state.ts
import { TabComponent } from './types';

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
}

/**
 * Creates a state manager for MD3 tabs
 * @param options - State manager options
 * @returns A tabs state manager instance
 */
export const createTabsState = (options: TabsStateOptions): TabsStateManager => {
  const { tabs = [], onChange } = options;
  let activeTab: TabComponent | null = null;
  
  // Find initial active tab if any
  const initialActiveTab = tabs.find(tab => tab.isActive());
  if (initialActiveTab) {
    activeTab = initialActiveTab;
  }
  
  /**
   * Handles ripple effect on tab activation
   * @param tab - The tab to add ripple to 
   */
  const addRippleEffect = (tab: TabComponent): void => {
    if (!tab.element) return;
    
    const ripple = tab.element.querySelector(`.${tab.getClass('tab')}-ripple`);
    if (!ripple) return;
    
    // Create a new ripple element
    const rippleElement = document.createElement('span');
    rippleElement.className = 'ripple';
    
    // Position the ripple in the center
    rippleElement.style.width = '100%';
    rippleElement.style.height = '100%';
    rippleElement.style.left = '0';
    rippleElement.style.top = '0';
    
    // Add animation
    rippleElement.style.animation = 'ripple-effect 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Add to DOM
    ripple.appendChild(rippleElement);
    
    // Remove after animation completes
    setTimeout(() => {
      rippleElement.remove();
    }, 400);
  };
  
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
    
    // Add ripple effect unless immediate mode is on
    if (!immediate) {
      addRippleEffect(tab);
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
  };
  
  return {
    activateTab,
    getActiveTab,
    destroy
  };
};

/**
 * Adds animation styles for tab state transitions
 */
export const addTabStateStyles = (): void => {
  // Only add once
  if (document.getElementById('tab-state-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'tab-state-styles';
  style.textContent = `
    @keyframes ripple-effect {
      0% {
        transform: scale(0);
        opacity: 0.2;
      }
      100% {
        transform: scale(1);
        opacity: 0;
      }
    }
  `;
  
  document.head.appendChild(style);
};