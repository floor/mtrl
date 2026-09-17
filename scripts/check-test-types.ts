#!/usr/bin/env bun
// Type-checks the test tree against the real shipped source.
//
// `tsconfig.test.json` existed for months and ran never. Two faults kept it
// from reading a single test file: `noStrictGenericChecks` was removed from
// TypeScript (a hard config error on 5.x), and a `typeRoots` override excluded
// node_modules, so the bun type library was never found. Both are fixed; this
// script is what stops it rotting again.
//
// Why a gate over a file list rather than a plain `tsc -p`:
//
//   With the config running, the tree reported 235 errors, none in src/. About
//   sixty were ordinary fixture looseness in real suites and were fixed. The
//   rest, 174, sit in the 20 component suites below. Each asserts against a mock
//   defined in its own file rather than the shipped factory, and each mock has
//   drifted from the component it claims to stand in for -- which is what a
//   `TS2339` on a mock says. That is finding F6. Gating the whole tree would be
//   red on arrival and get switched off.
//
//   So the gate covers everything else, and names these. Porting a suite to
//   the real factory is then a one-line deletion from the list below, and the
//   list is the public record of how far F6 has to go.
//
// The exclusions shrink. They never grow: adding a file here means a suite
// that used to type-check no longer does, which is a regression, not a chore.
//
//   bun run scripts/check-test-types.ts
import { execFileSync } from "node:child_process";

/** Suites that assert against in-file mocks which have drifted (F6). */
const DRIFTED = [
  "test/components/badge.test.ts",
  "test/components/card.test.ts",
  "test/components/chip.test.ts",
  "test/components/datepicker.test.ts",
  "test/components/divider.test.ts",
  "test/components/drawer.test.ts",
  "test/components/list.test.ts",
  "test/components/select.test.ts",
  "test/components/slider.test.ts",
  "test/components/timepicker.test.ts",
];

const EXCLUDED = new Set(DRIFTED);

const raw = (() => {
  try {
    execFileSync("bunx", ["tsc", "-p", "tsconfig.test.json", "--noEmit"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return "";
  } catch (error) {
    const e = error as { stdout?: string; stderr?: string };
    return `${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
})();

const ERROR_LINE = /^(\S+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

const offenders: string[] = [];
const silenced = new Set<string>();

for (const line of raw.split("\n")) {
  const match = ERROR_LINE.exec(line.trim());
  if (!match) continue;
  const [, file] = match;
  if (EXCLUDED.has(file)) {
    silenced.add(file);
    continue;
  }
  offenders.push(line.trim());
}

if (offenders.length > 0) {
  for (const offender of offenders) console.error(`  ${offender}`);
  console.error(
    `\n${offenders.length} type error(s) in the checked test files.\n` +
      `Fix them. The DRIFTED list only shrinks: a file that type-checked before must keep doing so.`,
  );
  process.exit(1);
}

// A file that stops erroring should leave the list, or the list stops meaning
// anything. This is the ratchet: it only ever tightens.
const stale = [...EXCLUDED].filter((file) => !silenced.has(file)).sort();
if (stale.length > 0) {
  console.error("These files are excluded but no longer produce errors:");
  for (const file of stale) console.error(`  ${file}`);
  console.error(
    `\nRemove them from the list in scripts/check-test-types.ts. ` +
      `An exclusion that protects nothing hides the next regression.`,
  );
  process.exit(1);
}

console.log(
  `check-test-types: the test tree type-checks, ` +
    `${DRIFTED.length} drifted mock suite(s) still excluded (F6)`,
);
