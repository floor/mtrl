// test/types/canonical-names.fixture.ts
//
// FLO-383 PR B: 1.0 has only the canonical names. 0.10.5 exported both
// spellings (PR A, A2); the old ones are gone from every entry, and the
// factory's TopAppBarComponent chains as it did.
import {
  createTextField, createTopAppBar, createSelect,
  type TextFieldConfig, type TextFieldComponent, type CardConfig,
  type TopAppBarComponent, type BottomAppBarComponent,
} from "../../src";
// @ts-expect-error createTextfield is createTextField in 1.0
import { createTextfield } from "../../src";
// @ts-expect-error TextfieldConfig is TextFieldConfig in 1.0
import type { TextfieldConfig } from "../../src";
// @ts-expect-error CardSchema is CardConfig in 1.0
import type { CardSchema } from "../../src";
// @ts-expect-error TopAppBar is TopAppBarComponent in 1.0
import type { TopAppBar } from "../../src";
// @ts-expect-error BottomAppBar is BottomAppBarComponent in 1.0
import type { BottomAppBar } from "../../src";

export const field: TextFieldComponent = createTextField({ label: "Name" } satisfies TextFieldConfig);
export const card: CardConfig = { variant: "outlined" };
export const chained: TopAppBarComponent = createTopAppBar().setTitle("Inbox").setType("medium");
export type Bottom = BottomAppBarComponent;
export type Gone = [typeof createTextfield, TextfieldConfig, CardSchema, TopAppBar, BottomAppBar];

// The select's text field is a property a user reads (FLO-383): textField only
const select = createSelect({ label: "Size", options: [] });
export const selectField: TextFieldComponent = select.textField;
// @ts-expect-error select.textfield is select.textField in 1.0, with no alias
export const oldSelectField = select.textfield;

// Every public variant option's type is exported (FLO-383 follow-up)
import type { TextFieldVariant, SelectVariant, TextFieldConfig as FieldConfig, SelectConfig } from "../../src";
export const fieldVariant: TextFieldVariant = "outlined";
export const selectVariant: SelectVariant = "filled";
export const fieldWithVariant: FieldConfig = { variant: fieldVariant };
export const selectWithVariant: SelectConfig = { variant: selectVariant, options: [] };

// Constant keys are identifiers too: two words; the class value is unchanged
import { SELECT_CLASSES } from "../../src/components/select/constants";
export const selectFieldClass: "select__textfield" = SELECT_CLASSES.TEXT_FIELD;
// @ts-expect-error SELECT_CLASSES.TEXTFIELD is TEXT_FIELD in 1.0
export const oldSelectFieldKey = SELECT_CLASSES.TEXTFIELD;
