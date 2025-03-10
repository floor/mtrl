// src/components/card/constants.ts

import { CardVariant, CardElevation } from './types';

/**
 * Card variant types following Material Design 3
 * @enum {string}
 */
export const CARD_VARIANTS = {
  /** Elevated card with shadow */
  ELEVATED: CardVariant.ELEVATED,
  /** Filled card with higher surface container color */
  FILLED: CardVariant.FILLED,
  /** Outlined card with border */
  OUTLINED: CardVariant.OUTLINED
};

/**
 * Card elevation levels based on MD3 guidelines
 * Uses the MTRL elevation system values
 * @enum {number}
 */
export const CARD_ELEVATIONS = {
  /** No elevation (for filled and outlined variants) */
  LEVEL0: CardElevation.LEVEL0,
  /** Default elevation for elevated cards */
  LEVEL1: CardElevation.LEVEL1,
  /** Elevation for hovered state */
  LEVEL2: CardElevation.LEVEL2,
  /** Elevation for dragged state */
  LEVEL4: CardElevation.LEVEL4
};

/**
 * Card validation schema
 * @const {Object}
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
  },
  aria: {
    type: 'object',
    required: false
  }
};