// src/components/button/button.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withText,
  withIcon,
  withVariant,
  withRipple,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withAPI } from './api';
import { ButtonConfig } from './types';
import { BUTTON_VARIANTS } from './constants';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Button component
 * @param {ButtonConfig} config - Button configuration object
 * @returns {ButtonComponent} Button component instance
 */
const createButton = (config: ButtonConfig = {}) => {
  const baseConfig = createBaseConfig(config);

  try {
    const button = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withText(baseConfig),
      withIcon(baseConfig),
      withDisabled(baseConfig),
      withRipple(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return button;
  } catch (error) {
    console.error('Button creation error:', error);
    throw new Error(`Failed to create button: ${(error as Error).message}`);
  }
};

export default createButton;