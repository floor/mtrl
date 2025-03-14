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
 * Creates a divider component
 * 
 * @param config - Divider configuration options
 * @returns Divider component instance
 */
export const createDivider = (config: DividerConfig = {}): DividerComponent => {
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