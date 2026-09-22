import { expect, test } from "bun:test";
import createMenu from "../../../src/components/menu";
import type { MenuEvent, MenuSelectEvent } from "../../../src/components/menu/types";
import { callbacksFixture, wait } from "../callbacks.fixture";

const mount = callbacksFixture();

test("menu callbacks expose the public menu and preserve cancellation", async () => {
  const opener = document.createElement("button");
  document.body.append(opener);
  const events: MenuEvent[] = [];
  const selections: MenuSelectEvent[] = [];
  const menu = mount(createMenu({ opener, items: [{ id: "copy", text: "Copy" }], on: { open: event => { events.push(event); } } }));
  menu.on("select", event => { selections.push(event); event.preventDefault(); });
  menu.on("select", event => { events.push(event); });
  menu.on("close", event => { events.push(event); });
  await wait();
  menu.open();
  const original = new MouseEvent("click", { bubbles: true });
  menu.element.querySelector<HTMLElement>('[data-id="copy"]')!.dispatchEvent(original);
  expect(menu.isOpen()).toBe(true);
  expect(selections[0].defaultPrevented).toBe(true);
  expect(selections[0].originalEvent).toBe(original);
  expect(events[1] === selections[0]).toBe(true);
  menu.close();
  await wait(250);
  expect(events).toHaveLength(3);
  for (const event of events) expect(event.menu === menu).toBe(true);
  expect(selections[0].menu.getItems()).toHaveLength(1);
});
