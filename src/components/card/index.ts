// src/components/card/index.ts
export { default } from './card'
export { createCardContent } from './content'
export { createCardHeader } from './header'
export { createCardActions } from './actions'
export { createCardMedia } from './media'
export {
  CardVariant,
  CardElevation,
  CardSchema,
  CardHeaderConfig,
  CardContentConfig,
  CardActionsConfig,
  CardMediaConfig,
  CardComponent
} from './types'

// Export constants for backward compatibility
export { CARD_VARIANTS, CARD_ELEVATIONS, CARD_SCHEMA } from './constants'
