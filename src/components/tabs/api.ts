// src/components/tabs/api.ts
import { TabsComponent, TabComponent, TabConfig, TabsEvents } from './types';
import { warnUnknownValue } from '../../core/utils/warn';
import type { EventCallback } from "../../core/state/emitter";
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
  handleTabClick: (event: Event | null, tab: TabComponent) => void;
  /** The tablist's id, which added tabs carry as the initial ones do */
  groupId?: string;
  /** Scroll container (optional) */
  scrollContainer?: HTMLElement;
  /** Class name helper */
  getClass: (name: string) => string;
  /** Event subscription (optional) */
  on?: (event: string, handler: EventCallback) => unknown;
  /** Event unsubscription (optional) */
  off?: (event: string, handler: EventCallback) => unknown;
  /** Event emission (optional); returns `this`, the tabs component once spread */
  emit?(event: string, data: unknown): this;
  /** Component configuration */
  config: {
    prefix?: string;
    variant?: string;
  };
}

/**
 * Enhances a tabs component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI = ({ lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): TabsComponent => ({
    ...component,
    element: component.element,
    
    /**
     * Creates and adds a new tab
     */
    addTab(config: TabConfig) {
      // Create a merged config that inherits from tabs component
      const mergedConfig = {
        ...config,
        prefix: component.config.prefix,
        variant: config.variant || component.config.variant,
        // The group's id, as the initial tabs have: without it an added tab's id
        // was `tab--<value>`, colliding across tablists (FLO-229, FLO-263).
        groupId: component.groupId,
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
      
      // One listener: on() when the tab has it, the DOM otherwise. Both at once
      // ran handleTabClick twice per click.
      if (tab.on && typeof tab.on === 'function') {
        // The tab re-emits its button's wrapped click, not the DOM event.
        // Pass that same value on: handleTabClick's guard ignores a payload
        // with no preventDefault, which is what this path has always done.
        tab.on('click', (event) => component.handleTabClick(event as unknown as Event, tab));
      } else {
        tab.element.addEventListener('click', (event) => {
          component.handleTabClick(event, tab);
        });
      }
      
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
      
      // One listener: on() when the tab has it, the DOM otherwise.
      if (tab.on && typeof tab.on === 'function') {
        tab.on('click', (event) => component.handleTabClick(event as unknown as Event, tab));
      } else {
        tab.element.addEventListener('click', (event) => {
          component.handleTabClick(event, tab);
        });
      }
      
      return this;
    },
    
    /**
     * Gets all tabs
     */
    getTabs() {
      return [...component.tabs];
    },
    
    /** Reads the active tab identifier, or null when none is active. */
    getValue() {
      return this.getActiveTab()?.getValue() ?? null;
    },

    /** Gets the active tab. */
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
        
      // A value no tab carries clears the selection, the same as native
      // `<select>` setting selectedIndex = -1, and warns outside production.
      // It used to return with the previous tab still active, which is
      // indistinguishable from a typo. FLO-106.
      if (!targetTab) {
        if (typeof tabOrValue === 'string') {
          component.tabs.forEach(tab => tab.deactivate());
          warnUnknownValue('tabs', tabOrValue);
        }
        return this;
      }

      // A disabled tab *can* be selected by code. `disabled` blocks the user,
      // not the application: a form restored from saved data must be able to
      // show a value that is currently disabled, which is how native select
      // and radio inputs behave. The guard that used to stand here refused,
      // making tabs the odd one out of the four. FLO-106.

      // Deactivate all tabs first
      component.tabs.forEach(tab => tab.deactivate());

      // Activate the target tab. Silently: a selection made from code emits
      // no `change`, as on a native control; a click or a key does (FLO-328).
      targetTab.activate();

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
    on<K extends keyof TabsEvents>(event: K, handler: TabsEvents[K]) {
      if (component.on) {
        component.on(event, handler as EventCallback);
      }
      return this;
    },
    
    /**
     * Removes an event listener
     */
    off<K extends keyof TabsEvents>(event: K, handler: TabsEvents[K]) {
      if (component.off) {
        component.off(event, handler as EventCallback);
      }
      return this;
    },
    
    /**
     * Emits an event.
     *
     * Declared here rather than left to the spread for the same reason as `on`
     * and `off` above. The runtime was always right -- the spread copies the
     * method, and calling it on the tabs component binds `this` to the tabs
     * component -- but a spread does not carry the `this` type with it, so the
     * declaration said one thing and the object did another.
     */
    emit(event: string, data: unknown) {
      component.emit?.(event, data);
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
export const getApiConfig = (comp: ApiOptions): ApiOptions => ({
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});