// test/ssr/opt-out.fixture.ts
import { expect, test } from "bun:test";
import "./css.fixture";
import { parseHTML } from "linkedom";
import { elements } from "../../src/elements";
import { configureHTML } from "../../src/core/dom/html";
import { clearGlobalDefaults, setComponentDefaults } from "../../src/core/config/global";
import { renderElement } from "../../src/ssr";

const parsed = (html: string) => parseHTML(`<html><body>${html}</body></html>`).document.body.firstElementChild!;
const root = (html: string) => Array.from(parsed(html).children).find(child => child.localName === "template" && child.hasAttribute("shadowrootmode"));

test("carousel and FAB menu emit only the authored host and light DOM", () => {
  for (const name of ["carousel", "fab-menu"]) {
    const children = '<span title="A &amp; B">Light</span><template><m-button>Inert</m-button></template>';
    const html = renderElement(`m-${name}`, { id: "kept", "data-note": '"<&' }, children);
    expect(root(html), name).toBeUndefined();
    const host = parsed(html);
    expect(host.id).toBe("kept");
    expect(host.getAttribute("data-note")).toBe('"<&');
    expect(host.innerHTML).toBe(parsed(`<div>${children}</div>`).innerHTML);
    expect(html).not.toContain("<style>");
    expect(renderElement(`m-${name}`, {}, "", { styles: "link", cssBase: "/css" })).toBe(`<m-${name}></m-${name}>`);
  }
});

test("opted-out factories never run; eligible light descendants still render", () => {
  for (const { spec } of Object.values(elements).filter(({ spec }) => ["carousel", "fab-menu"].includes(spec.name))) {
    const original = spec.create;
    spec.create = () => { throw new Error("opted-out factory ran"); };
    try {
      const html = renderElement(`m-${spec.name}`, {}, '<m-button label="Save"></m-button>');
      expect(root(html)).toBeUndefined();
      expect(html.match(/shadowrootmode/g)).toHaveLength(1);
      expect(html).toContain("<slot>Save</slot>");
    } finally { spec.create = original; }
  }
});

test("FAB configurations and nested submenus fall back, including with custom prefixes", () => {
  for (const attributes of [{ open: true }, { presentation: "menu" }, { open: true, presentation: "menu" }]) {
    expect(root(renderElement("m-fab-menu", attributes))).toBeUndefined();
  }
  for (const prefix of ["m", "ui"]) for (const name of ["menu", "split-button"]) {
    const child = `<${prefix}-menu-item>A<${prefix}-menu-item>B</${prefix}-menu-item></${prefix}-menu-item>`;
    const html = renderElement(`${prefix}-${name}`, {}, child, { prefix });
    expect(root(html)).toBeUndefined();
    expect(parsed(html).innerHTML).toBe(child);
    expect(root(renderElement(`${prefix}-${name}`, {}, `<${prefix}-menu-item>A</${prefix}-menu-item>`, { prefix }))).toBeDefined();
    const nested = renderElement(`${prefix}-card`, {}, html, { prefix });
    expect(nested.match(/shadowrootmode/g)).toHaveLength(1);
  }
});

test("async defaults fall back without promises escaping the server scope", async () => {
  const errors: unknown[] = [];
  const onError = (error: unknown) => errors.push(error);
  process.on("unhandledRejection", onError);
  try {
    setComponentDefaults("button", { showProgress: true });
    expect(renderElement("m-button", {}, "Save")).toBe("<m-button>Save</m-button>");
    expect(renderElement("m-split-button")).toBe("<m-split-button></m-split-button>");
    expect(renderElement("m-card", {}, "<m-button>Save</m-button>")).not.toContain("shadowrootmode");
    clearGlobalDefaults();
    setComponentDefaults("card", { buttons: [{ text: "Lazy" }] });
    expect(renderElement("m-card")).toBe("<m-card></m-card>");
    clearGlobalDefaults();
    Reflect.apply(setComponentDefaults, undefined, ["fab-menu", { presentation: "menu" }]);
    expect(renderElement("m-fab-menu")).toBe("<m-fab-menu></m-fab-menu>");
    expect(root(renderElement("m-button"))).toBeDefined();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(errors).toEqual([]);
  } finally { clearGlobalDefaults(); process.off("unhandledRejection", onError); }
});

test("opt-out preserves policy and validation boundaries", () => {
  configureHTML({ sanitize: html => html.replaceAll("before", "after") });
  try { expect(renderElement("m-carousel", {}, "before")).toBe("<m-carousel>after</m-carousel>"); }
  finally { configureHTML(null); }
  expect(() => renderElement("m-carousel", { onclick: "bad" })).toThrow(TypeError);
  expect(() => renderElement("m-carousel", {}, '<template shadowrootmode="open"></template>')).toThrow("already declares");
  expect(() => renderElement("m-carousel", {}, '<m-button onclick="bad"></m-button>')).toThrow(TypeError);
  expect(() => renderElement("m-carousel", {}, '<m-carousel>'.repeat(64) + '</m-carousel>'.repeat(64))).toThrow(RangeError);
});
