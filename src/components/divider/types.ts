// src/components/divider/types.ts
import { BaseComponent, ElementComponent } from '../../core/compose';

/**
 * Divider component interface
 */
export interface DividerComponent extends BaseComponent, ElementComponent {
  /**
   * Gets current orientation
   * @returns Current orientation
   */
  getOrientation: () => 'horizontal' | 'vertical';
  
  /**
   * Sets orientation of the divider
   * @param orientation - New orientation
   * @returns DividerComponent instance for chaining
   */
  setOrientation: (orientation: 'horizontal' | 'vertical') => DividerComponent;
  
  /**
   * Gets current variant
   * @returns Current variant
   */
  getVariant: () => 'full-width' | 'inset' | 'middle-inset';
  
  /**
   * Sets variant of the divider
   * @param variant - New variant
   * @returns DividerComponent instance for chaining
   */
  setVariant: (variant: 'full-width' | 'inset' | 'middle-inset') => DividerComponent;
  
  /**
   * Sets custom inset values
   * @param insetStart - Start inset value
   * @param insetEnd - End inset value
   * @returns DividerComponent instance for chaining
   */
  setInset: (insetStart?: number, insetEnd?: number) => DividerComponent;
  
  /**
   * Sets thickness of the divider
   * @param thickness - Thickness in pixels
   * @returns DividerComponent instance for chaining
   */
  setThickness: (thickness: number) => DividerComponent;
  
  /**
   * Sets custom color for the divider
   * @param color - CSS color value
   * @returns DividerComponent instance for chaining
   */
  setColor: (color: string) => DividerComponent;
}