// test/types/canonical-names.fixture.ts
//
// FLO-383: the canonical names are the same types and the same factory as the
// old ones, which stay (deprecated) until `material` 3.0.0. The TopAppBar the factory
// returned was a second declaration in top-app-bar.ts; it now returns the public
// one, and assignability is unchanged both ways. Compiled under both
// strictNullChecks gates (tooling:check and test:types).
import {
  createTextField, createTextfield, createTopAppBar,
  type TextFieldConfig, type TextfieldConfig, type TextFieldComponent, type TextfieldComponent,
  type CardConfig, type CardSchema, type TopAppBarComponent, type TopAppBar,
  type BottomAppBarComponent, type BottomAppBar,
} from "../../src";
import type { ElementComponent } from "../../src/core/compose";
import type { TopAppBarType } from "../../src/components/top-app-bar/types";

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export const textFieldConfig: Equals<TextFieldConfig, TextfieldConfig> = true;
export const textFieldComponent: Equals<TextFieldComponent, TextfieldComponent> = true;
export const cardConfig: Equals<CardConfig, CardSchema> = true;
export const topAppBar: Equals<TopAppBarComponent, TopAppBar> = true;
export const bottomAppBar: Equals<BottomAppBarComponent, BottomAppBar> = true;
export const factory: Equals<typeof createTextField, typeof createTextfield> = true;

// The interface top-app-bar.ts declared before (FLO-383 removed the duplicate)
interface LegacyTopAppBar extends ElementComponent {
  setTitle: (title: string) => LegacyTopAppBar;
  getTitle: () => string;
  addLeadingElement: (element: HTMLElement) => LegacyTopAppBar;
  addTrailingElement: (element: HTMLElement) => LegacyTopAppBar;
  setType: (type: TopAppBarType) => LegacyTopAppBar;
  setScrollState: (scrolled: boolean) => LegacyTopAppBar;
  getHeadlineElement: () => HTMLElement;
  getLeadingContainer: () => HTMLElement;
  getTrailingContainer: () => HTMLElement;
}
// What the factory returns still goes wherever either declaration was expected,
// and either declaration still takes what the other holds.
export const asLegacy: LegacyTopAppBar = createTopAppBar();
export const asPublic: TopAppBarComponent = createTopAppBar();
declare const legacy: LegacyTopAppBar;
declare const bar: TopAppBarComponent;
export const legacyToPublic: TopAppBarComponent = legacy;
export const publicToLegacy: LegacyTopAppBar = bar;
// Chaining keeps the type
export const chained: TopAppBarComponent = createTopAppBar().setTitle("Inbox").setType("medium");
