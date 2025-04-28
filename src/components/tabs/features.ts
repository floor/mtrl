// src/components/tabs/features.ts
import { createTab } from './tab';
import { TabConfig, TabComponent } from './types';
import { BaseComponent } from '../../core/compose/component';
import { updateTabPanels, getActiveTab } from './utils';
import { createTabIndicator, TabIndicator } from './indicator';
import { 
  TABS_CLASSES, 
  TAB_INDICATOR_WIDTH_STRATEGIES, 
  TABS_DEFAULTS 
} from './constants';

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
  
  /** Get all tabs */
  getTabs?: () => TabComponent[];
  
  /** Get the active tab */
  getActiveTab?: () => TabComponent | null;
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
     * Gets all tabs
     */
    const getTabs = () => {
      return [...tabs];
    };
    
    /**
     * Gets the active tab
     */
    const getActiveTab = () => {
      return tabs.find(tab => tab.isActive()) || null;
    };
    
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
      
      // Update tab panels
      updateTabPanels({
        tabs,
        getActiveTab: () => tabs.find(t => t.isActive()) || null
      });
      
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
      handleTabClick,
      getTabs,
      getActiveTab
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

/**
 * Configuration for indicator feature
 */
export interface IndicatorFeatureConfig {
  /** Component prefix */
  prefix?: string;
  /** Width strategy for the indicator */
  widthStrategy?: 'fixed' | 'dynamic' | 'content';
  /** Height of the indicator in pixels */
  height?: number;
  /** Fixed width in pixels (when using fixed strategy) */
  fixedWidth?: number;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Animation timing function */
  animationTiming?: string;
  /** Custom color for the indicator */
  color?: string;
  /** Legacy height property */
  indicatorHeight?: number;
  /** Legacy width strategy property */
  indicatorWidthStrategy?: 'fixed' | 'dynamic' | 'content';
  /** Indicator configuration object */
  indicator?: {
    widthStrategy?: 'fixed' | 'dynamic' | 'content';
    height?: number;
    fixedWidth?: number;
    animationDuration?: number;
    animationTiming?: string;
    color?: string;
  };
}

/**
 * Component with indicator capability
 */
export interface IndicatorComponent {
  /** The indicator instance */
  indicator: TabIndicator;
  /** Get the indicator instance */
  getIndicator: () => TabIndicator;
}

/**
 * Enhances a component with tab indicator functionality
 * @param config - Indicator configuration
 * @returns Component enhancer with indicator functionality
 */
export const withIndicator = <T extends IndicatorFeatureConfig>(config: T) => 
  <C extends any>(component: C): C & IndicatorComponent => {
    // Create indicator with proper config
    const indicatorConfig = config.indicator || {};
    const indicator: TabIndicator = createTabIndicator({
      prefix: config.prefix,
      // Support both new and legacy config
      widthStrategy: indicatorConfig.widthStrategy || config.indicatorWidthStrategy || 'auto', // Changed default to 'auto'
      height: indicatorConfig.height || config.indicatorHeight || 3,
      fixedWidth: indicatorConfig.fixedWidth || 40,
      animationDuration: indicatorConfig.animationDuration || 250,
      animationTiming: indicatorConfig.animationTiming || 'cubic-bezier(0.4, 0, 0.2, 1)',
      color: indicatorConfig.color,
      // Pass the tabs variant to the indicator
      variant: config.variant || 'primary'
    });
    
    // Find the scroll container and add the indicator to it
    const scrollContainer = component.scrollContainer || component.element;
    if (!scrollContainer) {
      console.error('No scroll container found - cannot add indicator');
      throw new Error('Failed to create tabs: No scroll container found');
    }
    
    // Add the indicator to the scroll container
    scrollContainer.appendChild(indicator.element);
    
    // Store the original handlers to enhance
    const originalHandleTabClick = component.handleTabClick;
    
    // Replace tab click handler to ensure indicator updates
    component.handleTabClick = function(event, tab) {
      // Skip if tab is disabled
      if (tab.disabled && tab.disabled.isDisabled && tab.disabled.isDisabled()) {
        return;
      }
      
      // Call original handler
      originalHandleTabClick.call(this, event, tab);
      
      // Move indicator with a slight delay to ensure DOM updates
      setTimeout(() => {
        indicator.moveToTab(tab);
      }, 10);
    };
    
    // Position indicator on initial active tab
    setTimeout(() => {
      const activeTab = component.tabs.find(tab => tab.isActive());
      if (activeTab) {
        indicator.moveToTab(activeTab, true);
      }
    }, 50);
    
    // Add scroll event handling
    const scrollHandler = () => {
      const activeTab = component.tabs.find(tab => tab.isActive());
      if (activeTab) {
        indicator.moveToTab(activeTab, true);
      }
    };
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', scrollHandler);
    }
    
    // Watch for window resize to update indicator
    const resizeObserver = new ResizeObserver(() => {
      const activeTab = component.tabs.find(tab => tab.isActive());
      if (activeTab) {
        indicator.moveToTab(activeTab, true);
      }
    });
    
    resizeObserver.observe(scrollContainer);
    
    // Add MutationObserver to detect tab state changes
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            (mutation.target as HTMLElement).classList.contains(`${config.prefix}-tab--active`)) {
          // Find the corresponding tab component
          const tabElement = mutation.target as HTMLElement;
          const activeTab = component.tabs.find(tab => tab.element === tabElement);
          if (activeTab) {
            indicator.moveToTab(activeTab);
          }
        }
      }
    });
    
    // Observe all tabs for class changes
    if (Array.isArray(component.tabs)) {
      component.tabs.forEach(tab => {
        if (tab.element) {
          mutationObserver.observe(tab.element, { attributes: true });
        }
      });
    }
    
    // Enhance component's destroy method
    const originalDestroy = component.destroy || (() => {});
    
    // Override destroy to clean up resources
    (component as any).destroy = function() {
      indicator.destroy();
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', scrollHandler);
      }
      
      // Call original destroy if it exists
      if (typeof originalDestroy === 'function') {
        originalDestroy.call(this);
      }
    };
    
    return {
      ...component,
      indicator,
      getIndicator: () => indicator
    };
  };