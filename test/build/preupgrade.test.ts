// Pre-upgrade styles (src/styles/elements): the rules scripts/build-styles.ts
// emits with each element's CSS module and as elements/preupgrade.css.
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import * as sass from "sass";
import { preupgradeStyles } from "../../scripts/build-styles";
import { elements } from "../../src/elements";
import {
  preupgradeSheet,
  registerPreupgrade,
  retagPreupgrade,
  usePreupgradePrefix,
} from "../../src/elements/styles";

const options: sass.StringOptions<"sync"> = {
  loadPaths: [resolve("src/styles")], style: "compressed", logger: sass.Logger.silent,
};
const names = Object.values(elements).map((element) => element.spec.name);
const rules = await preupgradeStyles(names, options);

/** The selectors of compressed CSS without nested at-rules. */
const selectors = (css: string): string[] =>
  Array.from(css.matchAll(/([^{}]+)\{[^{}]*\}/g), (match) => match[1].split(",")).flat();

describe("pre-upgrade styles", () => {
  test("every element has rules", () => {
    expect([...rules.keys()].sort()).toEqual([...names].sort());
    for (const [name, css] of rules) expect(css, name).toContain(`m-${name}:not(:defined)`);
  });

  test("every rule is scoped to an undefined element, so none reaches an upgraded one", () => {
    const tags = new Set(names.map((name) => `m-${name}`));
    for (const [name, css] of rules) {
      for (const selector of selectors(css)) {
        const tag = /^(m-[a-z-]+):not\(:defined\)/.exec(selector)?.[1];
        expect(tag && tags.has(tag) ? tag : selector, name).toBe(`m-${name}`);
      }
    }
  });

  test("retagging for another prefix gives what the SCSS builds with that prefix", () => {
    for (const name of names) {
      const css = sass.compileString(`@use "elements/config" with ($tag-prefix: "x-y"); @use "elements/${name}";`, options).css;
      expect(retagPreupgrade(rules.get(name) as string, "x-y"), name).toBe(css);
    }
  });

  test("the SCSS index is every element's rules, with the prefix configurable", () => {
    const css = sass.compileString(`@use "elements" with ($tag-prefix: "x");`, options).css;
    for (const name of names) expect(css, name).toContain(retagPreupgrade(rules.get(name) as string, "x"));
    expect(css).not.toMatch(/(^|[\s,>+~(}])m-[a-z]/);
  });

  test("the sheet is one cascade layer, per prefix", () => {
    expect(preupgradeSheet("m-a:not(:defined){display:block}", ["m", "x"])).toBe(
      "@layer mtrl.preupgrade{m-a:not(:defined){display:block}x-a:not(:defined){display:block}}"
    );
  });

  test("registering records the rules on a server and applies them in a page, per prefix", () => {
    // Other test files may have left a DOM behind: this one sets its own.
    const global = globalThis as { document?: Document };
    const previous = global.document;
    delete global.document;
    const { window } = new JSDOM("<!doctype html><html><head></head><body></body></html>");
    try {
      // No DOM: recorded only, as when an adapter imports the CSS modules on a server.
      registerPreupgrade({ switch: rules.get("switch") as string });

      global.document = window.document;
      const text = (): string => Array.from(window.document.querySelectorAll("style"), (style) => style.textContent).join("");
      usePreupgradePrefix("x");
      expect(text()).toContain("@layer mtrl.preupgrade{m-switch:not(:defined)");
      expect(text()).toContain("x-switch:not(:defined)");
      registerPreupgrade({ tabs: rules.get("tabs") as string });
      expect(text()).toContain("x-tabs:not(:defined)");
      expect(window.document.querySelectorAll("style").length).toBe(1);
    } finally {
      if (previous) global.document = previous;
      else delete global.document;
      window.close();
    }
  });

  test("pre-upgrade rules are installed in each document", () => {
    const global = globalThis as { document?: Document };
    const previous = global.document;
    const first = new JSDOM("<!doctype html><html><head></head><body></body></html>");
    const second = new JSDOM("<!doctype html><html><head></head><body></body></html>");
    try {
      global.document = first.window.document;
      registerPreupgrade({ switch: rules.get("switch") as string });
      expect(first.window.document.head.querySelector("style")?.textContent).toContain("m-switch:not(:defined)");

      global.document = second.window.document;
      registerPreupgrade({ switch: rules.get("switch") as string });
      expect(second.window.document.head.querySelector("style")?.textContent).toContain("m-switch:not(:defined)");
    } finally {
      if (previous) global.document = previous;
      else delete global.document;
      first.window.close();
      second.window.close();
    }
  });
});
