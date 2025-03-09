// src/components/tabs/utils.ts
import { TabsComponent, TabComponent } from './types';

/**
 * Gets the active tab from a component
 * @param component - Component with tabs
 * @returns Active tab or null
 */
export function getActiveTab(component: any): TabComponent | null {
  // First try the standard method
  if (typeof component.getActiveTab === 'function') {
    return component.getActiveTab();
  }
  
  // Fallback: check if component has tabs array
  if (Array.isArray(component.tabs)) {
    return component.tabs.find(tab => tab.isActive && tab.isActive());
  }
  
  // If all else fails, return null
  return null;
}

/**
 * Updates tab panels based on active tab
 * @param component - Component with tabs
 */
export function updateTabPanels(component: any): void {
  // Get active tab using our helper function
  const activeTab = getActiveTab(component);
  if (!activeTab) return;
  
  // Make sure getValue exists
  if (typeof activeTab.getValue !== 'function') return;
  
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

/**
 * Sets up keyboard navigation for tabs
 * @param component - Tabs component
 */
export function setupKeyboardNavigation(component: any): void {
  // Skip if element is missing
  if (!component.element) return;
  
  component.element.addEventListener('keydown', (event: KeyboardEvent) => {
    // Only handle arrow keys when tabs container has focus
    if (event.target !== event.currentTarget) return;
    
    // Skip if getTabs or setActiveTab don't exist
    if (typeof component.getTabs !== 'function' || 
        typeof component.setActiveTab !== 'function') return;
    
    const tabs = component.getTabs();
    const currentTab = getActiveTab(component);
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