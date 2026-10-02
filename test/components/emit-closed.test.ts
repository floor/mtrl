// test/components/emit-closed.test.ts
//
// 1.0 closes the type of `emit` on the card and the tabs to the component's
// event map (test/types/emit-closed.fixture.ts). The emitter underneath is
// unchanged: untyped code that still emits a name of its own reaches the
// listeners registered for it. This pins what the migration row says.
import { expect, test } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
const g = globalThis as Record<string, unknown>;
for (const key of ["HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent", "FocusEvent", "MutationObserver"]) g[key] = (dom.window as unknown as Record<string, unknown>)[key];
g.window = dom.window;
g.document = dom.window.document;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 0);

const { default: createCard } = await import("../../src/components/card");
const { default: createTabs } = await import("../../src/components/tabs");

type Loose = { on: (event: string, handler: (data: unknown) => void) => unknown; emit?: (event: string, data?: unknown) => unknown };

for (const [name, make] of [
  ["card", () => createCard({})],
  ["tabs", () => createTabs({ tabs: [{ text: "One", value: "one" }] })],
] as const) {
  test(`${name}: an untyped emit of a name outside the event map still reaches its listener`, () => {
    const component = make() as unknown as Loose;
    const seen: unknown[] = [];
    component.on("custom", (data) => seen.push(data));
    component.emit?.("custom", { at: 1 });
    expect(seen).toEqual([{ at: 1 }]);
  });
}
