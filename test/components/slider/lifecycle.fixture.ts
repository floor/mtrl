import { afterEach, beforeEach, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import createSlider from "../../../src/components/slider";
import { createCanvasThemeObserver, initializeCanvasWithRetry } from "../../../src/core/canvas/utils";

let dom: JSDOM;
let restore: (() => void)[];
let cleanup: (() => void)[];
let draws: Map<HTMLCanvasElement, number>;
let frames: Map<number, FrameRequestCallback>;
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
  restore = [];
  cleanup = [];
  draws = new Map();
  frames = new Map();
  function replace(target: object, name: string, value: unknown) {
    const previous = Object.getOwnPropertyDescriptor(target, name);
    Object.defineProperty(target, name, { value, writable: true, configurable: true });
    restore.push(() => {
      if (previous) Object.defineProperty(target, name, previous);
      else Reflect.deleteProperty(target, name);
    });
  }
  for (const name of ["document", "HTMLElement", "Element", "Node", "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "MutationObserver", "getComputedStyle"]) {
    replace(globalThis, name, Reflect.get(dom.window, name));
  }
  replace(globalThis, "window", dom.window);
  replace(globalThis, "ResizeObserver", undefined);
  let nextFrame = 0;
  replace(globalThis, "requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  replace(globalThis, "cancelAnimationFrame", (id: number) => frames.delete(id));
  replace(dom.window.HTMLCanvasElement.prototype, "getContext", function(this: HTMLCanvasElement) {
    const canvas = this;
    // Drawing is observed, not rasterized: exercise the real slider and subscriptions.
    return new Proxy({}, {
      get(target, property) {
        if (Reflect.has(target, property)) return Reflect.get(target, property);
        if (property === "clearRect") return () => draws.set(canvas, (draws.get(canvas) ?? 0) + 1);
        return () => {};
      },
      set(target, property, value) { return Reflect.set(target, property, value); },
    });
  });
});
afterEach(() => {
  cleanup.reverse().forEach(fn => fn());
  restore.reverse().forEach(fn => fn());
  dom.window.close();
});
const theme = async (name: string) => {
  document.documentElement.setAttribute("data-theme", name);
  await tick();
};
const slider = () => {
  const component = createSlider({ value: 25 });
  document.body.append(component.element);
  cleanup.push(() => component.destroy());
  return component;
};
const flushFrames = () => {
  for (const [id, callback] of [...frames]) {
    frames.delete(id);
    callback(performance.now());
  }
};

test("canvas observer cleanup stops notifications while another subscriber remains active", async () => {
  let stopped = 0, active = 0;
  const off = createCanvasThemeObserver("primary", () => stopped++);
  const other = createCanvasThemeObserver("secondary", () => active++);
  cleanup.push(() => off?.(), () => other?.());
  expect(typeof off).toBe("function");
  await theme("ocean");
  expect(stopped).toBe(1);
  expect(active).toBe(1);
  off!(); off!();
  await theme("forest");
  expect(stopped).toBe(1);
  expect(active).toBe(2);
});

test("real slider destruction releases the theme callback without stopping a live slider", async () => {
  const removed = slider(), live = slider();
  await tick(); flushFrames();
  const removedCanvas = removed.element.querySelector("canvas")!;
  const liveCanvas = live.element.querySelector("canvas")!;
  removed.destroy();
  draws.clear();
  await theme("desert");
  expect(draws.get(removedCanvas) ?? 0).toBe(0);
  expect(draws.get(liveCanvas)).toBe(1);
});

test("colour replacement redraws and keeps one subscription until destruction", async () => {
  const component = slider();
  await tick(); flushFrames();
  const canvas = component.element.querySelector("canvas")!;
  for (const color of ["secondary", "tertiary", "primary"] as const) {
    draws.clear();
    component.setColor(color);
    expect(draws.get(canvas)).toBe(1);
    draws.clear();
    await theme(color);
    expect(draws.get(canvas)).toBe(1);
  }
  component.destroy();
  component.setColor("secondary");
  draws.clear();
  await theme("winter");
  expect(draws.size).toBe(0);
});

test("destroy before initialization cancels queued canvas drawing", async () => {
  const component = slider();
  component.destroy();
  draws.clear();
  expect(frames.size).toBe(0);
  await tick(); flushFrames();
  expect(draws.size).toBe(0);
});


test("aborting canvas initialization cancels both retry phases", async () => {
  for (const afterFrame of [false, true]) {
    const lifetime = new AbortController();
    let attempts = 0, successes = 0;
    expect(initializeCanvasWithRetry(() => { attempts++; return false; }, () => successes++, lifetime.signal)).toBe(false);
    if (afterFrame) flushFrames();
    lifetime.abort();
    const before = attempts;
    expect(frames.size).toBe(0);
    await new Promise(resolve => setTimeout(resolve, 120));
    expect(attempts).toBe(before);
    expect(successes).toBe(0);
  }
});

test("appearance setup preserves disabled-state canvas redraws", async () => {
  const component = slider();
  await tick(); flushFrames();
  const canvas = component.element.querySelector("canvas")!;
  draws.clear();
  component.disable();
  expect(draws.get(canvas)).toBe(1);
  component.enable();
  expect(draws.get(canvas)).toBe(2);
});
