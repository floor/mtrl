// src/core/compose/features/style.ts

import { ElementComponent } from '../component';

/**
 * Configuration for style feature
 */
export interface StyleConfig {
  variant?: string;
  size?: string;
  [key: string]: any;
}

/**
 * Adds style classes to a component based on configuration
 * 
 * @param config - Configuration object containing style information
 * @returns Function that enhances a component with style classes
 */
export const withStyle = <T extends StyleConfig>(config: T = {} as T) => 
  <C extends ElementComponent>(component: C): C => {
    if (config.variant) {
      component.element.classList.add(`${component.getClass('button')}--${config.variant}`);
    }

    if (config.size) {
      component.element.classList.add(`${component.getClass('button')}--${config.size}`);
    }

    return component;
  };