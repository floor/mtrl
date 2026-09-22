import { expect, test } from "bun:test";
import createSearch from "../../../src/components/search";
import type { SearchEvent, SearchComponent } from "../../../src/components/search/types";
import { callbacksFixture, wait } from "../callbacks.fixture";

const mount = callbacksFixture();

test("search input, submit, clear and state events expose the finished search", () => {
  const seen: SearchEvent[] = [];
  const record = (event: SearchEvent): void => { seen.push(event); };
  const search = mount(createSearch({ expandOnFocus: false, collapseOnBlur: false, on: { input: record } }));
  for (const name of ["submit", "clear", "expand", "collapse"] as const) search.on(name, record);
  search.setValue("hello");
  search.submit();
  search.clear();
  search.expand();
  search.collapse();
  expect(seen).toHaveLength(5);
  for (const event of seen) expect(event.component === search).toBe(true);
  expect(seen[0].component.getValue()).toBe("");
  expect(seen[0].value).toBe("hello");
});

test("search DOM and suggestion events keep the public API and original event", async () => {
  const seen: SearchEvent[] = [];
  const search = mount(createSearch({ suggestions: ["Apple"], expandOnFocus: false, collapseOnBlur: false }));
  for (const name of ["input", "focus", "blur", "suggestionSelect"] as const) search.on(name, event => { seen.push(event); });
  await wait();
  const input = search.element.querySelector("input")!;
  const original = new FocusEvent("focus");
  input.value = "Ap";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(original);
  input.focus();
  input.blur();
  search.expand();
  search.element.querySelector<HTMLElement>('[role="option"]')!.click();
  expect(seen.some(event => event.originalEvent === original)).toBe(true);
  expect(seen.some(event => event.suggestion?.text === "Apple")).toBe(true);
  for (const event of seen) expect(event.component === search).toBe(true);
  expect(search.getValue()).toBe("Apple");
});

test("search handlers can call the API; off keeps event and instance ownership", () => {
  const first = mount(createSearch());
  const second = mount(createSearch());
  const seen: SearchComponent[] = [];
  const handler = (event: SearchEvent): void => {
    seen.push(event.component);
    event.component.setPlaceholder(event.component.getValue());
  };
  first.on("input", handler).on("submit", handler);
  second.on("input", handler);
  first.setValue("one");
  expect(first.getPlaceholder()).toBe("one");
  first.off("input", handler);
  first.setValue("removed");
  first.submit();
  second.setValue("two");
  expect(seen).toEqual([first, first, second]);
  expect(second.getPlaceholder()).toBe("two");
  first.destroy();
  first.setValue("destroyed");
  expect(seen).toHaveLength(3);
});
