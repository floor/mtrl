// src/components/textfield/index.ts
export { default } from "./textfield";
// The canonical name, as the root exports it (FLO-383)
export { default as createTextField } from "./textfield";

// Export types
export type {
  TextFieldConfig,
  TextFieldVariant,
  TextFieldComponent,
  TextFieldDensity,
  TextFieldEvents,
  TextFieldValuePayload,
  TextFieldFocusPayload,
  TextFieldTrailingPayload,
} from "./types";
