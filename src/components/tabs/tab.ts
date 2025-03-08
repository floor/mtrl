// src/components/tabs/tab.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withText,
  withIcon,
  withVariant,
  withRipple,
  withDisabled,
  withLifecycle,
  withBadge
} from '../../core/compose/features';
import { withTabAPI } from './tab-api';
import { TabConfig, TabComponent } from './types';
import { TAB_STATES } from './constants';
import { createTabConfig, getTabElementConfig, getTabApiConfig } from './config';

/**
 * Creates a new Tab component
 * @param {TabConfig} config - Tab configuration object
 * @returns {TabComponent} Tab component instance
 * @internal This is an internal helper used by the Tabs component
 */
export const createTab = (config: TabConfig = {}): TabComponent => {
  const baseConfig = createTabConfig(config);

  try {
    // Add active state if specified in config
    const withActiveState = (component) => {
      if (baseConfig.state === TAB_STATES.ACTIVE) {
        component.element.classList.add(`${component.getClass('tab')}--${TAB_STATES.ACTIVE}`);
      }
      return component;
    };

    const tab = pipe(
      createBase,
      withEvents(),
      withElement(getTabElementConfig(baseConfig)),
      withVariant(baseConfig),
      withText(baseConfig),
      withIcon(baseConfig),
      withBadge(baseConfig),
      withActiveState,
      withDisabled(baseConfig),
      withRipple(baseConfig),
      withLifecycle(),
      comp => withTabAPI(getTabApiConfig(comp))(comp)
    )(baseConfig);

    // Initialize layout style based on content
    tab.updateLayoutStyle();

    return tab;
  } catch (error) {
    console.error('Tab creation error:', error);
    throw new Error(`Failed to create tab: ${(error as Error).message}`);
  }
};