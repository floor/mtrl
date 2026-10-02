// test/ssr/markup-attributes.test.ts
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import "./css.fixture";
import { configureHTML } from "../../src/core/dom/html";
import { declarations, elements } from "../../src/elements";
import { renderElement } from "../../src/ssr";

const PROBE = "<mtrl-markup-probe></mtrl-markup-probe>";
const PROBE_ATTR = "&lt;mtrl-markup-probe&gt;&lt;/mtrl-markup-probe&gt;";

/** Declaration child → the element that reads it. */
const parents: Record<string, string> = {
  tab: "tabs",
  radio: "radios",
  "navigation-bar-item": "navigation-bar",
  "navigation-rail-item": "navigation-rail",
  "drawer-item": "drawer",
  "button-group-item": "button-group",
  chip: "chips",
  "list-item": "list",
  "carousel-item": "carousel",
  "menu-item": "menu",
  "fab-menu-item": "fab-menu",
  "select-option": "select",
  "search-suggestion": "search",
};

interface Spec {
  name: string;
  attributes?: Record<string, { type: string }>;
}

const specs = new Map<string, Spec>(Object.values(elements).map((entry) => [entry.spec.name, entry.spec]));
const decls = Object.values(declarations);

const has = (spec: Spec | undefined, name: string): boolean => spec?.attributes?.[name] !== undefined;

/** True when this render wrote the probe string through the HTML sink. */
const sank = (tag: string, attributes: Record<string, string>, children = ""): boolean => {
  let hit = false;
  configureHTML({
    sanitize(html) {
      if (html === PROBE) hit = true;
      return html;
    },
  });
  try {
    renderElement(tag, attributes, children);
  } catch {
    // An enabling attribute the element rejects is not a markup path.
  } finally {
    configureHTML(null);
  }
  return hit;
};

const hostAttempts = (spec: Spec, name: string): Record<string, string>[] => {
  const attempts: Record<string, string>[] = [{ [name]: PROBE }];
  const add = (extra: Record<string, string>): void => {
    if (Object.keys(extra).every((key) => has(spec, key))) attempts.push({ [name]: PROBE, ...extra });
  };
  // Modes the default fixtures leave off, where a string is still written as HTML.
  add({ expanded: "" });
  add({ toggle: "", selected: "" });
  add({ size: "M", value: "40" });
  add({ size: "M", value: "0" });
  add({ open: "" });
  add({ variant: "input" });
  if (has(spec, "avatar-label") && name !== "avatar-label") {
    for (const attempt of attempts) attempt["avatar-label"] = "Person";
  }
  return attempts;
};

const childMarkup = (name: string, attribute: string, extra = ""): string => {
  const spec = decls.find((decl) => decl.name === name);
  const label = attribute === "label" || attribute === "headline"
    ? ""
    : has(spec, "headline")
      ? `headline="Item"`
      : has(spec, "label")
        ? `label="Item"`
        : "";
  const icon = attribute !== "icon" && has(spec, "icon") ? `icon="x"` : "";
  const value = has(spec, "value") ? `value="a"` : "";
  return `<m-${name} ${value} ${label} ${icon} ${extra} ${attribute}="${PROBE_ATTR}"></m-${name}>`;
};

const parentAttributes = (parent: Spec, extra: Record<string, string>): Record<string, string> => {
  const attributes: Record<string, string> = { "aria-label": "Probe" };
  for (const [key, value] of Object.entries(extra)) {
    if (has(parent, key)) attributes[key] = value;
  }
  return attributes;
};

/**
 * Attribute/element pairs whose string is written with setHTML. Derived by
 * rendering every string attribute on every spec; there is no `html` attribute
 * type to read instead.
 */
