// test/core/consumer-exports.test.ts
//
// What mtrl-addons imports from mtrl, pinned.
//
// FLO-123 removes four public exports that nothing uses — `createLifecycle`,
// `createDisabled`/`DisabledState`, `COMPONENTS` and `STATES`. The issue made
// a consumer check the gate on that removal, and for good reason: the same
// sweep once came within one line of deleting the *live* `createComponentConfig`
// instead of its dead twin. Nothing tested the package's export of it, so the
// wrong deletion would have compiled, passed the suite, and shipped a
// different function under the same public name.
//
// So this asserts the other direction from the removal. The four are gone
// because nothing imports them; these twenty-one stay because something does.
// The list is every identifier mtrl-addons imports from "mtrl", read from its
// source at ~/Code/floor/mtrl-addons.
//
// It is a floor, not a ceiling. Exporting more is fine; dropping one of these
// is a breaking change for a consumer we can see, and should be a decision
// rather than an accident.

import { describe, test, expect } from "bun:test";

import * as mtrl from "../../src";

/** Every identifier mtrl-addons imports from "mtrl". */
const VALUES = [
  "createBase",
  "createButton",
  "createCard",
  "createCheckbox",
  "createChips",
  "createIconButton",
  "createList",
  "createSelect",
  "createSwitch",
  "createTabs",
  "createTextfield",
  "hasEmit",
  "hasLifecycle",
  "pipe",
  "withDisabled",
  "withElement",
  "withEvents",
  "withLifecycle",
] as const;

// BaseComponent, ElementComponent and EventCallback are the three types it
// imports. They cannot be checked at runtime, so they are asserted at compile
// time instead — this file fails to type-check if any of them stops being
// exported.
type _Types = [
  mtrl.BaseComponent,
  mtrl.ElementComponent,
  mtrl.EventCallback,
];

describe("the exports mtrl-addons depends on", () => {
  for (const name of VALUES) {
    test(`${name} is exported and callable`, () => {
      expect(typeof (mtrl as Record<string, unknown>)[name]).toBe("function");
    });
  }
});

// The other half of FLO-123: these were exported, used by nothing in src, in
// test, or in mtrl-addons, and are removed. Asserting their absence keeps the
// removal from being quietly undone by a barrel edit.
describe("the exports FLO-123 removed", () => {
  for (const name of ["createLifecycle", "createDisabled", "COMPONENTS", "STATES"]) {
    test(`${name} is no longer exported`, () => {
      expect((mtrl as Record<string, unknown>)[name]).toBeUndefined();
    });
  }
});
