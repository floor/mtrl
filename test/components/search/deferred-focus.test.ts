// test/components/search/deferred-focus.test.ts

import { expect, test } from "bun:test";
import createSearch from "../../../src/components/search";
import { callbacksFixture, wait } from "../callbacks.fixture";

const mount = callbacksFixture();

test("dismissing a view before its opening frame leaves it closed", async () => {
  const search = mount(createSearch({ collapseOnBlur: false }));
  await wait(); // Install the input's focus handler.

  const frames = new Map<number, FrameRequestCallback>();
  const previousRequest = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  let nextFrame = 0;
  globalThis.requestAnimationFrame = (callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  };
  globalThis.cancelAnimationFrame = (frame) => { frames.delete(frame); };
  try {
    search.expand();
    expect(frames.size).toBe(1);
    search.collapse();
    expect(search.isExpanded()).toBe(false);
    expect(frames.size).toBe(0);
    for (const callback of frames.values()) callback(0);
    expect(search.isExpanded()).toBe(false);
  } finally {
    globalThis.requestAnimationFrame = previousRequest;
    globalThis.cancelAnimationFrame = previousCancel;
  }
});

test("destroy cancels a search view's pending focus frame", () => {
  const search = mount(createSearch());
  const frames = new Map<number, FrameRequestCallback>();
  const previousRequest = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  let nextFrame = 0;
  globalThis.requestAnimationFrame = (callback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  };
  globalThis.cancelAnimationFrame = (frame) => { frames.delete(frame); };
  try {
    search.expand();
    expect(frames.size).toBe(1);
    search.destroy();
    expect(frames.size).toBe(0);
  } finally {
    globalThis.requestAnimationFrame = previousRequest;
    globalThis.cancelAnimationFrame = previousCancel;
  }
});
