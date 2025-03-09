// src/components/tabs/tabs.ts
import { pipe } from '../../core/compose';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withAPI, getApiConfig } from './api';
import { withTabsManagement, withScrollable, withDivider } from './features';
import { createTabsConfig, getTabsElementConfig } from './config';
import { TabsConfig, TabsComponent, TabComponent } from './types';
import { createTabsState, addTabStateStyles } from './state';
import { createTabIndicator, TabIndicator } from './indicator';

/**
 * Creates a new Tabs component following MD3 guidelines
 * @param {TabsConfig} config - Tabs configuration object
 * @returns {TabsComponent} Tabs component instance
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
    
    // Create and add the indicator with proper config
    const indicatorConfig = baseConfig.indicator || {};
    const indicator: TabIndicator = createTabIndicator({
      prefix: baseConfig.prefix,
      // Support both new and legacy config
      widthStrategy: indicatorConfig.widthStrategy || baseConfig.indicatorWidthStrategy || 'fixed',
      height: indicatorConfig.height || baseConfig.indicatorHeight || 3,
      fixedWidth: indicatorConfig.fixedWidth || 40,
      animationDuration: indicatorConfig.animationDuration || 250,
      animationTiming: indicatorConfig.animationTiming || 'cubic-bezier(0.4, 0, 0.2, 1)',
      color: indicatorConfig.color
    });
    
    // CRITICAL: Find the scroll container and add the indicator to it
    const scrollContainer = component.scrollContainer;
    if (!scrollContainer) {
      console.error('No scroll container found - cannot add indicator');
      throw new Error('Failed to create tabs: No scroll container found');
    }
    
    // Add the indicator to the scroll container - this is essential!
    scrollContainer.appendChild(indicator.element);
    
    // Store the indicator on the component for access
    (component as any).indicator = indicator;
    (component as any).getIndicator = () => indicator;
    
    // CRITICAL: Complete replacement of the tab click handler to ensure indicator updates
    component.handleTabClick = function(event, tab) {
      // Skip if tab is disabled
      if (tab.disabled && tab.disabled.isDisabled && tab.disabled.isDisabled()) {
        return;
      }
      
      // Deactivate all tabs first
      component.getTabs().forEach(t => t.deactivate());
      
      // Activate the clicked tab
      tab.activate();
      
      // Move indicator with a slight delay to ensure DOM updates
      setTimeout(() => {
        indicator.moveToTab(tab);
      }, 10);
      
      // Get the tab value
      const value = tab.getValue();
      
      // Emit change event if component has emit method
      if (typeof component['emit'] === 'function') {
        component['emit']('change', {
          tab,
          value
        });
      }
      
      // Update tab panels
      updateTabPanels(component);
    };
    
    // Override setActiveTab to use indicator
    const originalSetActiveTab = component.setActiveTab;
    component.setActiveTab = function(tabOrValue: TabComponent | string) {
      const targetTab = typeof tabOrValue === 'string'
        ? component.tabs.find(tab => tab.getValue() === tabOrValue)
        : tabOrValue;
        
      if (!targetTab) return this;
      
      // Call original implementation
      originalSetActiveTab.call(this, targetTab);
      
      // Ensure indicator moves to the active tab
      setTimeout(() => {
        indicator.moveToTab(targetTab);
      }, 10);
      
      return this;
    };
    
    // Position indicator on initial active tab
    setTimeout(() => {
      const activeTab = component.getActiveTab();
      if (activeTab) {
        indicator.moveToTab(activeTab, true);
      }
    }, 50);
    
    // Add scroll event handling
    scrollContainer.addEventListener('scroll', () => {
      const activeTab = component.getActiveTab();
      if (activeTab) {
        indicator.moveToTab(activeTab, true);
      }
    });
    
    // Watch for window resize to update indicator
    const resizeObserver = new ResizeObserver(() => {
      const activeTab = component.getActiveTab();
      if (activeTab) {
        indicator.moveToTab(activeTab, true);
      }
    });
    
    resizeObserver.observe(scrollContainer);
    
    // Add custom DOM mutation observer to watch for class changes
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            (mutation.target as HTMLElement).classList.contains(`${baseConfig.prefix}-tab--active`)) {
          // A tab became active, update indicator position
          indicator.moveToTab(component.getActiveTab() as TabComponent);
        }
      }
    });
    
    // Observe all tabs for class changes
    component.getTabs().forEach(tab => {
      mutationObserver.observe(tab.element, { attributes: true });
    });
    
    // Override destroy to clean up resources
    const originalDestroy = component.destroy;
    component.destroy = function() {
      indicator.destroy();
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', () => {});
      }
      
      originalDestroy.call(this);
    };
    
    return component;
  } catch (error) {
    console.error('Tabs creation error:', error);
    throw new Error(`Failed to create tabs: ${(error as Error).message}`);
  }
};

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