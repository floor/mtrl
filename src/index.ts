// src/index.ts
/**
 * Main mtrl library exports
 *
 * @packageDocumentation
 */

export * from "./components";
export * from "./core";

// Import from core
import {
  addClass,
  removeClass,
  hasClass,
  toggleClass,
  throttle,
  debounce,
  once,
  PREFIX,
  createComponentConfig,
  createElementConfig,
  setComponentDefaults,
  getComponentDefaults,
  setGlobalDefaults,
  clearGlobalDefaults,
} from "./core";

// Export all "create*" functions
export {
  addClass,
  removeClass,
  hasClass,
  toggleClass,
  throttle,
  debounce,
  once,
  PREFIX,
  createComponentConfig,
  createElementConfig,
  // Global configuration functions
  setComponentDefaults,
  getComponentDefaults,
  setGlobalDefaults,
  clearGlobalDefaults,
};

// NOTE: Constants are no longer exported from the main entry point
// to enable proper tree-shaking. Import constants directly from
// component paths:
//
// Before (no longer works):
//   import { BUTTON_VARIANTS } from 'mtrl'
//
// After:
//   import { BUTTON_VARIANTS } from 'mtrl/components/button/constants'
//
// Or use the component's index which re-exports its constants:
//   import { BUTTON_VARIANTS } from 'mtrl/components/button'
