// test/components/search/synchronous-content.test.ts
import { expect, test } from "bun:test";
import createSearch from "../../../src/components/search";
import { callbacksFixture, wait } from "../callbacks.fixture";

const mount = callbacksFixture();

test("initial suggestions render synchronously with groups, supporting text and literal query highlighting", async () => {
  const search = mount(createSearch({ value: "<a>", suggestions: [
    { text: "An <a> tag", supportingText: "Literal text", group: "recent" },
    { text: "Banana", group: "other" },
  ] }));
  const options = Array.from(search.element.querySelectorAll('[role="option"]'));
  expect(options).toHaveLength(2);
  expect(options[0]?.textContent).toBe("An <a> tagLiteral text");
  expect(options[0]?.querySelector("a")).toBeNull();
  expect(options[0]?.querySelector("strong")?.textContent).toBe("<a>");
  expect(search.element.querySelectorAll(".mtrl-search__suggestion-divider")).toHaveLength(1);
  expect(search.element.querySelector('[role="status"]')?.textContent).toBe("");
  await wait();
  expect(search.element.querySelector('[role="option"]')).toBe(options[0]);
});

test("synchronous suggestions can be selected immediately through the public callback", () => {
  const selected: string[] = [];
  const search = mount(createSearch({ suggestions: ["Apple"], onSuggestionSelect: (event) => selected.push(event.suggestion!.text) }));
  const option = search.element.querySelector<HTMLElement>('[role="option"]');
  expect(option).not.toBeNull();
  option!.click();
  expect(search.getValue()).toBe("Apple");
  expect(selected).toEqual(["Apple"]);
});
