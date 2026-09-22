import { expect, test } from "bun:test";
import createSelect from "../../../src/components/select";
import type { SelectEvent, SelectChangeEvent } from "../../../src/components/select/types";
import { callbacksFixture, wait } from "../callbacks.fixture";

const mount = callbacksFixture();

test("select open, change and close expose the select, not its nested menu", async () => {
  const seen: SelectEvent[] = [];
  const changes: SelectChangeEvent[] = [];
  const select = mount(createSelect({
    options: [{ id: "a", text: "Alpha" }, { id: "b", text: "Beta" }], value: "a",
    on: { open: event => { seen.push(event); } },
  }));
  select.on("change", event => { changes.push(event); seen.push(event); });
  select.on("close", event => { seen.push(event); });
  await wait();
  select.open();
  await wait();
  const option = select.menu.element.querySelector<HTMLElement>('[data-id="b"]')!;
  const click = new MouseEvent("click", { bubbles: true });
  option.dispatchEvent(click);
  await wait(250);
  expect(seen).toHaveLength(3);
  for (const event of seen) expect(event.select === select).toBe(true);
  expect(changes[0].originalEvent).toBe(click);
  expect(changes[0].select.getValue()).toBe("b");
  expect(changes[0].option?.text).toBe("Beta");
});
