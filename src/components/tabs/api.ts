// src/components/tabs/api.ts
import { TabsComponent, TabComponent, TabConfig } from './types';
import { createTab } from './tab';

/**
 * API options for a Tabs component
 */
interface ApiOptions {
  /** The component's lifecycle API */
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Component with required elements and methods
 */
interface ComponentWithElements {
  /** The DOM element */
  element: HTMLElement;
  /** Array of tab components */
  tabs: TabComponent[];
  /** Container for tabs */
  tabsContainer: HTMLElement;
  /** Tab click handler */
  handleTabClick: (event: Event, tab: TabComponent) => void;
  /** Scroll container (optional) */
  scrollContainer?: HTMLElement;
  /** Class name helper */
  getClass: (name: string) => string;
  /** Event subscription (optional) */
  on?: (event: string, handler: Function) => any;
  /** Event unsubscription (optional) */
  off?: (event: string, handler: Function) => any;
  /** Event emission (optional) */
  emit?: (event: string, data: any) => any;
  /** Component configuration */
  config: Record<string, any>;
}

/**
 * Enhances a tabs component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
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
      
      // Ensure value is set if not provided
      if (mergedConfig.value === undefined) {
        mergedConfig.value = ''; // Default empty value
      }
      
      // Create the tab
      const tab = createTab(mergedConfig);
      
      // Add to internal tabs array
      component.tabs.push(tab);
      
      // Add to DOM
      const targetContainer = component.tabsContainer;
      targetContainer.appendChild(tab.element);
      
      // Add click handler with robust event handling
      if (tab.on && typeof tab.on === 'function') {
        tab.on('click', (event) => component.handleTabClick(event, tab));
      }
      
      // Add direct DOM event handler as a fallback
      tab.element.addEventListener('click', (event) => {
        component.handleTabClick(event, tab);
      });
      
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
      
      // Add click handler via API and direct DOM event
      if (tab.on && typeof tab.on === 'function') {
        tab.on('click', (event) => component.handleTabClick(event, tab));
      }
      
      tab.element.addEventListener('click', (event) => {
        component.handleTabClick(event, tab);
      });
      
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
      
      // Clean up tab and remove from DOM
      if (targetTab.element.parentNode) {
        targetTab.element.parentNode.removeChild(targetTab.element);
      }
      
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