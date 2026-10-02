// test/components/search/combobox.test.ts
//
// The search input is a combobox that owns its suggestions listbox (FLO-286).
// It was a plain text field: a screen reader heard neither the list nor the
// suggestion the arrows reached, and M3 asks that suggestions be announced.

import { expect, test } from "bun:test";
import createSearch from "../../../src/components/search";
import { callbacksFixture, wait } from "../callbacks.fixture";

const mount = callbacksFixture();

const setup = async () => {
  const search = mount(createSearch({ placeholder: "Search mail", suggestions: ["Apple", "Banana", "Cherry"], collapseOnBlur: false }));
  await wait();
  const input = search.element.querySelector<HTMLInputElement>("input")!;
  const press = (key: string) => input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  const status = () => search.element.querySelector('[role="status"]')!.textContent;
  const active = () => document.getElementById(input.getAttribute("aria-activedescendant") ?? "")?.textContent ?? null;
  return { search, input, press, status, active };
};

test("the input is a combobox controlling the listbox, which exists while collapsed", async () => {
  const { input } = await setup();
  expect(input.getAttribute("role")).toBe("combobox");
  expect(input.getAttribute("aria-autocomplete")).toBe("list");
  expect(input.getAttribute("aria-expanded")).toBe("false");
  const list = document.getElementById(input.getAttribute("aria-controls")!);
  expect(list?.getAttribute("role")).toBe("listbox");
});

test("two searches control their own listboxes", async () => {
  const first = await setup();
  const second = await setup();
  expect(first.input.getAttribute("aria-controls")).not.toBe(second.input.getAttribute("aria-controls"));
});

test("aria-expanded follows the view", async () => {
  const { search, input } = await setup();
  search.expand();
  expect(input.getAttribute("aria-expanded")).toBe("true");
  search.collapse();
  expect(input.getAttribute("aria-expanded")).toBe("false");
});

test("the arrows move aria-activedescendant through the options", async () => {
  const { search, press, active } = await setup();
  search.expand();
  expect(active()).toBeNull();
  press("ArrowDown");
  expect(active()).toBe("Apple");
  press("ArrowDown");
  expect(active()).toBe("Banana");
  press("ArrowUp");
  expect(active()).toBe("Apple");
  search.collapse();
  expect(active()).toBeNull();
});

test("new suggestions are drawn with nothing highlighted", async () => {
  const { search, press, active } = await setup();
  search.expand();
  press("ArrowDown");
  search.setSuggestions(["Date", "Elderberry"]);
  expect(active()).toBeNull();
});

test("the count is announced while the list shows, and not otherwise", async () => {
  const { search, status } = await setup();
  expect(status()).toBe("");
  search.expand();
  expect(status()).toBe("3 suggestions");
  search.setSuggestions(["Date"]);
  expect(status()).toBe("1 suggestion");
  search.setSuggestions([]);
  expect(status()).toBe("");
  search.setSuggestions(["Date", "Fig"]);
  search.collapse();
  expect(status()).toBe("");
});

test("hovering a suggestion does not highlight it for the keyboard", async () => {
  const { search, active } = await setup();
  search.expand();
  search.element.querySelector('[role="option"]')!.dispatchEvent(new MouseEvent("mouseenter"));
  expect(active()).toBeNull();
});

// FLO-553: an explicit behavior overrides the stylesheet, and with it the
// reduced-motion reset. The suggestion list's own scroll-behavior decides.
test("the arrows scroll the highlighted suggestion into view and name no behaviour", async () => {
  const { search, press } = await setup();
  search.expand();
  const calls: unknown[] = [];
  window.HTMLElement.prototype.scrollIntoView = function (options?: boolean | ScrollIntoViewOptions) { calls.push(options); };
  press("ArrowDown");
  expect(calls).toEqual([{ block: "nearest" }]);
});
