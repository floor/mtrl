// src/components/tabs/api.ts
import { TabsComponent, TabComponent, TabConfig } from './types';
import { createTab } from './tab';

interface ApiOptions {
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  tabs: TabComponent[];
  tabsContainer: HTMLElement;
  handleTabClick: (event: Event, tab: TabComponent) => void;
  scrollContainer?: HTMLElement;
  getClass: (name: string) => string;
  on?: (event: string, handler: Function) => any;
  off?: (event: string, handler: Function) => any;
  emit?: (event: string, data: any) => any;
  config: Record<string, any>;
}

/**
 * Enhances a tabs component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Tabs component
 */
export const withAPI = ({ lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): TabsComponent => ({
    ...component as any,
    element: component.element,
    
    /**
     * Creates and adds a new tab
     */
    addTab(config: TabConfig) {
      // Create a merged config that inherits from tabs component
      const mergedConfig = {
        ...config,
        prefix: component.config.prefix,
        variant: config.variant || component.config.variant
      };
      
      // Create the tab
      const tab = createTab(mergedConfig);
      
      // Add to internal tabs array
      component.tabs.push(tab);
      
      // Add to DOM
      const targetContainer = component.tabsContainer;
      targetContainer.appendChild(tab.element);
      
      // Add click handler
      tab.on('click', (event) => component.handleTabClick(event, tab));
      
      return tab;
    },
    
    /**
     * Adds a pre-created tab
     */
    add(tab: TabComponent) {
      component.tabs.push(tab);
      
      // Add tab to DOM
      const targetContainer = component.tabsContainer;
      targetContainer.appendChild(tab.element);
      
      // Add click handler
      tab.on('click', (event) => component.handleTabClick(event, tab));
      
      return this;
    },
    
    /**
     * Gets all tabs
     */
    getTabs() {
      return [...component.tabs];
    },
    
    /**
     * Gets the active tab
     */
    getActiveTab() {
      return component.tabs.find(tab => tab.isActive()) || null;
    },
    
    /**
     * Sets a tab as active
     */
    setActiveTab(tabOrValue: TabComponent | string) {
      const targetTab = typeof tabOrValue === 'string'
        ? component.tabs.find(tab => tab.getValue() === tabOrValue)
        : tabOrValue;
        
      if (!targetTab) return this;
      
      // Deactivate all tabs first
      component.tabs.forEach(tab => tab.deactivate());
      
      // Activate the target tab
      targetTab.activate();
      
      // Emit change event
      if (component.emit) {
        component.emit('change', {
          tab: targetTab,
          value: targetTab.getValue()
        });
      }
      
      return this;
    },
    
    /**
     * Removes a tab
     */
    removeTab(tabOrValue: TabComponent | string) {
      const targetTab = typeof tabOrValue === 'string'
        ? component.tabs.find(tab => tab.getValue() === tabOrValue)
        : tabOrValue;
        
      if (!targetTab) return this;
      
      // Remove from array
      const index = component.tabs.indexOf(targetTab);
      if (index !== -1) {
        component.tabs.splice(index, 1);
      }
      
      // Clean up tab
      targetTab.destroy();
      
      return this;
    },
    
    /**
     * Adds an event listener
     */
    on(event: string, handler: Function) {
      if (component.on) {
        component.on(event, handler);
      }
      return this;
    },
    
    /**
     * Removes an event listener
     */
    off(event: string, handler: Function) {
      if (component.off) {
        component.off(event, handler);
      }
      return this;
    },
    
    /**
     * Destroys the tabs component
     */
    destroy() {
      // Clean up all tabs first
      component.tabs.forEach(tab => tab.destroy());
      component.tabs.length = 0;
      
      // Then destroy container
      lifecycle.destroy();
    }
  });

/**
 * Creates API configuration for the Tabs component
 * @param {Object} comp - Component with lifecycle feature
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});