// src/core/compose/features/ripple.ts

import { createRipple, RippleController, RippleConfig } from '../../build/ripple';
import { BaseComponent, ElementComponent } from '../component';
import { LifecycleComponent } from './lifecycle';

/**
 * Configuration for ripple feature
 */
export interface RippleFeatureConfig {
  ripple?: boolean;
  rippleConfig?: RippleConfig;
  [key: string]: any;
}

/**
 * Component with ripple capabilities
 */
export interface RippleComponent extends BaseComponent {
  ripple: RippleController;
}

/**
 * Adds ripple effect functionality to a component
 * 
 * @param config - Configuration object
 * @returns Function that enhances a component with ripple effect
 */
export const withRipple = <T extends RippleFeatureConfig>(config: T) => 
  <C extends ElementComponent & Partial<LifecycleComponent>>(component: C): C & RippleComponent => {
    if (!config.ripple) return component as C & RippleComponent;

    const rippleInstance = createRipple(config.rippleConfig);

    // If component has lifecycle methods, integrate ripple with them
    if (component.lifecycle) {
      const originalMount = component.lifecycle.mount;
      const originalDestroy = component.lifecycle.destroy;

      component.lifecycle.mount = () => {
        originalMount.call(component.lifecycle);
        rippleInstance.mount(component.element);
      };

      component.lifecycle.destroy = () => {
        rippleInstance.unmount(component.element);
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      ripple: rippleInstance
    };
  };