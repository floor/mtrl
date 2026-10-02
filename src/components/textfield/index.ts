// src/components/textfield/index.ts
export { default } from "./textfield";
// The canonical name, as the root exports it (FLO-383)
export { default as createTextField } from "./textfield";

// Export types
export type {
  TextfieldConfig as TextFieldConfig,
  TextfieldComponent as TextFieldComponent,
  /** @deprecated Use TextFieldConfig: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldConfig,
  /** @deprecated Use TextFieldComponent: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldComponent,
  TextfieldDensity as TextFieldDensity,
  TextfieldEvents as TextFieldEvents,
  TextfieldValuePayload as TextFieldValuePayload,
  TextfieldFocusPayload as TextFieldFocusPayload,
  TextfieldTrailingPayload as TextFieldTrailingPayload,
  /** @deprecated Use TextFieldDensity: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldDensity,
  /** @deprecated Use TextFieldEvents: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldEvents,
  /** @deprecated Use TextFieldValuePayload: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldValuePayload,
  /** @deprecated Use TextFieldFocusPayload: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldFocusPayload,
  /** @deprecated Use TextFieldTrailingPayload: M3 writes "text field" as two words. Removed in `material` 3.0.0 (FLO-383). */
  TextfieldTrailingPayload,
} from "./types";
