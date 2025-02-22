// src/core/compose/index.js
/**
 * @module core/compose
 * @description Core composition utilities for creating and combining components
 */
export { pipe, compose, transform } from './pipe'
export {
  withEvents,
  withIcon,
  withSize,
  withPosition,
  withText,
  withVariant,
  withTextInput
} from './features'
export { createBase, withElement } from './component' // Add this line
