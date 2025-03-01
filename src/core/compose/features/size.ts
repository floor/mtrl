// src/core/compose/features/size.ts

import { BaseComponent, ElementComponent } from '../component';

/**
 * Configuration for size feature
 */
export interface SizeConfig {
  size?: string;
  prefix?: string;
  componentName?: string;
  [key: string]: any;
}

/**
 * Adds a size class to a component
 * 
 * @param config - Configuration object containing size information
 * @returns Function that enhances a component with the size class
 */
export const withSize = <T extends SizeConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C => {
    if (config.size && component.element) {
      // Use config.componentName since we know it's there
      const className = `${config.prefix}-${config.componentName}--${config.size}`;
      component.element.classList.add(className);
    }
    return component;
  };