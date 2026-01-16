// src/components/button-group/index.ts

/**
 * Button Group component exports
 *
 * The Button Group component provides a container for grouping related action buttons.
 * Unlike Segmented Buttons (used for selection), Button Groups are for grouping
 * related actions where each button triggers an independent action.
 *
 * @packageDocumentation
 */

// Export main component
export { default as createButtonGroup } from './button-group';
export { default } from './button-group';

// Export types
export type {
  ButtonGroupConfig,
  ButtonGroupComponent,
  ButtonGroupItemConfig,
  ButtonGroupEvent,
  ButtonGroupEventType,
  ButtonGroupVariant,
  ButtonGroupOrientation,
  ButtonGroupDensity
} from './types';

// Export constants
export {
  BUTTON_GROUP_VARIANTS,
  BUTTON_GROUP_ORIENTATIONS,
  BUTTON_GROUP_DENSITY,
  BUTTON_GROUP_EVENTS,
  BUTTON_GROUP_DEFAULTS,
  BUTTON_GROUP_CLASSES,
  BUTTON_GROUP_HEIGHTS,
  BUTTON_GROUP_RADII
} from './constants';
