// src/components/tabs/api.ts
import { TabsComponent, TabItem, TabChangeEventData } from './types';
import { ANIMATION_DURATION } from './constants';

interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  getClass: (name: string) => string;
  events: {
    emit: (name: string, data?: any) => void;
    on: (name: string, handler: Function) => any;
    off: (name: string, handler: Function) => any;
  };
}

/**
 * Creates DOM elements for the tabs component
 * @param component - Base component with element and class getter
 * @returns Component with tabs-specific elements
 */
const setupElements = (component: ComponentWithElements) => {
  const baseClass = component.getClass('tabs');
  
  // Create tabs list container
  const tabsListElement = document.createElement('div');
  tabsListElement.className = `${baseClass}__list`;
  tabsListElement.setAttribute('role', 'none');
  
  // Create tabs indicator
  const indicatorElement = document.createElement('span');
  indicatorElement.className = `${baseClass}__indicator`;
  
  // Append elements to container
  component.element.appendChild(tabsListElement);
  component.element.appendChild(indicatorElement);
  
  return {
    ...component,
    tabsListElement,
    indicatorElement
  };
};

/**
 * Enhances a tabs component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Tabs component
 */
export const withAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: ReturnType<typeof setupElements>): TabsComponent => {
    // Set up internal state
    let items: TabItem[] = [];
    let activeIndex = -1;
    
    // Set up the component with DOM elements
    const enhancedComponent = setupElements(component);
    
    // Function to create a tab element
    const createTabElement = (item: TabItem, index: number) => {
      const baseClass = component.getClass('tabs');
      const tabElement = document.createElement('button');
      
      tabElement.className = `${baseClass}__tab`;
      tabElement.setAttribute('role', 'tab');
      tabElement.setAttribute('type', 'button');
      tabElement.setAttribute('data-tab-id', item.id);
      tabElement.setAttribute('data-tab-index', index.toString());
      tabElement.setAttribute('aria-selected', 'false');
      
      if (item.disabled) {
        tabElement.disabled = true;
        tabElement.setAttribute('aria-disabled', 'true');
      }
      
      // Create content container
      const contentElement = document.createElement('div');
      contentElement.className = `${baseClass}__tab-content`;
      
      // Add icon if provided
      if (item.icon) {
        const iconElement = document.createElement('div');
        iconElement.className = `${baseClass}__tab-icon`;
        iconElement.innerHTML = item.icon;
        contentElement.appendChild(iconElement);
      }
      
      // Add label
      const labelElement = document.createElement('div');
      labelElement.className = `${baseClass}__tab-label`;
      labelElement.textContent = item.label;
      contentElement.appendChild(labelElement);
      
      tabElement.appendChild(contentElement);
      
      // Add click event
      tabElement.addEventListener('click', () => {
        if (!tabElement.disabled && !disabled.isDisabled()) {
          const clickedIndex = parseInt(tabElement.getAttribute('data-tab-index') || '0', 10);
          api.setActiveTab(clickedIndex);
        }
      });
      
      return tabElement;
    };
    
    // Function to update the indicator position
    const updateIndicator = (animate = true) => {
      if (activeIndex < 0 || !items.length) {
        // Hide indicator if no active tab
        enhancedComponent.indicatorElement.style.transform = 'translateX(-100%)';
        return;
      }
      
      // Find the active tab element
      const tabElement = enhancedComponent.tabsListElement.querySelector(
        `[data-tab-index="${activeIndex}"]`
      ) as HTMLElement;
      
      if (!tabElement) return;
      
      // Calculate position
      const tabRect = tabElement.getBoundingClientRect();
      const listRect = enhancedComponent.tabsListElement.getBoundingClientRect();
      
      const left = tabElement.offsetLeft;
      const width = tabRect.width;
      
      // Update indicator style
      enhancedComponent.indicatorElement.style.transition = animate ? 
        `transform ${ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)` : 'none';
      enhancedComponent.indicatorElement.style.transform = `translateX(${left}px)`;
      enhancedComponent.indicatorElement.style.width = `${width}px`;
      
      // Scroll into view if needed
      if (enhancedComponent.element.classList.contains(`${component.getClass('tabs')}--scrollable`)) {
        const scrollLeft = enhancedComponent.tabsListElement.scrollLeft;
        const listWidth = listRect.width;
        
        if (left < scrollLeft) {
          enhancedComponent.tabsListElement.scrollTo({
            left: left,
            behavior: animate ? 'smooth' : 'auto'
          });
        } else if (left + width > scrollLeft + listWidth) {
          enhancedComponent.tabsListElement.scrollTo({
            left: left + width - listWidth,
            behavior: animate ? 'smooth' : 'auto'
          });
        }
      }
    };
    
    // Function to update tab elements' states
    const updateTabStates = () => {
      // Update aria-selected for all tabs
      const tabElements = enhancedComponent.tabsListElement.querySelectorAll('[role="tab"]');
      
      tabElements.forEach((tab: Element) => {
        const index = parseInt(tab.getAttribute('data-tab-index') || '-1', 10);
        tab.setAttribute('aria-selected', index === activeIndex ? 'true' : 'false');
        
        if (index === activeIndex) {
          tab.classList.add(`${component.getClass('tabs')}__tab--active`);
        } else {
          tab.classList.remove(`${component.getClass('tabs')}__tab--active`);
        }
      });
    };
    
    // Create the API object
    const api: TabsComponent = {
      ...enhancedComponent as any,
      element: enhancedComponent.element,
      tabsListElement: enhancedComponent.tabsListElement,
      indicatorElement: enhancedComponent.indicatorElement,
      disabled,
      lifecycle,
      
      getClass: component.getClass,
      
      enable() {
        disabled.enable();
        this.element.removeAttribute('aria-disabled');
        return this;
      },
      
      disable() {
        disabled.disable();
        this.element.setAttribute('aria-disabled', 'true');
        return this;
      },
      
      getItems() {
        return [...items];
      },
      
      setItems(newItems) {
        // Clear existing tabs
        while (this.tabsListElement.firstChild) {
          this.tabsListElement.removeChild(this.tabsListElement.firstChild);
        }
        
        // Store items and create elements
        items = [...newItems];
        
        // Create tab elements
        items.forEach((item, index) => {
          const tabElement = createTabElement(item, index);
          this.tabsListElement.appendChild(tabElement);
        });
        
        // Reset active tab if needed
        if (activeIndex >= items.length) {
          activeIndex = items.length > 0 ? 0 : -1;
        }
        
        // Update UI
        updateTabStates();
        updateIndicator(false);
        
        return this;
      },
      
      addTab(item, index) {
        const newItems = [...items];
        
        if (index !== undefined && index >= 0 && index <= items.length) {
          // Insert at specific position
          newItems.splice(index, 0, item);
          
          // Adjust active index if needed
          if (activeIndex >= index) {
            activeIndex++;
          }
        } else {
          // Append to end
          newItems.push(item);
        }
        
        return this.setItems(newItems);
      },
      
      removeTab(idOrIndex) {
        if (items.length === 0) return this;
        
        let index = -1;
        
        if (typeof idOrIndex === 'number') {
          index = idOrIndex;
        } else {
          // Find by ID
          index = items.findIndex(item => item.id === idOrIndex);
        }
        
        if (index < 0 || index >= items.length) return this;
        
        const newItems = items.filter((_, i) => i !== index);
        
        // Handle active index adjustment
        let newActiveIndex = activeIndex;
        
        if (activeIndex === index) {
          // Removed active tab, select a new one
          if (newItems.length > 0) {
            newActiveIndex = Math.min(activeIndex, newItems.length - 1);
          } else {
            newActiveIndex = -1;
          }
        } else if (activeIndex > index) {
          // Active tab is after removed tab, adjust index
          newActiveIndex--;
        }
        
        // Update items
        items = newItems;
        
        // Rebuild the tabs
        this.setItems(newItems);
        
        // Set the correct active tab
        if (newActiveIndex >= 0) {
          this.setActiveTab(newActiveIndex);
        }
        
        return this;
      },
      
      getActiveTab() {
        return activeIndex >= 0 && activeIndex < items.length ? items[activeIndex] : null;
      },
      
      getActiveIndex() {
        return activeIndex;
      },
      
      setActiveTab(index) {
        if (
          index < 0 || 
          index >= items.length || 
          items[index].disabled || 
          disabled.isDisabled() || 
          index === activeIndex
        ) {
          return this;
        }
        
        const previousIndex = activeIndex;
        const previousTab = this.getActiveTab();
        
        activeIndex = index;
        const currentTab = items[index];
        
        // Update DOM
        updateTabStates();
        updateIndicator();
        
        // Emit change event
        component.events.emit('change', {
          index,
          tab: currentTab,
          previousIndex,
          previousTab
        } as TabChangeEventData);
        
        return this;
      },
      
      setActiveTabById(id) {
        const index = items.findIndex(item => item.id === id);
        if (index >= 0) {
          this.setActiveTab(index);
        }
        return this;
      },
      
      destroy() {
        // Clean up event listeners
        const tabElements = enhancedComponent.tabsListElement.querySelectorAll('[role="tab"]');
        tabElements.forEach(tab => {
          tab.replaceWith(tab.cloneNode(true));
        });
        
        // Call lifecycle destroy
        lifecycle.destroy();
      },
      
      on(event, handler) {
        component.events.on(event, handler);
        return this;
      },
      
      off(event, handler) {
        component.events.off(event, handler);
        return this;
      }
    };
    
    // Set up keyboard navigation
    enhancedComponent.element.addEventListener('keydown', (e: KeyboardEvent) => {
      if (disabled.isDisabled() || !items.length) return;
      
      const key = e.key;
      let newIndex = activeIndex;
      
      switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
          // Move to next non-disabled tab
          for (let i = 1; i <= items.length; i++) {
            const index = (activeIndex + i) % items.length;
            if (!items[index].disabled) {
              newIndex = index;
              break;
            }
          }
          break;
          
        case 'ArrowLeft':
        case 'ArrowUp':
          // Move to previous non-disabled tab
          for (let i = 1; i <= items.length; i++) {
            const index = (activeIndex - i + items.length) % items.length;
            if (!items[index].disabled) {
              newIndex = index;
              break;
            }
          }
          break;
          
        case 'Home':
          // Move to first non-disabled tab
          for (let i = 0; i < items.length; i++) {
            if (!items[i].disabled) {
              newIndex = i;
              break;
            }
          }
          break;
          
        case 'End':
          // Move to last non-disabled tab
          for (let i = items.length - 1; i >= 0; i--) {
            if (!items[i].disabled) {
              newIndex = i;
              break;
            }
          }
          break;
          
        default:
          return;
      }
      
      if (newIndex !== activeIndex) {
        e.preventDefault();
        api.setActiveTab(newIndex);
        
        // Focus the tab
        const tabElement = enhancedComponent.tabsListElement.querySelector(
          `[data-tab-index="${newIndex}"]`
        ) as HTMLElement;
        
        if (tabElement) {
          tabElement.focus();
        }
      }
    });
    
    return api;
  };

export default withAPI;