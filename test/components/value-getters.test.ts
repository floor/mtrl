// test/components/value-getters.test.ts
import { expect, test } from "bun:test";
import { callbacksFixture } from "./callbacks.fixture";
import createTabs from "../../src/components/tabs";
import createDrawer from "../../src/components/drawer";
import createRail from "../../src/components/navigation-rail";
import createGroup from "../../src/components/button-group";
import { createCarousel } from "../../src/components/carousel";
const mount = callbacksFixture();

test("tabs getValue follows the active tab, including an empty identifier and no selection", () => {
  const c = mount(createTabs({ tabs: [{ text: "A", value: "a" }, { text: "Empty", value: "" }] }));
  const seen: unknown[] = [];
  c.on("change", (payload: { value: string }) => seen.push([payload.value, c.getValue()]));
  c.getTabs()[1].element.click();
  expect(seen).toEqual([["", ""]]);
  expect(c.getValue()).toBe(c.getActiveTab()?.getValue());
  c.setActiveTab("missing");
  expect(c.getValue()).toBeNull();
  expect(seen).toHaveLength(1);
});
for (const [name, create] of [["drawer", createDrawer], ["rail", createRail]] as const) {
  test(`${name} getValue agrees inside select and after silent setters`, () => {
    const c = mount(create({ items: [{ id: "a", label: "A", icon: "A", active: true }, { id: "b", label: "B", icon: "B" }] }));
    const seen: unknown[] = [];
    const emitter: { on(event: "select", handler: (payload: { value: string }) => void): unknown } = c;
    emitter.on("select", payload => seen.push([payload.value, c.getValue()]));
    c.element.querySelector<HTMLElement>('[data-id="b"]')!.click();
    expect(seen).toEqual([["b", "b"]]);
    expect(c.getValue()).toBe(c.getActive());
    c.setActive("a");
    expect(c.getValue()).toBe("a");
    expect(seen).toHaveLength(1);
  });
}
for (const selection of ["single", "multi"] as const) {
  test(`button group ${selection} getter follows change and returns an independent snapshot`, () => {
    const c = mount(createGroup({ selection, buttons: [{ text: "A", value: "a" }, { text: "B", value: "b" }] }));
    expect(c.getValue()).toEqual(selection === "multi" ? [] : null);
    const seen: unknown[] = [];
    c.on("change", payload => seen.push([payload.value, c.getValue()]));
    c.buttons[0].element.click();
    expect(seen).toEqual(selection === "multi" ? [[["a"], ["a"]]] : [["a", "a"]]);
    const value = c.getValue();
    if (Array.isArray(value)) value.push("outside");
    expect(c.getSelected()).toEqual(["a"]);
    c.select("b");
    expect(c.getValue()).toEqual(selection === "multi" ? ["a", "b"] : "b");
    expect(seen).toHaveLength(1);
  });
}
test("carousel getValue aliases the current index without emitting", () => {
  const c = mount(createCarousel({ slides: [{ image: "a.jpg" }, { image: "b.jpg" }] }));
  const seen: unknown[] = [];
  c.on("change", payload => seen.push([payload, c.getValue()]));
  expect(c.getValue()).toBe(c.getCurrentSlide());
  c.goTo(1);
  expect(c.getValue()).toBe(c.getCurrentSlide());
  expect(c.getValue()).toBe(1);
  // The payload's value is the getter's, read inside the handler (FLO-380).
  expect(seen).toEqual([[{ value: 1 }, 1]]);
});
