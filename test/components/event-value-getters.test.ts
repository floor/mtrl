// test/components/event-value-getters.test.ts
// FLO-380: factory model events report the live getter during dispatch.
// Snapshot in each handler before another activation changes the model.
import { expect, test } from "bun:test";
import createTextField from "../../src/components/textfield";
import createSlider from "../../src/components/slider";
import createSearch from "../../src/components/search";
import createButtonGroup from "../../src/components/button-group";
import createTabs from "../../src/components/tabs";
import createProgress from "../../src/components/progress";
import { callbacksFixture, wait } from "./callbacks.fixture";

const mount = callbacksFixture();

test("text field input and change carry the live string", () => {
  const field = mount(createTextField({ label: "Name" }));
  const seen: Array<[string, string]> = [];
  for (const name of ["input", "change"] as const) {
    field.on(name, event => seen.push([event.value, field.getValue()]));
  }
  const input = field.element.querySelector("input")!;
  input.value = "Ada";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  expect(seen).toEqual([["Ada", "Ada"], ["Ada", "Ada"]]);
});

test("slider input and change carry the live first endpoint", () => {
  const slider = mount(createSlider({ value: 20, secondValue: 80, range: true }));
  const seen: Array<[number, number, number | undefined]> = [];
  for (const name of ["input", "change"] as const) {
    slider.on(name, event => seen.push([event.value, slider.getValue(), event.secondValue]));
  }
  slider.element.querySelector<HTMLElement>('[role="slider"]')!.dispatchEvent(
    new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
  );
  expect(seen).toEqual([[21, 21, 80], [21, 21, 80]]);
});

test("search input, submit, suggestion selection and clear snapshot their live string", async () => {
  const search = mount(createSearch({ suggestions: ["Apple"], expandOnFocus: false, collapseOnBlur: false }));
  await wait();
  const seen: Array<[string, string, string]> = [];
  for (const name of ["input", "submit", "suggestionSelect", "clear"] as const) {
    search.on(name, event => seen.push([name, event.value, search.getValue()]));
  }
  const input = search.element.querySelector("input")!;
  input.value = "Ap";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  search.submit();
  search.expand();
  search.element.querySelector<HTMLElement>('[role="option"]')!.click();
  search.element.querySelector<HTMLElement>(".mtrl-search__clear-button")!.click();
  expect(seen).toEqual([
    ["input", "Ap", "Ap"],
    ["submit", "Ap", "Ap"],
    ["suggestionSelect", "Apple", "Apple"],
    ["input", "", ""],
    ["clear", "", ""],
  ]);
});

test("single and multi button groups emit the shape returned by getValue", () => {
  const items = [{ text: "Alpha", value: "a" }, { text: "Beta", value: "b" }];
  const single = mount(createButtonGroup({ selection: "single", buttons: items }));
  const multi = mount(createButtonGroup({ selection: "multi", buttons: items }));
  const seen: Array<[unknown, unknown]> = [];
  single.on("change", event => seen.push([event.value, single.getValue()]));
  multi.on("change", event => seen.push([event.value, multi.getValue()]));
  single.buttons[1].element.click();
  single.buttons[1].element.click();
  multi.buttons[0].element.click();
  multi.buttons[1].element.click();
  expect(seen).toEqual([["b", "b"], [null, null], [["a"], ["a"]], [["a", "b"], ["a", "b"]]]);
});

test("tab selection reports the active getter value", () => {
  const tabs = mount(createTabs({ tabs: [{ text: "Alpha", value: "a" }, { text: "Beta", value: "b" }] }));
  const seen: Array<[string, string | null]> = [];
  tabs.on("change", event => seen.push([event.value, tabs.getValue()]));
  tabs.getTabs()[1].element.click();
  expect(seen).toEqual([["b", "b"]]);
});

test("progress programmatic change reports the clamped getter value", () => {
  // JSDOM has no canvas implementation; this test concerns the model event.
  window.HTMLCanvasElement.prototype.getContext = () => null;
  const progress = mount(createProgress({ value: 0, max: 100 }));
  const seen: Array<[number, number]> = [];
  progress.on("change", event => seen.push([event.value, progress.getValue()]));
  progress.setValue(40);
  progress.setValue(140);
  expect(seen).toEqual([[40, 40], [100, 100]]);
});
