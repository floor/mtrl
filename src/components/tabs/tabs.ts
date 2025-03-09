// src/components/tabs/tabs.ts
import { pipe } from '../../core/compose';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withAPI, getApiConfig } from './api';
import { withTabsManagement, withScrollable, withDivider } from './features';
import { createTabsConfig, getTabsElementConfig } from './config';
import { TabsConfig, TabsComponent, TabComponent } from './types';
import { createTabsState, addTabStateStyles } from './state';

/**
 * Creates a new Tabs component following MD3 guidelines
 * @param {TabsConfig} config - Tabs configuration object
 * @returns {TabsComponent} Tabs component instance
 * @example
 * ```typescript
 * // Create basic tabs with three items
 * const tabs = createTabs({
 *   tabs: [
 *     { text: 'Home', value: 'home', state: 'active' },
 *     { text: 'Products', value: 'products' },
 *     { text: 'About', value: 'about' }
 *   ]
 * });
 * 
 * // Add tabs to DOM
 * document.body.appendChild(tabs.element);
 * 
 * // Listen for tab changes
 * tabs.on('change', (e) => {
 *   console.log(`Active tab: ${e.value}`);
 * });
 * ```
 */
const createTabs = (config: TabsConfig = {}): TabsComponent => {
  const baseConfig = createTabsConfig(config);
  
  // Add ripple styles for state transitions
  addTabStateStyles();

  try {
    // Build the tabs component with all features
    const component = pipe(
      createBase,
      withEvents(),
      getTabsElementConfig(baseConfig),
      withScrollable(baseConfig),
      withTabsManagement(baseConfig),
      withDivider(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);
    
    // Set up keyboard navigation
    setupKeyboardNavigation(component);
    
    // Set up state management for smooth transitions
    const stateManager = createTabsState({
      tabs: component.tabs,
      onChange: (data) => {
        if (component.emit) {
          component.emit('change', data);
        }
      }
    });
    
    // Make sure the right tab panel is visible (if any exist)
    updateTabPanels(component);
    
    // Override setActiveTab to use state manager
    const originalSetActiveTab = component.setActiveTab;
    component.setActiveTab = function(tabOrValue: TabComponent | string) {
      const targetTab = typeof tabOrValue === 'string'
        ? component.tabs.find(tab => tab.getValue() === tabOrValue)
        : tabOrValue;
        
      if (!targetTab) return this;
      
      // Use state manager for smooth transition
      stateManager.activateTab(targetTab);
      
      // Update associated tab panels
      updateTabPanels(component);
      
      return this;
    };
    
    // Override the destroy method to clean up state manager
    const originalDestroy = component.destroy;
    component.destroy = function() {
      stateManager.destroy();
      originalDestroy.call(this);
    };
    
    return component;
  } catch (error) {
    console.error('Tabs creation error:', error);
    throw new Error(`Failed to create tabs: ${(error as Error).message}`);
  }
};

/**
 * Sets up keyboard navigation for tabs
 * @param component - Tabs component
 */
function setupKeyboardNavigation(component: TabsComponent): void {
  component.element.addEventListener('keydown', (event: KeyboardEvent) => {
    // Only handle arrow keys when tabs container has focus
    if (event.target !== event.currentTarget) return;
    
    const tabs = component.getTabs();
    const currentTab = component.getActiveTab();
    const currentIndex = currentTab ? tabs.indexOf(currentTab) : -1;
    
    let newIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
        
      case 'Home':
        newIndex = 0;
        break;
        
      case 'End':
        newIndex = tabs.length - 1;
        break;
        
      default:
        return; // Don't handle other keys
    }
    
    // If a new tab should be focused
    if (newIndex !== currentIndex && tabs[newIndex]) {
      event.preventDefault();
      tabs[newIndex].element.focus();
      component.setActiveTab(tabs[newIndex]);
    }
  });
}

/**
 * Updates tab panels based on active tab
 * @param component - Tabs component
 */
function updateTabPanels(component: TabsComponent): void {
  const activeTab = component.getActiveTab();
  if (!activeTab) return;
  
  const activeValue = activeTab.getValue();
  
  // Find all tab panels in the document
  const tabPanels = document.querySelectorAll(`[role="tabpanel"]`);
  
  tabPanels.forEach(panel => {
    // Get the associated tab value
    const forTab = panel.getAttribute('aria-labelledby')?.replace('tab-', '');
    
    if (forTab === activeValue) {
      panel.removeAttribute('hidden');
      panel.setAttribute('tabindex', '0');
    } else {
      panel.setAttribute('hidden', 'true');
      panel.setAttribute('tabindex', '-1');
    }
  });
}

export default createTabs;