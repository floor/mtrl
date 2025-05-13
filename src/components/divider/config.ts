// src/components/divider/config.ts
import { createComponentConfig } from '../../core/config/component';

/**
 * Configuration options for divider components
 * 
 * Controls the appearance, orientation, and behavior of Material Design 3 dividers.
 * 
 * @category Components
 */
export interface DividerConfig {
  /**
   * CSS class prefix (defaults to 'mtrl')
   * 
   * Used for generating BEM-style class names for the component
   */
  prefix?: string;
  
  /**
   * CSS class to add to the divider
   * 
   * Additional classes for custom styling needs.
   * Can be a single class string or an array of class strings.
   * 
   * @example 'my-custom-divider' or ['my-custom-divider', 'special-spacing']
   */
  class?: string | string[];
  
  /**
   * Orientation of the divider
   * 
   * - 'horizontal': Creates a horizontal line (default)
   * - 'vertical': Creates a vertical line
   * 
   * @default 'horizontal'
   * 
   * @example
   * ```typescript
   * // Create a vertical divider
   * createDivider({ orientation: 'vertical' })
   * ```
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Variant of the divider
   * 
   * Controls how the divider is inset within its container:
   * - 'full-width': Spans the entire width/height (default)
   * - 'inset': Adds space at the start (left for horizontal, top for vertical)
   * - 'middle-inset': Adds space at both start and end
   * 
   * Most commonly used in lists to align dividers with text content.
   * 
   * @default 'full-width'
   * 
   * @example
   * ```typescript
   * // Create a list divider with left inset
   * createDivider({ variant: 'inset' })
   * ```
   */
  variant?: 'full-width' | 'inset' | 'middle-inset';
  
  /**
   * Custom inset value (left margin for horizontal, top margin for vertical)
   * 
   * Overrides the default inset spacing at the start of the divider.
   * Only applies when variant is 'inset' or 'middle-inset'.
   * 
   * @default 16 for 'inset' and 'middle-inset' variants
   * 
   * @example
   * ```typescript
   * // Create a divider with 24px left inset
   * createDivider({ variant: 'inset', insetStart: 24 })
   * ```
   */
  insetStart?: number;
  
  /**
   * Custom inset end value (right margin for horizontal, bottom margin for vertical)
   * 
   * Overrides the default inset spacing at the end of the divider.
   * Only applies when variant is 'middle-inset'.
   * 
   * @default 0 for 'inset', 16 for 'middle-inset'
   * 
   * @example
   * ```typescript
   * // Create a divider with custom insets on both sides
   * createDivider({ variant: 'middle-inset', insetStart: 16, insetEnd: 24 })
   * ```
   */
  insetEnd?: number;
  
  /**
   * Color of the divider
   * 
   * Sets a custom color for the divider. Accepts any valid CSS color value.
   * By default, dividers use the 'outline-variant' color from the Material theme.
   * 
   * @example
   * ```typescript
   * // Create a blue divider
   * createDivider({ color: '#2196F3' })
   * 
   * // Create a divider with a semi-transparent color
   * createDivider({ color: 'rgba(0, 0, 0, 0.12)' })
   * ```
   */
  color?: string;
  
  /**
   * Thickness of the divider in pixels
   * 
   * Controls the thickness (height for horizontal, width for vertical) of the divider.
   * Material Design 3 typically uses 1px thickness for dividers.
   * 
   * @default 1
   * 
   * @example
   * ```typescript
   * // Create a bold divider
   * createDivider({ thickness: 2 })
   * ```
   */
  thickness?: number;
  
  /**
   * Used internally for component composition
   * 
   * @internal
   */
  componentName?: string;
}

/**
 * Default configuration for dividers
 * 
 * @internal
 */
export const defaultConfig: Partial<DividerConfig> = {
  orientation: 'horizontal',
  variant: 'full-width',
  thickness: 1
};

/**
 * Creates a base configuration object for divider
 * 
 * Merges user-provided configuration with default values and ensures
 * all required properties have values.
 * 
 * @param config - User provided configuration
 * @returns Complete configuration with defaults applied
 * 
 * @internal
 */
export const createBaseConfig = (config: DividerConfig = {}): DividerConfig => {
  return createComponentConfig(
    defaultConfig as DividerConfig,
    config,
    'divider'
  );
};