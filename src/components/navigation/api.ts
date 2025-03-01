// src/components/navigation/api.ts
import { 
  BaseComponent, 
  NavigationComponent, 
  ApiOptions, 
  NavItemConfig,
  NavItemData
} from './types';

/**
 * Enhances navigation component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: BaseComponent): NavigationComponent => ({
    ...component as any,
    element: component.element,
    items: component.items as Map<string, NavItemData>,

    // Item management
    addItem(config: NavItemConfig): NavigationComponent {
      component.addItem?.(config);
      return this;
    },
    
    removeItem(id: string): NavigationComponent {
      component.removeItem?.(id);
      return this;
    },
    
    getItem(id: string): NavItemData | undefined {
      return component.getItem?.(id);
    },
    
    getAllItems(): NavItemData[] {
      return component.getAllItems?.() || [];
    },
    
    getItemPath(id: string): string[] {
      return component.getItemPath?.(id) || [];
    },

    // Active state management
    setActive(id: string): NavigationComponent {
      component.setActive?.(id);
      return this;
    },
    
    getActive(): NavItemData | null {
      return component.getActive?.() || null;
    },

    // Event handling
    on(event: string, handler: Function): NavigationComponent {
      component.on?.(event, handler);
      return this;
    },
    
    off(event: string, handler: Function): NavigationComponent {
      component.off?.(event, handler);
      return this;
    },

    // State management
    enable(): NavigationComponent {
      disabled.enable();
      return this;
    },
    
    disable(): NavigationComponent {
      disabled.disable();
      return this;
    },
    
    destroy(): void {
      lifecycle.destroy();
    }
  });