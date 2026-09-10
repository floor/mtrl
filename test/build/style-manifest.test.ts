import { describe, expect, test } from "bun:test";
import { resolveStyleDependencies } from "../../scripts/style-manifest";

describe("CSS dependency validation", () => {
  test("orders shared dependencies once before their consumers", () => {
    const manifest = {
      button: { source: "button", dependencies: ["progress"] },
      progress: { source: "progress", dependencies: [] },
      group: { source: "group", dependencies: ["button", "progress"] },
    };
    expect(resolveStyleDependencies(["group", "button"], manifest)).toEqual(["progress", "button", "group"]);
  });
  test("rejects missing dependencies instead of publishing broken CSS imports", () => {
    expect(() => resolveStyleDependencies(["button"], {
      button: { source: "button", dependencies: ["progress"] },
    })).toThrow("Unknown CSS dependency: progress");
  });
  test("rejects cycles instead of recursing or emitting circular CSS", () => {
    expect(() => resolveStyleDependencies(["a"], {
      a: { source: "a", dependencies: ["b"] },
      b: { source: "b", dependencies: ["a"] },
    })).toThrow("CSS dependency cycle");
  });
});
