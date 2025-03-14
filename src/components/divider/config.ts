// src/components/divider/config.ts
import { createComponentConfig } from '../../core/config/component-config';

/**
 * Configuration options for divider components
 */
export interface DividerConfig {
  /**
   * CSS class prefix (defaults to 'mtrl')
   */
  prefix?: string;
  
  /**
   * CSS class to add to the divider
   */
  class?: string;
  
  /**
   * Orientation of the divider ('horizontal' or 'vertical')
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Variant of the divider ('full-width' or 'inset')
   * @default 'full-width'
   */
  variant?: 'full-width' | 'inset' | 'middle-inset';
  
  /**
   * Custom inset value (left margin for horizontal, top margin for vertical)
   * @default 16 for 'inset', undefined for 'full-width'
   */
  insetStart?: number;
  
  /**
   * Custom inset end value (right margin for horizontal, bottom margin for vertical)
   * @default 0 for 'inset', undefined for 'full-width'
   */
  insetEnd?: number;
  
  /**
   * Color of the divider (uses 'outline-variant' from theme by default)
   */
  color?: string;
  
  /**
   * Thickness of the divider in pixels
   * @default 1
   */
  thickness?: number;
  
  /**
   * Used internally for component composition
   * @private
   */
  componentName?: string;
}

/**
 * Default configuration for dividers
 */
export const defaultConfig: Partial<DividerConfig> = {
  orientation: 'horizontal',
  variant: 'full-width',
  thickness: 1
};

/**
 * Creates a base configuration object for divider
 * 
 * @param config - User provided configuration
 * @returns Complete configuration with defaults applied
 */
export const createBaseConfig = (config: DividerConfig = {}): DividerConfig => {
  return createComponentConfig(
    defaultConfig as DividerConfig,
    config,
    'divider'
  );
};