import { describe, expect, test } from "bun:test";
import { menuElement } from "../../src/elements/menu";
import { fabMenuElement } from "../../src/elements/fab-menu";

// FLO-548: on <m-menu> and <m-fab-menu> the `open` attribute (and the property
// that reflects it) is applied in the attribute callback, as on <m-dialog>
// and the other overlays' elements: synchronously, and inside the element's
// quiet window, so setting it dispatches no `open` or `close`. It used to be
// applied a microtask later, outside that window, and dispatched.
//
// The element class itself runs in a browser (scripts/check-elements.ts);
// what is tested here is the spec's `update`, with the component it is given.
const component = (open: boolean) => {
  const calls: string[] = [];
  return {
    calls,
    isOpen: () => open,
    show: () => { open = true; calls.push("show"); },
    hide: () => { open = false; calls.push("hide"); },
  };
};
type Update = (c: never, value: unknown, host: never) => unknown;
const specs: [string, Update][] = [
  ["<m-menu>", menuElement.spec.attributes.open.update as unknown as Update],
  ["<m-fab-menu>", fabMenuElement.spec.attributes.open.update as unknown as Update],
];

for (const [name, update] of specs) {
  describe(`${name}: the open attribute`, () => {
    test("set: the component is shown before the attribute callback returns", () => {
      const c = component(false);
      update(c as never, true, null as never);
      expect(c.calls).toEqual(["show"]);
      expect(c.isOpen()).toBe(true);
    });

    test("removed: the component is hidden before the attribute callback returns", () => {
      const c = component(true);
      update(c as never, false, null as never);
      expect(c.calls).toEqual(["hide"]);
      expect(c.isOpen()).toBe(false);
    });

    test("reflecting a state the component already has does nothing", async () => {
      const opened = component(true);
      update(opened as never, true, null as never);
      const closed = component(false);
      update(closed as never, false, null as never);
      await Promise.resolve();
      expect(opened.calls).toEqual([]);
      expect(closed.calls).toEqual([]);
    });
  });
}
