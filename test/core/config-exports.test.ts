// test/core/config-exports.test.ts
//
// `createComponentConfig` existed twice under one name: the live one in
// core/config/component.ts, which 44 files call and the package exports, and a
// dead one in core/config.ts that nothing imported. F27 (FLO-123) names that
// duplication, and removing the dead one is only safe if something says which
// of the two survived.
//
// Nothing did. The package's own export of it was untested, so deleting the
// wrong one would have compiled, passed the suite, and shipped a different
// function under the same public name.
//
// These assert the surviving one by its behaviour, not merely its presence: it
// takes defaults, a user config and a component name, and merges them in that
// order of precedence. The dead one took a single `type` string and returned a
// config object of class-name generators — it could not satisfy any of this.

import { describe, test, expect } from "bun:test";

import { createComponentConfig, createElementConfig, PREFIX } from "../../src";

describe("the package exports the live createComponentConfig", () => {
  test("it is exported at all", () => {
    expect(typeof createComponentConfig).toBe("function");
    expect(typeof createElementConfig).toBe("function");
  });

  test("it merges a user config over the defaults", () => {
    const merged = createComponentConfig(
      { variant: "filled", size: "medium" },
      { size: "large" },
      "button",
    );

    expect(merged.variant).toBe("filled");
    expect(merged.size).toBe("large");
  });

  test("it stamps the component name and the prefix", () => {
    const merged = createComponentConfig({}, {}, "button");

    expect(merged.componentName).toBe("button");
    expect(merged.prefix).toBe(PREFIX);
  });

  test("the component name wins over anything the user passes", () => {
    const merged = createComponentConfig(
      {},
      { componentName: "something-else" } as never,
      "button",
    );

    expect(merged.componentName).toBe("button");
  });

  test("a user config is optional", () => {
    const merged = createComponentConfig({ variant: "text" }, undefined, "button");

    expect(merged.variant).toBe("text");
    expect(merged.componentName).toBe("button");
  });

  // The dead one's whole surface: createComponentConfig("button") returning an
  // object with getClass/getModifierClass/getElementClass. If that is what the
  // package ever exports again, the wrong function survived a cleanup.
  test("it is not the class-name-generator one that used to share the name", () => {
    const result = createComponentConfig({}, {}, "button") as Record<string, unknown>;

    expect(result.getClass).toBeUndefined();
    expect(result.getModifierClass).toBeUndefined();
    expect(result.getElementClass).toBeUndefined();
    expect(result.baseClass).toBeUndefined();
  });
});
