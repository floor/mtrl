// src/components/switch/index.ts
export { default } from './switch'

// Export constants
export { 
  SWITCH_LABEL_POSITIONS,
  SWITCH_STATES,
  SWITCH_EVENTS,
  SWITCH_DEFAULTS,
  SWITCH_CLASSES
} from './constants'

// Export types
export type { 
  SwitchConfig, 
  SwitchComponent,
  SwitchEvents,
  SwitchChangePayload
} from './types'

// Export features
export {
  /** @deprecated Internal, no replacement: removed from mtrl/components/switch in `material` 3.0.0 (FLO-381). */
  withSupportingText,
} from './features';
export type {
  /** @deprecated Internal, no replacement: removed from mtrl/components/switch in `material` 3.0.0 (FLO-381). */
  SupportingTextComponent,
} from './features';
