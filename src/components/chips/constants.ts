/** Material Design chip types. Visual elevation is a separate option. */
export const CHIP_TYPES = {
  ASSIST: "assist", FILTER: "filter", INPUT: "input", SUGGESTION: "suggestion",
} as const;
export const CHIP_EVENTS = {
  CLICK: "click", KEYDOWN: "keydown", FOCUS: "focus", BLUR: "blur", CHANGE: "change", REMOVE: "remove",
} as const;
export const CHIPS_EVENTS = { CHANGE: "change", ADD: "add", REMOVE: "remove" } as const;
