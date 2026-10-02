// src/components/button/index.ts

/**
 * Button component module
 * @module components/button
 */

export { default } from "./button";
export type { ButtonConfig, ButtonComponent, ButtonVariant } from "./types";
// The event map `on` and `off` are typed with (FLO-384)
export type { ButtonEvents } from "./types";
export type { ButtonSize, ButtonShape } from "./constants";
export * from "./constants";
