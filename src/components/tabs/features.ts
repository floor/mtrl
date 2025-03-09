// src/components/tabs/features.ts
import { createTab } from './tab';
import { TabConfig, TabComponent } from './types';
import { BaseComponent } from '../../core/compose/component';
import { TAB_STATES } from './constants';

/**
 * Configuration for tabs management feature
 */
export interface TabsManagementConfig {
  /** Initial tabs to create */
  tabs?: TabConfig[];
  /** Tab variant */
  variant?: string;
  /** Component prefix */
  prefix?: string;
  /** Other configuration properties */
  [key: string]: any;
}

/**
 * Component with tabs management capabilities
 */
export interface TabsManagementComponent {
  /** Array of tab components */
  tabs: TabComponent[];
  
  /** Target container for tabs */
  tabsContainer: HTMLElement;
  
  /** Tab click handler */
  handleTabClick: (event: Event, tab: TabComponent) => void;
}

/**
 * Adds tabs management capabilities to a component
 * @param {TabsManagementConfig} config - Tabs configuration
 * @returns {Function} Component enhancer with tabs management
 */
export const withTabsManagement = <T extends TabsManagementConfig>(config: T) => 
  <C extends any>(component: C): C & TabsManagementComponent => {
    const tabs: TabComponent[] = [];
    
    // Store the target container for tabs
    const tabsContainer = component.scrollContainer || component.element;
    
    // Create initial tabs if provided in config
    if (Array.isArray(config.tabs)) {
      config.tabs.forEach(tabConfig => {
        // Create a merged config that inherits from tabs component
        const mergedConfig = {
          ...tabConfig,
          prefix: config.prefix,
          variant: tabConfig.variant || config.variant
        };
        
        // Create the tab
        const tab = createTab(mergedConfig);
        
        // Add to internal tabs array
        tabs.push(tab);
        
        // Add to DOM
        tabsContainer.appendChild(tab.element);
      });
    }
    
    /**
     * Handles tab click events
     */
    const handleTabClick = (event: any, tab: TabComponent) => {
      // Check if event is a DOM event with preventDefault
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      
      // Skip if tab is disabled
      if (tab.disabled && tab.disabled.isDisabled && tab.disabled.isDisabled()) {
        return;
      }
      
      // Deactivate all tabs first
      tabs.forEach(t => t.deactivate());
      
      // Activate the clicked tab
      tab.activate();
      
      // Get the tab value
      const value = tab.getValue();
      
      // Emit change event if component has emit method
      if (typeof component['emit'] === 'function') {
        component['emit']('change', {
          tab,
          value
        });
      }
    };
    
    // Add click handlers to existing tabs
    tabs.forEach(tab => {
      // Add event listener directly and via API if available
      if (tab.on && typeof tab.on === 'function') {
        tab.on('click', (event) => handleTabClick(event, tab));
      }
      // Also add direct DOM event listener as a fallback
      tab.element.addEventListener('click', (event) => handleTabClick(event, tab));
    });
    
    return {
      ...component,
      tabs,
      tabsContainer,
      handleTabClick
    };
  };

/**
 * Configuration for scrollable feature
 */
export interface ScrollableConfig {
  /** Whether tabs are scrollable horizontally */
  scrollable?: boolean;
  /** Other configuration properties */
  [key: string]: any;
}

/**
 * Component with scrollable capabilities
 */
export interface ScrollableComponent {
  /** Scroll container element */
  scrollContainer?: HTMLElement;
}

/**
 * Adds scrollable capabilities to a component
 * @param {ScrollableConfig} config - Scrollable configuration
 * @returns {Function} Component enhancer with scrollable container
 */
export const withScrollable = <T extends ScrollableConfig>(config: T) => 
  <C extends any>(component: C): C & ScrollableComponent => {
    // Skip if scrollable is explicitly false
    if (config.scrollable === false) {
      return component as C & ScrollableComponent;
    }
    
    // Add scrollable class
    component.element.classList.add(`${component.getClass('tabs')}--scrollable`);
    
    // Create container for tabs that can scroll
    const scrollContainer = document.createElement('div');
    scrollContainer.className = `${component.getClass('tabs')}-scroll`;
    
    // Move any existing children to scroll container
    while (component.element.firstChild) {
      scrollContainer.appendChild(component.element.firstChild);
    }
    
    // Add scroll container to the main element
    component.element.appendChild(scrollContainer);
    
    return {
      ...component,
      scrollContainer
    };
  };

/**
 * Configuration for divider feature
 */
export interface DividerConfig {
  /** Whether to show a divider below the tabs */
  showDivider?: boolean;
  /** Other configuration properties */
  [key: string]: any;
}

/**
 * Adds a divider to a component
 * @param {DividerConfig} config - Divider configuration
 * @returns {Function} Component enhancer with divider
 */
export const withDivider = <T extends DividerConfig>(config: T) => 
  <C extends any>(component: C): C => {
    // Skip if divider is explicitly disabled
    if (config.showDivider === false) {
      return component;
    }
    
    // Create the divider element
    const divider = document.createElement('div');
    divider.className = `${component.getClass('tabs')}-divider`;
    
    // Add the divider to the main element
    component.element.appendChild(divider);
    
    return component;
  };