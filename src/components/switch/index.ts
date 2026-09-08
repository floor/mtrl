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
  SwitchComponent
} from './types'

// Export features
export { withSupportingText } from './features';
export type { SupportingTextComponent } from './features'
