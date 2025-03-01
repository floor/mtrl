// src/components/list/api.ts
import { BaseComponent, ListComponent, ListItemConfig } from './types';

/**
 * API options interface
 */
interface ApiOptions {
  disabled: {
    enable: () => any;
    disable: () => any;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Enhances list component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: BaseComponent): ListComponent => ({
    ...component as any,
    element: component.element,
    items: component.items as Map<string, any>,
    selectedItems: component.selectedItems as Set<string>,

    // Selection management
    getSelected(): string[] {
      return component.getSelected?.() || [];
    },
    
    setSelected(ids: string[]): void {
      component.setSelected?.(ids);
    },

    // Item management
    addItem(itemConfig: ListItemConfig): void {
      component.addItem?.(itemConfig);
    },
    
    removeItem(id: string): void {
      component.removeItem?.(id);
    },

    // Event handling
    on(event: string, handler: Function): ListComponent {
      component.on?.(event, handler);
      return this;
    },
    
    off(event: string, handler: Function): ListComponent {
      component.off?.(event, handler);
      return this;
    },

    // State management
    enable(): ListComponent {
      disabled.enable();
      return this;
    },
    
    disable(): ListComponent {
      disabled.disable();
      return this;
    },
    
    destroy(): void {
      lifecycle.destroy();
    }
  });