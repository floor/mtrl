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

  // FLO-389: a theme set on a section, a card or a dark panel
  test("onThemeChange fires for data-theme set on any element in the document", async () => {
    let calls = 0;
    const off = onThemeChange(() => calls++);
    const section = document.createElement("section");
    const card = document.createElement("div");
    section.append(card);
    document.body.append(section);
    card.setAttribute("data-theme-mode", "dark");
    await tick();
    expect(calls).toBe(1);
    section.setAttribute("data-theme", "ocean");
    await tick();
    expect(calls).toBe(2);
    card.setAttribute("class", "unrelated");
    await tick();
    expect(calls).toBe(2);
    off();
    section.remove();
  });

  test("getThemeColor reads the theme where the given element sits", () => {
    document.documentElement.style.setProperty("--mtrl-sys-color-primary", "#6750a4");
    const panel = document.createElement("div");
    // JSDOM does not inherit custom properties: the tokens sit on the element
    panel.style.setProperty("--mtrl-sys-color-primary", "#d0bcff");
    expect(getThemeColor("sys-color-primary", { element: panel })).toBe("#6750a4");
    document.body.append(panel);
    expect(getThemeColor("sys-color-primary", { element: panel })).toBe("#d0bcff");
    expect(getThemeColor("sys-color-primary", { element: panel, alpha: 0.5 })).toBe("rgba(208, 188, 255, 0.5)");
    // 0.10 derived the -rgb twin the themes no longer declare; 1.0 does not (FLO-311)
    expect(getThemeColor("sys-color-primary-rgb", { element: panel })).toBe("");
    expect(getThemeColor("sys-color-primary-rgb", { element: panel, fallback: "x" })).toBe("x");
    expect(getThemeColor("sys-color-nope", { element: panel, fallback: "#123456" })).toBe("#123456");
    expect(getThemeColor("sys-color-primary")).toBe("#6750a4");
    panel.remove();
  });

  test("getThemeColor falls back when the variable is not defined", () => {
    expect(getThemeColor("sys-color-nope", { fallback: "#123456" })).toBe("#123456");
  });

  test("getThemeColor reads a colour role and turns a hex into rgba with alpha", () => {
    document.documentElement.style.setProperty("--mtrl-sys-color-primary", "#6750a4");
    expect(getThemeColor("sys-color-primary")).toBe("#6750a4");
    expect(getThemeColor("sys-color-primary", { alpha: 0.5 })).toBe("rgba(103, 80, 164, 0.5)");
  });

  // FLO-311: the themes no longer declare --mtrl-sys-color-*-rgb, and 1.0 no
  // longer derives them: an '-rgb' name is an undeclared variable like any other.
  test("1.0 derives no -rgb twin: the role with alpha replaces it (FLO-311)", () => {
    document.documentElement.style.setProperty("--mtrl-sys-color-on-primary", "#fff");
    expect(getThemeColor("sys-color-on-primary-rgb")).toBe("");
    expect(getThemeColor("sys-color-on-primary", { alpha: 0.1 })).toBe("rgba(255, 255, 255, 0.1)");
    expect(getThemeColor("sys-color-nope-rgb", { fallback: "0, 0, 0" })).toBe("0, 0, 0");
  });
});
