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

test("real slider renders without canvas and destroy removes its handles", async () => {
  const removed = slider(), live = slider();
  await tick(); flushFrames();
  expect(document.querySelector("canvas")).toBeNull();
  removed.destroy();
  await theme("desert");
  expect(removed.element.isConnected).toBe(false);
  expect(live.element.isConnected).toBe(true);
  expect(draws.size).toBe(0);
});

test("colour replacement remains functional and cannot revive a destroyed slider", async () => {
  const component = slider();
  await tick();
  for (const color of ["secondary", "tertiary", "primary"] as const) {
    component.setColor(color);
    expect(component.getColor()).toBe(color);
    await theme(color);
  }
  component.destroy();
  component.setColor("secondary");
  await theme("winter");
  expect(component.element.isConnected).toBe(false);
  expect(draws.size).toBe(0);
});

test("destroy before initialization leaves no animation frames or canvas work", async () => {
  const component = slider();
  component.destroy();
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

test("disabled state remains accessible with DOM tracks", async () => {
  const component = slider();
  await tick();
  const handle = component.element.querySelector('[role="slider"]')!;
  component.disable();
  expect(handle.getAttribute("aria-disabled")).toBe("true");
  expect(handle.getAttribute("tabindex")).toBe("-1");
  component.enable();
  expect(handle.getAttribute("aria-disabled")).toBe("false");
  expect(handle.getAttribute("tabindex")).toBe("0");
});
