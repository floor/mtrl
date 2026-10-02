// test/components/search/on-options.test.ts
//
// The six config callbacks are the search's listeners. input, submit, clear
// and suggestionSelect receive the SearchEvent; expand and collapse receive
// the object those events already emit.
import { expect, test } from "bun:test";
import createSearch from "../../../src/components/search";
import type { SearchConfig } from "../../../src/components/search/types";
import { callbacksFixture, wait } from "../callbacks.fixture";
import { expectSameListener, optionPair } from "../on-option-pair";

const mount = callbacksFixture();
const create = (config: SearchConfig = {}) => mount(createSearch({
  expandOnFocus: false,
  collapseOnBlur: false,
  ...config,
}));
const inputOf = (search: { element: HTMLElement }) => search.element.querySelector("input")!;
const type = (search: { element: HTMLElement }, text: string) => {
  const input = inputOf(search);
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const press = (search: { element: HTMLElement }, key: string) =>
  inputOf(search).dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

test("onInput matches its listener for typing and setValue(value, true); setValue and clear() are silent", async () => {
  const seen = optionPair();
  const search = create({ onInput: (event) => seen.option(event) });
  search.on("input", (event) => seen.listener(event));
  await wait();
  search.setValue("quiet");
  search.clear();
  expect(seen.optionCalls).toEqual([]);
  type(search, "hello");
  search.setValue("loud", true);
  expectSameListener(seen);
  expect(seen.optionCalls).toHaveLength(2);
  for (const payload of seen.listenerCalls) {
    expect((payload as { value: string }).value === "hello" || (payload as { value: string }).value === "loud").toBe(true);
  }
});

test("onSubmit matches its listener for Enter and submit(); an empty query submits nothing", async () => {
  const seen = optionPair();
  const search = create({ onSubmit: (event) => seen.option(event) });
  search.on("submit", (event) => seen.listener(event));
  await wait();
  press(search, "Enter");
  search.submit();
  expect(seen.optionCalls).toEqual([]);
  type(search, "invoices");
  press(search, "Enter");
  search.submit();
  expectSameListener(seen);
  expect(seen.optionCalls).toHaveLength(2);
  expect((seen.listenerCalls[0] as { value: string }).value).toBe("invoices");
});

test("onClear matches its listener for the clear button; clear() is silent", async () => {
  const seen = optionPair();
  const search = create({ value: "hello", onClear: (event) => seen.option(event) });
  search.on("clear", (event) => seen.listener(event));
  await wait();
  search.clear();
  expect(seen.optionCalls).toEqual([]);
  search.setValue("again");
  search.element.querySelector<HTMLElement>('[aria-label="Clear search"]')!.click();
  expectSameListener(seen);
  expect((seen.listenerCalls[0] as { value: string }).value).toBe("");
});

test("onSuggestionSelect matches its listener when a suggestion is chosen", () => {
  const seen = optionPair();
  const search = create({
    suggestions: ["Apple"],
    onSuggestionSelect: (event) => seen.option(event),
  });
  search.on("suggestionSelect", (event) => seen.listener(event));
  search.element.querySelector<HTMLElement>('[role="option"]')!.click();
  expectSameListener(seen);
  const payload = seen.listenerCalls[0] as { suggestion?: { text: string }; value: string };
  expect(payload.suggestion?.text).toBe("Apple");
  expect(payload.value).toBe("Apple");
});

test("onExpand and onCollapse match their listeners for the methods and the leading icon", async () => {
  const expanded = optionPair();
  const collapsed = optionPair();
  const states: string[] = [];
  const search = create({
    onExpand: (event) => expanded.option(event),
    onCollapse: (event) => collapsed.option(event),
  });
  search.on("expand", (event) => { states.push(`${event.state} ${event.viewMode}`); expanded.listener(event); });
  search.on("collapse", (event) => { states.push(`${event.state} ${event.viewMode}`); collapsed.listener(event); });
  search.expand();
  search.collapse();
  await wait();
  search.element.querySelector<HTMLElement>(".mtrl-search__leading-icon")!.click();
  search.element.querySelector<HTMLElement>(".mtrl-search__leading-icon")!.click();
  expectSameListener(expanded);
  expectSameListener(collapsed);
  expect(expanded.optionCalls).toHaveLength(2);
  expect(collapsed.optionCalls).toHaveLength(2);
  expect(states).toEqual(["view docked", "bar docked", "view docked", "bar docked"]);
  expect(Object.keys(expanded.listenerCalls[0] as object).sort()).toEqual(["component", "state", "viewMode"]);
});

test("off(onSubmit) removes the config handler, which is the registered function", () => {
  const seen: string[] = [];
  const onSubmit = () => { seen.push("submit"); };
  const search = create({ onSubmit });
  search.setValue("a");
  search.submit();
  search.off("submit", onSubmit);
  search.setValue("b");
  search.submit();
  expect(seen).toEqual(["submit"]);
});
