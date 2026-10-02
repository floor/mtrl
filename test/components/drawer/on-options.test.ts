// test/components/drawer/on-options.test.ts
//
// onSelect, onOpen and onClose are the drawer's listeners, with the same
// arguments those events already pass.
import { expect, test } from "bun:test";
import createDrawer from "../../../src/components/drawer";
import type { DrawerConfig } from "../../../src/components/drawer/types";
import { callbacksFixture } from "../callbacks.fixture";
import { expectSameListener, optionPair } from "../on-option-pair";

const mount = callbacksFixture();
const create = (config: DrawerConfig = {}) => mount(createDrawer({
  items: [
    { id: "inbox", label: "Inbox", icon: "<svg></svg>", active: true },
    { id: "trash", label: "Trash", icon: "<svg></svg>" },
  ],
  ...config,
}));
const item = (drawer: { element: HTMLElement }, id: string) =>
  drawer.element.querySelector<HTMLElement>(`[data-id="${id}"]`)!;

test("onSelect matches its listener for a click, and setActive is silent", () => {
  const seen = optionPair();
  const drawer = create({ onSelect: (event) => seen.option(event) });
  drawer.on("select", (event) => seen.listener(event));
  item(drawer, "trash").click();
  expectSameListener(seen);
  const payload = seen.listenerCalls[0] as { id: string; value: string; label: string };
  expect(payload.id).toBe("trash");
  expect(payload.value).toBe("trash");
  expect(payload.label).toBe("Trash");
  drawer.setActive("inbox");
  expect(seen.optionCalls).toHaveLength(1);
  expect(seen.listenerCalls).toHaveLength(1);
});

test("onOpen and onClose match their listeners for open, close and toggle", () => {
  const opened = optionPair();
  const closed = optionPair();
  const drawer = create({
    onOpen: opened.option,
    onClose: closed.option,
  });
  drawer.on("open", opened.listener);
  drawer.on("close", closed.listener);
  drawer.open();
  drawer.open();
  drawer.close();
  drawer.toggle();
  drawer.toggle();
  expectSameListener(opened);
  expectSameListener(closed);
  expect(opened.optionCalls).toEqual([undefined, undefined]);
  expect(closed.optionCalls).toEqual([undefined, undefined]);
});

test("off(onOpen) removes the config handler, which is the registered function", () => {
  const seen: string[] = [];
  const onOpen = () => { seen.push("open"); };
  const drawer = create({ onOpen });
  drawer.open();
  drawer.off("open", onOpen);
  drawer.close();
  drawer.open();
  expect(seen).toEqual(["open"]);
});
