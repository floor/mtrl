// src/index.ts
/**
 * Main mtrl library exports
 *
 * The root is the components and the few helpers an app configures them with.
 * The rest of core is at its subpath (`mtrl/core/compose`, `mtrl/core/dom`, ...):
 * 1.0.0 removed it from the root (FLO-351), and scripts/fixtures/root-exports.md
 * says where each name went. The list is pinned by scripts/fixtures/root-exports.json:
 * `bun run root-exports:update`.
 *
 * @packageDocumentation
 */

export * from "./components";

// The public root beyond the components
export { setComponentDefaults, getComponentDefaults, setGlobalDefaults, clearGlobalDefaults, schemeToTokens, THEME_ROLES, configureHTML } from "./core";
export type { ThemeRole, SchemeRoles, SchemeToTokensOptions, ThemeTokens, ComponentConfigMap, HTMLPolicy, HTMLInput, TrustedHTMLLike } from "./core";

// NOTE: Constants are no longer exported from the main entry point
// to enable proper tree-shaking. Import constants directly from
// component paths:
//
//   import { BUTTON_VARIANTS } from 'mtrl/components/button/constants'
//
// The constants subpath is the one place every component's constants are
// exported from: most component indexes do not re-export them.
