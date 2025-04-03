// src/components/divider/divider.ts
import {
  createBase,
  withElement,
  pipe,
  withVariant
} from '../../core/compose';
import { PREFIX } from '../../core/config';
import { DividerConfig, createBaseConfig } from './config';
import { withOrientation, withInset, withStyle } from './features';
import { DividerComponent } from './types';

/**
 * Creates a new Divider component with the specified configuration.
 * 
 * Dividers are thin lines that separate content into distinct sections following
 * Material Design 3 guidelines. They can be horizontal or vertical, and offer
 * various customization options for inset, thickness, and color.
 * 
 * @param config - Divider configuration options
 * @returns Divider component instance with methods for managing appearance and behavior
 * 
 * @throws {Error} If divider creation fails due to invalid configuration
 * 
 * @category Components
 * 
 * @example
 * ```typescript
 * // Create a basic horizontal divider
 * const divider = fDivider();
 * container.appendChild(divider.element);
 * 
 * // Create a vertical divider with custom styling
 * const separator = fDivider({
 *   orientation: 'vertical',
 *   thickness: 2,
 *   color: '#2196F3',
 *   variant: 'middle-inset',
 *   insetStart: 8,
 *   insetEnd: 8
 * });
 * 
 * // Later, change the divider's appearance
 * divider.setColor('var(--md-sys-color-outline)');
 * divider.setThickness(1);
 * divider.setVariant('inset');
 * ```
 */
export const fDivider = (config: DividerConfig = {}): DividerComponent => {
  // Process configuration
  const processedConfig = createBaseConfig(config);
  
  // Create component through composition
  return pipe(
    createBase,
    withElement({
      tag: 'hr',
      componentName: 'divider',
      prefix: processedConfig.prefix || PREFIX,
      className: config.class
    }),
    withOrientation(processedConfig),
    withVariant(processedConfig),
    withInset(processedConfig),
    withStyle(processedConfig)
  )(processedConfig) as DividerComponent;
};