import { expect, test } from "bun:test";
import createSlider from "../../../src/components/slider";
import type { SliderEvent } from "../../../src/components/slider/types";
import { callbacksFixture, wait } from "../callbacks.fixture";

const mount = callbacksFixture();

test("slider setters and keyboard events expose the finished slider", async () => {
  const seen: SliderEvent[] = [];
  const slider = mount(createSlider({ value: 20, secondValue: 80, range: true, on: { change: event => { seen.push(event); } } }));
  slider.setValue(30);
  slider.setSecondValue(70);
  await wait();
  const handle = slider.element.querySelector<HTMLElement>('[role="slider"]')!;
  handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  expect(seen.length).toBeGreaterThanOrEqual(3);
  for (const event of seen) expect(event.slider === slider).toBe(true);
  expect(seen[0].slider.getValue()).toBe(slider.getValue());
  expect(seen[0].value).toBe(30);
});
