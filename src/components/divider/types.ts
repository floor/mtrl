// src/components/divider/types.ts
import { BaseComponent, ElementComponent } from '../../core/compose';

/**
 * Divider component interface
 * 
 * Represents a Material Design 3 divider that separates content into distinct sections.
 * Provides methods for configuring the appearance, orientation, and inset behavior.
 * 
 * @category Components
 */
export interface DividerComponent extends BaseComponent, ElementComponent {
  /**
   * Gets current orientation of the divider
   * 
   * @returns Current orientation ('horizontal' or 'vertical')
   * 
   * @example
   * ```typescript
   * const divider = createDivider();
   * const orientation = divider.getOrientation(); // Returns 'horizontal' by default
   * ```
   */
  getOrientation: () => 'horizontal' | 'vertical';
  
  /**
   * Sets orientation of the divider
   * 
   * Changes the divider's orientation between horizontal (default) and vertical.
   * This affects the divider's positioning, dimension constraints, and how insets are applied.
   * 
   * @param orientation - New orientation ('horizontal' or 'vertical')
   * @returns DividerComponent instance for chaining
   * 
   * @example
   * ```typescript
   * // Change a divider from horizontal to vertical
   * divider.setOrientation('vertical');
   * ```
   */
  setOrientation: (orientation: 'horizontal' | 'vertical') => DividerComponent;
  
  /**
   * Gets current variant of the divider
   * 
   * @returns Current variant ('full-width', 'inset', or 'middle-inset')
   * 
   * @example
   * ```typescript
   * const variant = divider.getVariant(); // Returns 'full-width' by default
   * ```
   */
  getVariant: () => 'full-width' | 'inset' | 'middle-inset';
  
  /**
   * Sets variant of the divider
   * 
   * Changes how the divider is inset within its container:
   * - 'full-width': Spans the entire width/height of the container (default)
   * - 'inset': Adds space at the start (left for horizontal, top for vertical)
   * - 'middle-inset': Adds space at both start and end
   * 
   * @param variant - New variant
   * @returns DividerComponent instance for chaining
   * 
   * @example
   * ```typescript
   * // Create a list divider with left inset
   * divider.setVariant('inset');
   * 
   * // Create a divider with space on both sides
   * divider.setVariant('middle-inset');
   * ```
   */
  setVariant: (variant: 'full-width' | 'inset' | 'middle-inset') => DividerComponent;
  
  /**
   * Sets custom inset values for the divider
   * 
   * Allows fine-grained control over inset spacing, overriding the default values
   * applied by the variant. Only applies if variant is 'inset' or 'middle-inset'.
   * 
   * @param insetStart - Start inset value in pixels (left for horizontal, top for vertical)
   * @param insetEnd - End inset value in pixels (right for horizontal, bottom for vertical)
   * @returns DividerComponent instance for chaining
   * 
   * @example
   * ```typescript
   * // Create a divider with custom insets
   * const divider = createDivider({ variant: 'inset' });
   * divider.setInset(24, 8); // 24px from start, 8px from end
   * ```
   */
  setInset: (insetStart?: number, insetEnd?: number) => DividerComponent;
  
  /**
   * Sets thickness of the divider
   * 
   * Changes the divider's thickness (height for horizontal, width for vertical).
   * The default thickness is 1px, following Material Design 3 guidelines.
   * 
   * @param thickness - Thickness in pixels
   * @returns DividerComponent instance for chaining
   * 
   * @example
   * ```typescript
   * // Create a bold divider
   * divider.setThickness(2);
   * ```
   */
  setThickness: (thickness: number) => DividerComponent;
  
  /**
   * Sets custom color for the divider
   * 
   * By default, dividers use the 'outline-variant' color from the theme.
   * This method allows setting a custom color via any valid CSS color value.
   * 
   * @param color - CSS color value (hex, rgb, rgba, hsl, etc.)
   * @returns DividerComponent instance for chaining
   * 
   * @example
   * ```typescript
   * // Create a blue divider
   * divider.setColor('#2196F3');
   * 
   * // Create a semi-transparent divider
   * divider.setColor('rgba(0, 0, 0, 0.12)');
   * ```
   */
  setColor: (color: string) => DividerComponent;
}