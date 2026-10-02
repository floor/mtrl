// src/core/compose/features/index.ts

/**
 * The composition features, at the import path `mtrl/core/compose/features`.
 *
 * @deprecated `material` 3.0.0, where this library continues, does not resolve this
 * path (FLO-414): import these names from `material/core/compose`, which exports them,
 * the README's `withLifecycle` among them. `mtrl/core/compose` exports them too, except
 * `withBadge`, `LabelManager` and the badge feature's `BadgeComponent` and
 * `BadgeConfig`; of those four, `material` 3.0.0 keeps `withBadge` and the two badge
 * types internal (for a badge, use `createBadge`) and exports `LabelManager`.
 * @packageDocumentation
 */

// Core features
export { withEvents } from './events';
export { withText } from './text';
export { withIcon } from './icon';
export { withVariant } from './variant';
export { withSize } from './size';
export { withPosition } from './position';
export { withRipple } from './ripple';
export { withInput } from './input';
export { withCheckable } from './checkable';
export { withStyle } from './style';
export { withTextInput } from './textinput';
export { withTextLabel } from './textlabel';
export { withTrack } from './track';
export { withEvents as withEnhancedEvents } from './withEvents';
export { withBadge } from './badge';
export { withThrottle } from './throttle';
export { withDebounce } from './debounce';

// State management features
export { withDisabled } from './disabled';
export { withLifecycle } from './lifecycle';

// Re-export interfaces for better developer experience
export type { EventComponent } from './events';
export type { TextComponent } from './text';
export type { IconComponent } from './icon';
export type { LifecycleComponent, Lifecycle } from './lifecycle';
export type { DisabledComponent, DisabledManager } from './disabled';
export type { RippleComponent } from './ripple';
export type { InputComponent } from './input';
export type { CheckableComponent, CheckableManager } from './checkable';
export type { TextInputComponent } from './textinput';
export type { LabelComponent, LabelManager } from './textlabel';
export type { TrackComponent } from './track';
export type { EnhancedEventComponent } from './withEvents';
export type { BadgeComponent, BadgeConfig } from './badge';
export type { ThrottleComponent, ThrottleConfig } from './throttle';
export type { DebounceComponent, DebounceConfig } from './debounce';