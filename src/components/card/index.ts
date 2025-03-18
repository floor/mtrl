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
export { 
  withLoading, 
  withExpandable, 
  withSwipeable, 
  withElevation 
} from './features';

export {
  CardVariant,
  CardElevationLevel,
  CardSchema,
  CardHeaderConfig,
  CardContentConfig,
  CardActionsConfig,
  CardMediaConfig,
  CardAriaAttributes,
  CardComponent
} from './types';

// Export card constants for backward compatibility
export const CARD_VARIANTS = {
  ELEVATED: 'elevated',
  FILLED: 'filled',
  OUTLINED: 'outlined'
} as const;

export const CARD_ELEVATIONS = {
  LEVEL0: 0,
  LEVEL1: 1,
  LEVEL2: 2,
  LEVEL4: 4
} as const;

// Additional constants
export const CARD_WIDTHS = {
  SMALL: '344px',
  MEDIUM: '480px',
  LARGE: '624px',
  FULL: '100%'
} as const;

export const CARD_CORNER_RADIUS = {
  SMALL: '8px',
  MEDIUM: '12px',
  LARGE: '16px'
} as const;