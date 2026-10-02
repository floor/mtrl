// test/components/event-value-time-select-radio.test.ts
import { expect, test } from "bun:test";
import createTimePicker from "../../src/components/timepicker";
import createSelect from "../../src/components/select";
import createRadios from "../../src/components/radios";
import { callbacksFixture, wait } from "./callbacks.fixture";
import { innerMenu } from "../../src/components/menu/inner";

const mount = callbacksFixture();

test("time input carries the committed value and separate draft; confirm carries the getter value", () => {
  const picker = mount(createTimePicker({ value: "09:30" }));
  const seen: string[] = [];
  picker.on("input", (event) => {
    expect(event.value).toEqual(picker.getValue());
    expect(event.draftValue).toBe("03:30");
    seen.push("input");
  });
  picker.on("change", (event) => {
    expect(event.value).toEqual(picker.getValue());
    seen.push("change");
  });
  picker.on("confirm", (event) => {
    expect(event.value).toEqual(picker.getValue());
    seen.push("confirm");
  });
  picker.open();
  picker.dialogElement.querySelectorAll<HTMLElement>("[role=option]")[3].dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
  );
  picker.dialogElement.querySelector<HTMLButtonElement>(".mtrl-time-picker__confirm")!.click();
  expect(seen).toEqual(["input", "change", "confirm"]);
});

test("select empty option id reports the null getter while keeping option metadata", async () => {
  const select = mount(createSelect({ options: [{ id: "a", text: "Alpha" }, { id: "", text: "None" }], value: "a" }));
  const seen: unknown[] = [];
  select.on("change", (event) => {
    expect(event.value).toEqual(select.getValue());
    expect(event.option.id).toBe("");
    seen.push(event.value);
  });
  await wait();
  innerMenu(select)!.element.querySelector<HTMLElement>('[data-id=""]')!.click();
  expect(seen).toEqual([null]);
});

test("radio empty option id still reports its factory getter", () => {
  const radios = mount(createRadios({ name: "test", options: [{ value: "a", label: "Alpha" }, { value: "", label: "None" }] }));
  let seen = 0;
  radios.on("change", (event) => {
    expect(event.value).toEqual(radios.getValue());
    seen++;
  });
  radios.radios[0].input.click();
  radios.radios[1].input.click();
  expect(seen).toBe(2);
});
