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
  withSize,
  withPosition,
  withMax,
  withAttachment
} from './features';
import { withAPI } from './api';
import { BadgeConfig, BadgeComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Badge component
 * @param {BadgeConfig} config - Badge configuration object
 * @returns {BadgeComponent} Badge component instance
 */
const createBadge = (config: BadgeConfig = {}): BadgeComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const badge = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withColor(baseConfig),
      withSize(baseConfig),
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

export default createBadge;