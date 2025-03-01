// src/components/navigation/navigation.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withDisabled,
  withLifecycle,
  withVariant,
  withPosition // Import core position feature
} from '../../core/compose/features';
import { withAPI } from './api';
import { withNavItems } from './features/items';
import { NavigationConfig, NavigationComponent } from './types';
import { 
  createBaseConfig, 
  getElementConfig,
  getApiConfig
} from './config';

/**
 * Creates a new Navigation component
 * @param {NavigationConfig} config - Navigation configuration
 * @returns {NavigationComponent} Navigation component instance
 */
const createNavigation = (config: NavigationConfig = {}): NavigationComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const navigation = pipe(
      createBase,
      // First add events system
      withEvents(),
      // Then add the element and other features
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withPosition(baseConfig),
      withNavItems(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return navigation as NavigationComponent;
  } catch (error) {
    console.error('Navigation creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create navigation: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createNavigation;