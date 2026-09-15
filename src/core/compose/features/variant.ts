// src/core/compose/features/variant.ts

import { ElementComponent } from "../component";

/**
 * Configuration for variant feature
 */
export interface VariantConfig {
  variant?: string;
  prefix?: string;
  componentName?: string;
}

/**
 * Adds a variant class to a component
 *
 * @param config - Configuration object containing variant information
 * @returns Function that enhances a component with the variant class
 */
export const withVariant =
  // `& object` lets a component config that shares no key with VariantConfig through.
  <T extends VariantConfig & object>(config: T) =>
  <C extends ElementComponent>(component: C): C => {
    if (config.variant && component.element) {
      // Use config.componentName since we know it's there
      const className = `${config.prefix}-${config.componentName}--${config.variant}`;
      component.element.classList.add(className);
    }
    return component;
  };
