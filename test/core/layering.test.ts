// test/core/layering.test.ts
//
// Core does not import from components.
//
// FLO-115. `core/config/global.ts` hardcoded a `ComponentConfigMap` naming
// nine components and importing their config types, which inverted the
// layering: mtrl-addons builds on core, and core was reaching down into
// leaves. Each component now registers its own key by augmenting the
// interface from its own `types.ts`.
//
// This is a module-graph property, and a type fixture cannot see it — I tried.
// `test/types/contract-cleanup.fixture.ts` asserts the map's keys, but the old
// hardcoded map had those same keys, so reverting `global.ts` left every
// assertion true. Only reading the imports catches it.

import { describe, test, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (path.endsWith(".ts")) out.push(path);
  }
  return out;
};

/** `from "…"` / `from '…'`, including `import type`. */
const IMPORTS = /\bfrom\s+["']([^"']+)["']/g;

describe("core does not import from components", () => {
  const files = walk("src/core");

  test("there is something to check", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  // One file is knowingly excluded. `compose/features/badge.ts` imports
  // `createBadge` as a *value*, so core depends on a component at runtime --
  // a worse instance of the same inversion than the config map FLO-115 names,
  // and one that finding did not mention. Fixing it means deciding where
  // `withBadge` should live, which is a design decision rather than a
  // cleanup, so it is recorded on FLO-115 and named here.
  //
  // This list only shrinks. Adding to it means core reached into components
  // again, which is a regression, not a chore.
  const KNOWN = ["src/core/compose/features/badge.ts"];

  test("no file under src/core imports from src/components", () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(IMPORTS)) {
        const target = match[1];
        // A relative hop out of core and into components, however deep.
        const reachesIntoComponents =
          /(^|\/)\.\.\/components\//.test(target) || target.includes("/components/");
        if (reachesIntoComponents && !KNOWN.includes(file)) {
          offenders.push(`${file} -> ${target}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  // The augmentation is the mechanism that replaced those imports, so it
  // should exist. If a component stops registering itself, its key silently
  // disappears from the map rather than erroring, which is the failure mode
  // worth catching.
  test("components register themselves on the config map", () => {
    const registering = walk("src/components").filter((file) =>
      readFileSync(file, "utf8").includes('declare module "../../core/config/global"')
    );

    expect(registering.length).toBeGreaterThanOrEqual(9);
  });
});
