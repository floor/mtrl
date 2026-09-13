import { createComponentConfig } from '../../core/config/component';
import { NAVIGATION_RAIL_DEFAULTS as defaults, NAVIGATION_RAIL_ICONS as icons } from './constants';
import type { NavigationRailConfig } from './types';
export const createBaseConfig = (config: NavigationRailConfig): NavigationRailConfig => {
    const result = createComponentConfig({
        expanded: defaults.EXPANDED, expandedWidth: defaults.EXPANDED_WIDTH,
        showToggle: defaults.SHOW_TOGGLE, ripple: true, items: [],
        expandLabel: 'Expand navigation', collapseLabel: 'Collapse navigation',
        expandIcon: icons.EXPAND, collapseIcon: icons.COLLAPSE,
    } as NavigationRailConfig, config, 'navigation-rail') as NavigationRailConfig;
    const width = result.expandedWidth;
    result.expandedWidth = Number.isFinite(width)
        ? Math.min(defaults.MAX_EXPANDED_WIDTH, Math.max(defaults.MIN_EXPANDED_WIDTH, width!))
        : defaults.EXPANDED_WIDTH;
    return result;
};
