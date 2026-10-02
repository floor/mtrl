// test/components/icon-button/change.test.ts
//
// A toggle icon button reports its state with `change` through its emitter
// (FLO-295), as a switch or checkbox does. The DOM `toggle` it dispatched
// shares its name with the native ToggleEvent; it is kept, deprecated, for one
// release.

import { expect, test } from "bun:test";
import createIconButton from "../../../src/components/icon-button";
import { callbacksFixture } from "../callbacks.fixture";

const mount = callbacksFixture();

test("a click emits change with { selected, value }, each way; value is getValue()'s (FLO-380)", () => {
  const button = mount(createIconButton({ toggle: true, icon: "<svg></svg>", ariaLabel: "Favorite", value: "fav" }));
  const seen: unknown[] = [];
  button.on("change", payload => seen.push([payload, button.getValue()]));
  button.element.click();
  button.element.click();
  expect(seen).toEqual([[{ selected: true, value: "fav" }, "fav"], [{ selected: false, value: "fav" }, "fav"]]);
});

test("1.0 dispatches no DOM toggle: a click emits change, and a leftover toggle listener never fires", () => {
  const button = mount(createIconButton({ toggle: true, icon: "<svg></svg>", ariaLabel: "Favorite" }));
  const toggles: unknown[] = [];
  const changes: unknown[] = [];
  button.element.addEventListener("toggle", event => toggles.push((event as CustomEvent).detail));
  button.on("change", payload => changes.push(payload));
  button.element.click();
  expect(toggles).toEqual([]);
  expect(changes).toEqual([{ selected: true, value: "" }]);
});

test("off() stops change; a plain icon button emits none", () => {
  const toggle = mount(createIconButton({ toggle: true, icon: "<svg></svg>", ariaLabel: "Favorite" }));
  const plain = mount(createIconButton({ icon: "<svg></svg>", ariaLabel: "Share" }));
  const seen: unknown[] = [];
  const handler = (payload: { selected: boolean }) => seen.push(payload);
  toggle.on("change", handler).off("change", handler);
  plain.on("change", handler);
  toggle.element.click();
  plain.element.click();
  expect(seen).toEqual([]);
});
