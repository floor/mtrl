// src/components/badge/badge.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withLifecycle
} from '../../core/compose/features';
import { 
  withVisibility,
  withVariant,
  withColor, 
  withPosition,
  withMax,
  withAttachment
} from './features';
import { withAPI } from './api';
import { BadgeConfig, BadgeComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Badge component following Material Design 3 guidelines.
 * 
 * The Badge component displays a small circle or numerical indicator to 
 * draw attention to items requiring user attention, like notifications 
 * or counts. Badges can be attached to any element.
 * 
 * @param {BadgeConfig} config - Badge configuration object
 * @returns {BadgeComponent} Badge component instance with methods for
 *  managing the badge appearance, content, and visibility
 * 
 * @throws {Error} Throws an error if badge creation fails
 * 
 * @category Components
 * 
 * @example
 * // Create a small dot badge (notification indicator)
 * const notificationBadge = fBadge({ 
 *   variant: 'small',
 *   color: 'error',
 *   target: document.querySelector('.icon-button')
 * });
 * 
 * @example
 * // Create a large badge with a count (numbered indicator)
 * const countBadge = fBadge({
 *   variant: 'large',
 *   label: 5,
 *   color: 'primary',
 *   target: document.querySelector('.notification-icon')
 * });
 * 
 * @example
 * // Create a badge with a maximum value
 * const messagesBadge = fBadge({
 *   variant: 'large',
 *   label: 1250,
 *   max: 999,  // Will display "999+"
 *   color: 'info',
 *   position: 'bottom-right'
 * });
 * 
 * @example
 * // Control badge visibility programmatically
 * const toggleBadge = fBadge({
 *   variant: 'small',
 *   color: 'success',
 *   target: document.querySelector('.toggle-button')
 * });
 * 
 * // Toggle badge visibility
 * function toggleNotification() {
 *   if (toggleBadge.isVisible()) {
 *     toggleBadge.hide();
 *   } else {
 *     toggleBadge.show();
 *   }
 * }
 */
const fBadge = (config: BadgeConfig = {}): BadgeComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Compose the badge component from multiple feature enhancers
    const badge = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withColor(baseConfig),
      withPosition(baseConfig),
      withMax(baseConfig),
      withVisibility(),
      withAttachment(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return badge;
  } catch (error) {
    console.error('Badge creation error:', error);
    throw new Error(`Failed to create badge: ${(error as Error).message}`);
  }
};

export default fBadge;