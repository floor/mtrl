// src/components/card/index.ts
import defaultCreateCard from './card';

/**
 * Card Component Module
 * 
 * This module exports the Card components and related utilities following
 * Material Design 3 specifications.
 */

// Add default export 
export default defaultCreateCard;

// Export components from content file where they are now merged
export { 
  createCardContent,
  createCardHeader, 
  createCardActions,
  createCardMedia
} from './content';

// Other exports
export { withLoading, withExpandable, withSwipeable } from './features';
export {
  CardVariant,
  CardElevation,
  CardSchema,
  CardHeaderConfig,
  CardContentConfig,
  CardActionsConfig,
  CardMediaConfig,
  CardAriaAttributes,
  CardComponent
} from './types';
export { CARD_VARIANTS, CARD_ELEVATIONS, CARD_WIDTHS, CARD_CORNER_RADIUS } from './constants';