// test/components/tabs/get-active-tab.test.ts
//
// getActiveTab declares `TabComponent | null`. Its fallback path — used when
// the host exposes no getActiveTab of its own — ended in
// `component.tabs.find(...)`, and `find` yields undefined when nothing
// matches. So "no active tab" came back as undefined from one path and null
// from the other, while the signature promised null throughout. A caller
// written against that signature, comparing `=== null`, was simply wrong.
//
// Found while clearing tabs for strictNullChecks (FLO-114).
//
// This drives the exported helper directly rather than a whole tabs group,
// because the fallback only runs for a host without getActiveTab — which a
// real createTabs always has.

import { describe, test, expect } from "bun:test";
import { getActiveTab } from "../../../src/components/tabs/utils";
import type { TabComponent } from "../../../src/components/tabs/types";

/** The least a tab needs to be findable by this helper. */
const tab = (active: boolean, value: string): TabComponent =>
  ({ isActive: () => active, getValue: () => value }) as unknown as TabComponent;

describe("getActiveTab", () => {
  test("it returns the active tab from the host's own method", () => {
    const active = tab(true, "one");
    expect(getActiveTab({ getActiveTab: () => active })).toBe(active);
  });

  test("it returns null when the host's own method finds nothing", () => {
    expect(getActiveTab({ getActiveTab: () => null })).toBeNull();
  });

  test("it falls back to the tabs array and finds the active one", () => {
    const active = tab(true, "two");
    const tabs = [tab(false, "one"), active, tab(false, "three")];

    expect(getActiveTab({ tabs })).toBe(active);
  });

  // The defect: this path returned undefined, not null.
  test("the fallback returns null when no tab is active", () => {
    const tabs = [tab(false, "one"), tab(false, "two")];

    expect(getActiveTab({ tabs })).toBeNull();
  });

  test("an empty tabs array is null, not undefined", () => {
    expect(getActiveTab({ tabs: [] })).toBeNull();
  });

  // Both paths must agree, which is the whole point of a single declared
  // return type.
  test("both paths report 'nothing active' the same way", () => {
    const viaMethod = getActiveTab({ getActiveTab: () => null });
    const viaFallback = getActiveTab({ tabs: [tab(false, "one")] });

    expect(viaFallback).toBe(viaMethod);
  });

  test("a host with neither is null", () => {
    expect(getActiveTab({})).toBeNull();
  });

  test("a tab without isActive does not count as active", () => {
    const tabs = [{ getValue: () => "one" } as unknown as TabComponent];

    expect(getActiveTab({ tabs })).toBeNull();
  });
});
