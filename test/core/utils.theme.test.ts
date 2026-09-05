// test/core/utils.theme.test.ts
import { describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).MutationObserver = dom.window.MutationObserver;
(globalThis as any).getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

const { onThemeChange, getThemeColor } = await import("../../src/core/utils/theme");

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("theme utils", () => {
  test("onThemeChange fires for data-theme set on <html> and on <body>", async () => {
    let calls = 0;
    const off = onThemeChange(() => calls++);
    document.documentElement.setAttribute("data-theme", "ocean");
    await tick();
    expect(calls).toBe(1);
    document.body.setAttribute("data-theme-mode", "dark");
    await tick();
    expect(calls).toBe(2);
    off();
    document.documentElement.setAttribute("data-theme", "forest");
    await tick();
    expect(calls).toBe(2);
  });

  test("getThemeColor falls back when the variable is not defined", () => {
    expect(getThemeColor("sys-color-nope", { fallback: "#123456" })).toBe("#123456");
  });
});