const markupAttributes = (): string[] => {
  const found = new Set<string>();
  for (const spec of specs.values()) {
    for (const [name, attribute] of Object.entries(spec.attributes ?? {})) {
      if (attribute.type !== "string") continue;
      if (hostAttempts(spec, name).some((attributes) => sank(`m-${spec.name}`, attributes))) found.add(`${spec.name} ${name}`);
    }
  }
  for (const decl of decls) {
    const parentName = parents[decl.name];
    if (!parentName) throw new Error(`No parent for declaration ${decl.name}`);
    const parent = specs.get(parentName);
    if (!parent) throw new Error(`No spec for ${parentName}`);
    for (const [name, attribute] of Object.entries(decl.attributes)) {
      if (attribute.type !== "string") continue;
      const children = [
        childMarkup(decl.name, name),
        childMarkup(decl.name, name, has(decl, "variant") ? `variant="input"` : ""),
        childMarkup(decl.name, name, has(decl, "selected") ? "selected" : ""),
      ];
      const hostModes = [{}, { value: "a" }, { expanded: "" }, { open: "" }, { selection: "single" }];
      let hit = hostModes.some((mode) => children.some((markup) => sank(`m-${parent.name}`, parentAttributes(parent, mode), markup)));
      if (!hit && has(decl, "icon") && has(decl, "selected") && has(decl, "selected-icon") && (name === "icon" || name === "selected-icon")) {
        const probe = name === "icon" ? `icon="${PROBE_ATTR}"` : `icon="x" ${name}="${PROBE_ATTR}"`;
        const iconOnly = `<m-${decl.name} value="a" aria-label="Item" selected ${probe}></m-${decl.name}>`;
        hit = sank(`m-${parent.name}`, parentAttributes(parent, { selection: "single", value: "a" }), iconOnly);
      }
      if (hit) found.add(`${decl.name} ${name}`);
    }
  }
  return [...found].sort();
};

const readmeList = (): string[] => {
  const readme = readFileSync("README.md", "utf8");
  const section = readme.split("<!-- markup-attributes -->")[1]?.split("<!-- /markup-attributes -->")[0];
  expect(section, "README is missing the markup-attributes list").toBeTruthy();
  return [...section!.matchAll(/^- `([^`]+)` on `<m-([^>]+)>`/gm)].map((match) => `${match[2]} ${match[1]}`).sort();
};

test("the README lists the attributes that take markup, and only those", () => {
  const declared = decls.map((decl) => decl.name).sort();
  expect(Object.keys(parents).sort()).toEqual(declared);
  expect(readmeList()).toEqual(markupAttributes());
}, 60_000);

test("server rendering docs name unsupported runtimes, Suspense fallbacks, and each bridge's context limit", () => {
  const readme = readFileSync("README.md", "utf8");
  const changelog = readFileSync("CHANGELOG.md", "utf8");
  const react = readFileSync("src/ssr/react.ts", "utf8");
  const svelte = readFileSync("src/ssr/svelte.ts", "utf8");
  const unreleased = changelog.split("## [Unreleased]")[1]?.split("\n## [")[0] ?? "";
  for (const text of [readme, unreleased]) {
    expect(text).toContain("Worker and edge runtimes are unsupported in 1.0");
    expect(text).toContain("mtrl/ssr is server-only");
  }
  expect(readme).toContain("put a `Suspense` boundary outside the component");
  expect(readme).toContain("a button with an empty fallback has no label slot, while a text fallback gives it a slot");
  expect(readme).toContain("a boundary around a tab leaves the server-rendered root without that tab with either fallback");
  expect(unreleased).toContain("a button has no label slot with an empty fallback but has one with a text fallback");
  const shadowRoot = "server-rendered shadow root is built in a separate render, without the context of providers above the component";
  for (const text of [readme, unreleased, react, svelte]) {
    expect(text).toContain(shadowRoot);
    expect(text).toContain("The Vue and Solid bridges see the provided value in both the shadow root and light DOM.");
  }
  expect(readme).toContain("With `mtrl/ssr/react` and `mtrl/ssr/svelte`");
  expect(readme).toContain("a child requiring its context leaves that component without a declarative shadow root, while the page still renders");
  expect(readme).toContain("React and Svelte each log a development-only warning naming the element");
  expect(unreleased).toContain("The React and Svelte bridges build the server-rendered shadow root without the context");
  expect(readme).not.toContain("The Solid, Vue and Svelte bridges are not affected.");
});
