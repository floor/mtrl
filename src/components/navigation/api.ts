// src/components/navigation/api.ts
import { NavigationComponent, NavItemConfig, NavItemData, BaseComponent, ApiOptions } from './types';

/**
 * Enhances a component with navigation-specific API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI = (options: ApiOptions) => 
  (component: BaseComponent): NavigationComponent => {
    const navComponent = {
      ...component,
      element: component.element,
      items: component.items || new Map(),
      
      // Basic item operations
      addItem(config: NavItemConfig): NavigationComponent {
        if (typeof component.addItem === 'function') {
          component.addItem(config);
        } else {
          console.warn('addItem method not available');
        }
        return this;
      },
      
      removeItem(id: string): NavigationComponent {
        if (typeof component.removeItem === 'function') {
          component.removeItem(id);
        } else {
          console.warn('removeItem method not available');
        }
        return this;
      },
      
      getItem(id: string): NavItemData | undefined {
        if (typeof component.getItem === 'function') {
          return component.getItem(id);
        }
        return this.items.get(id);
      },
      
      getAllItems(): NavItemData[] {
        if (typeof component.getAllItems === 'function') {
          return component.getAllItems();
        }
        return Array.from(this.items.values());
      },
      
      // Path and active item management
      getActive(): NavItemData | null {
        if (typeof component.getActive === 'function') {
          return component.getActive();
        }
        return null;
      },
      
      getItemPath(id: string): string[] {
        if (typeof component.getItemPath === 'function') {
          return component.getItemPath(id);
        }
        return [];
      },
      
      setActive(id: string): NavigationComponent {
        // Use the controller if available for consistent handling
        if (typeof component.handleItemClick === 'function') {
          component.handleItemClick(id);
        } else if (typeof component.setActive === 'function') {
          component.setActive(id);
        } else {
          // Fallback if setActive is not available
          const item = this.items.get(id);
          if (item && item.element) {
            // Emit a change event to propagate the state change
            if (component.emit) {
              component.emit('change', {
                id,
                item,
                source: 'api'
              });
            }
          }
        }
        return this;
      },
      
      // Navigation state management
      enable(): NavigationComponent {
        if (options.disabled.enable) {
          options.disabled.enable();
        }
        return this;
      },
      
      disable(): NavigationComponent {
        if (options.disabled.disable) {
          options.disabled.disable();
        }
        return this;
      },
      
      expand(): NavigationComponent {
        this.element.classList.remove(`${this.element.className.split(' ')[0]}--hidden`);
        this.element.setAttribute('aria-hidden', 'false');
        
        if (component.emit) {
          component.emit('expanded', { source: 'api' });
        }
        return this;
      },
      
      collapse(): NavigationComponent {
        this.element.classList.add(`${this.element.className.split(' ')[0]}--hidden`);
        this.element.setAttribute('aria-hidden', 'true');
        
        if (component.emit) {
          component.emit('collapsed', { source: 'api' });
        }
        return this;
      },
      
      isExpanded(): boolean {
        return !this.element.classList.contains(`${this.element.className.split(' ')[0]}--hidden`);
      },
      
      toggle(): NavigationComponent {
        return this.isExpanded() ? this.collapse() : this.expand();
      },
      
      // Event handling (delegate to component's event system)
      on(event: string, handler: Function): NavigationComponent {
        if (typeof component.on === 'function') {
          console.log(`API wrapper registering handler for ${event} - WILL forward to inner component`);
          component.on(event, (...args) => {
            console.log(`Inner component event ${event} forwarded to outer handler`);
            handler(...args);
          });
        } else {
          console.warn(`Unable to register handler for ${event} (no event system available)`);
        }
        return this;
      },
      
      off(event: string, handler: Function): NavigationComponent {
        if (typeof component.off === 'function') {
          component.off(event, handler);
        }
        return this;
      },
      
      // Destruction
      destroy(): void {
        if (options.lifecycle.destroy) {
          options.lifecycle.destroy();
        }
      }
    };
    
    // Return the enhanced component
    return navComponent;
  };

export default withAPI;