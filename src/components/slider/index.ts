// src/components/slider/index.ts

// Export main component creator
export { default } from './slider';

// Export constants
export { 
  SLIDER_COLORS, 
  SLIDER_SIZES, 
  SLIDER_ORIENTATIONS, 
  SLIDER_EVENTS 
} from './constants';

// Export types for TypeScript users
export type { 
  SliderConfig, 
  SliderComponent, 
  SliderEvent 
} from './types';