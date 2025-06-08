// src/core/compose/features/variant.ts

import { ElementComponent } from "../component";

/**
 * Configuration for variant feature
 */
export interface VariantConfig {
  variant?: string;
  prefix?: string;
  componentName?: string;
  [key: string]: any;
}

/**
 * Adds a variant class to a component
 *
 * @param config - Configuration object containing variant information
 * @returns Function that enhances a component with the variant class
 */
export const withVariant =
  <T extends VariantConfig>(config: T) =>
  <C extends ElementComponent>(component: C): C => {
    if (config.variant && component.element) {
      // Use config.componentName since we know it's there
      const className = `${config.prefix}-${config.componentName}--${config.variant}`;
      component.element.classList.add(className);
    }
    return component;
  };
