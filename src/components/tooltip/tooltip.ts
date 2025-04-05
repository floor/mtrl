// src/components/tooltip/tooltip.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withLifecycle } from '../../core/compose/features';
import { withAPI } from './api';
import { TooltipConfig } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a unique ID for the tooltip
 * @returns {string} Unique ID
 */
const createTooltipId = (): string => {
  return `${PREFIX}-tooltip-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Creates a new Tooltip component
 * 
 * A Tooltip component provides contextual text information when a user hovers or focuses
 * on an element. It can be positioned in various ways around the target element and
 * supports customizable appearance and behavior.
 * 
 * @param {TooltipConfig} config - Tooltip configuration object
 * @returns {TooltipComponent} Tooltip component instance
 * 
 * @example
 * ```typescript
 * // Create a basic tooltip for a button
 * const button = document.getElementById('info-button');
 * const tooltip = fTooltip({
 *   text: 'Additional information',
 *   target: button,
 *   position: 'top'
 * });
 * 
 * // Create a tooltip with custom configuration
 * const tooltip = fTooltip({
 *   text: 'Click to save changes',
 *   position: 'bottom',
 *   showDelay: 500,
 *   variant: 'large'
 * });
 * 
 * // Manually set target and control visibility
 * tooltip.setTarget(document.getElementById('save-button'));
 * tooltip.show();
 * ```
 */
const fTooltip = (config: TooltipConfig = {}) => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create the tooltip element
    const tooltip = pipe(
      createBase,
      withElement(getElementConfig(baseConfig)),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);
    
    // Generate a unique ID
    tooltip.element.id = createTooltipId();
    
    // Set target if provided
    if (baseConfig.target) {
      tooltip.setTarget(baseConfig.target);
    }
    
    // Set text if provided
    if (baseConfig.text) {
      tooltip.setText(baseConfig.text);
    }
    
    // Show tooltip if initially visible
    if (baseConfig.visible) {
      tooltip.show(true);
    }

    return tooltip;
  } catch (error) {
    console.error('Tooltip creation error:', error);
    throw new Error(`Failed to create tooltip: ${(error as Error).message}`);
  }
};

export default fTooltip;