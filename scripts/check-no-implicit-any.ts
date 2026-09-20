#!/usr/bin/env bun
// Type-checks src/ with noImplicitAny, against a list of files that do not
// pass yet.
//
// The companion to check-strict-null.ts, and the second half of F14. That one
// reached zero, which is what unblocked this: the plan was always
// strictNullChecks first, then noImplicitAny, then `strict: true`.
//
// Turning noImplicitAny on reports 270 errors in the 40 files below, nearly
// all TS7006 — a parameter with no type, most often `component`, `e` or
// `event`. Those need real types rather than a bulk edit, so gating the whole
// tree would be red on arrival and get switched off. The gate covers
// everything else and names these.
//
// The exclusions shrink. They never grow: adding a file here means a file that
// passed noImplicitAny no longer does, which is a regression, not a chore.
//
//   bun run scripts/check-no-implicit-any.ts
import { execFileSync } from "node:child_process";

/** Files with noImplicitAny errors left to fix (F14). */
const PENDING = [
  "src/components/chips/config.ts",
  "src/components/chips/features/controller.ts",
  "src/components/menu/config.ts",
  "src/components/menu/features/controller.ts",
  "src/components/menu/features/submenu.ts",
  "src/components/slider/config.ts",
  "src/components/slider/features/controller.ts",
  "src/components/slider/features/handlers.ts",
];

const EXCLUDED = new Set(PENDING);

const raw = (() => {
  try {
    execFileSync("bunx", ["tsc", "-p", "tsconfig.noimplicitany.json"], {
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
    `\n${offenders.length} noImplicitAny error(s) outside the pending list.\n` +
      `Fix them. The PENDING list only shrinks: a file that passed before must keep passing.`,
  );
  process.exit(1);
}

// A file that stops erroring should leave the list, or the list stops meaning
// anything. This is the ratchet: it only ever tightens.
const stale = [...EXCLUDED].filter((file) => !silenced.has(file)).sort();
if (stale.length > 0) {
  console.error("These files now pass noImplicitAny and must leave PENDING in scripts/check-no-implicit-any.ts:");
  for (const file of stale) console.error(`  ${file}`);
  process.exit(1);
}

console.log(`noImplicitAny: ${silenced.size} file(s) pending, everything else passes.`);

if (silenced.size === 0) {
  console.log(
    "PENDING is empty. `strict: true` in tsconfig.json is the last step of F14.",
  );
}
