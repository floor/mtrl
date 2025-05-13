/**
 * Utility functions for type checking component capabilities
 */

import { ElementComponent } from '../component';

/**
 * Interface for components with lifecycle
 */
export interface ComponentWithLifecycle extends ElementComponent {
  lifecycle: {
    destroy: () => void;
    [key: string]: any;
  };
}

/**
 * Interface for components with emit method
 */
export interface ComponentWithEmit extends ElementComponent {
  emit: (event: string, data: any) => any;
}

/**
 * Type guard to check if component has lifecycle
 */
export function hasLifecycle(component: any): component is ComponentWithLifecycle {
  return 'lifecycle' in component && 
         component.lifecycle && 
         typeof component.lifecycle === 'object' &&
         'destroy' in component.lifecycle &&
         typeof component.lifecycle.destroy === 'function';
}

/**
 * Type guard to check if component has emit method
 */
export function hasEmit(component: any): component is ComponentWithEmit {
  return 'emit' in component && typeof component.emit === 'function';
} 