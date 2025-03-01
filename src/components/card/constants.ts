// src/components/card/constants.ts
import { CardVariant, CardElevation } from './types';

/**
 * Card variant types following Material Design 3
 * @enum {string}
 */
export const CARD_VARIANTS = {
  ELEVATED: CardVariant.ELEVATED,
  FILLED: CardVariant.FILLED,
  OUTLINED: CardVariant.OUTLINED
};

/**
 * Card elevation levels
 * @enum {number}
 */
export const CARD_ELEVATIONS = {
  RESTING: CardElevation.RESTING,
  HOVERED: CardElevation.HOVERED,
  DRAGGED: CardElevation.DRAGGED
};

/**
 * Validation schema for card configuration
 */
export const CARD_SCHEMA = {
  variant: {
    type: 'string',
    enum: Object.values(CARD_VARIANTS),
    default: CARD_VARIANTS.ELEVATED
  },
  interactive: {
    type: 'boolean',
    default: false
  },
  fullWidth: {
    type: 'boolean',
    default: false
  },
  clickable: {
    type: 'boolean',
    default: false
  },
  draggable: {
    type: 'boolean',
    default: false
  },
  class: {
    type: 'string',
    required: false
  },
  headerConfig: {
    type: 'object',
    required: false
  },
  contentConfig: {
    type: 'object',
    required: false
  },
  actionsConfig: {
    type: 'object',
    required: false
  },
  mediaConfig: {
    type: 'object',
    required: false
  }
};