#!/usr/bin/env bun
// Type-checks src/ with strictFunctionTypes, against a list of files that do
// not pass yet.
//
// The same shape as `check-strict-null.ts`, for the last strict-family flag
// still off. tsconfig.json now sets every other one -- noImplicitAny,
// strictNullChecks, strictBindCallApply, strictPropertyInitialization,
// alwaysStrict, useUnknownInCatchVariables, noImplicitThis -- so once this
// list is empty, `strict: true` is a one-line change and F14 is closed.
//
// Why these 17 files are not simply fixed. Each component's factory pipes a
// producer whose `on` takes `EventCallback` into an internal host declaring
// `on: (event: string, handler: Function) => …`. `Function` is a supertype of
// every handler, so under strictFunctionTypes a host promising to call a
// handler with anything cannot accept one that takes a typed payload, and the
// pipe stops resolving -- which types every stage after it `unknown`, so one
// root surfaces as a cluster of errors.
//
// The internal host is not the whole story, and this is the part worth
// knowing before trying the obvious fix: narrowing the host alone makes it
// disagree with the *public* interface it has to satisfy, because these
// components declare `on: (event: string, handler: Function) => XComponent`
// in their own types.ts. Measured rather than guessed -- narrowing all 22
// internal hosts on their own took the count from 27 errors to 49. The public
// declaration has to move at the same time, and that is a contract change,
// milestoned separately.
//
// The two components already off this list are the two that needed no
// contract change: slider's public `on` was already typed, and tabs' public
// `on` is written in method shorthand, which stays bivariant even under
// strictFunctionTypes.
//
// The exclusions shrink. They never grow: adding a file here means a file
// that passed strictFunctionTypes no longer does, which is a regression.
//
//   bun run scripts/check-strict-function-types.ts
import { execFileSync } from "node:child_process";

/** Files with strictFunctionTypes errors left to fix (F14). */
const PENDING: string[] = [
  "src/components/carousel/carousel.ts",
  "src/components/checkbox/checkbox.ts",
  "src/components/chips/chips.ts",
  "src/components/datepicker/datepicker.ts",
  "src/components/drawer/drawer.ts",
  "src/components/extended-fab/extended-fab.ts",
  "src/components/icon-button/icon-button.ts",
  "src/components/progress/progress.ts",
  "src/components/radios/radios.ts",
  "src/components/switch/switch.ts",
  "src/components/textfield/textfield.ts",
  "src/components/timepicker/timepicker.ts",
];

const EXCLUDED = new Set(PENDING);

const raw = (() => {
  try {
    execFileSync("bunx", ["tsc", "-p", "tsconfig.strictfn.json"], {
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
    `\n${offenders.length} strictFunctionTypes error(s) outside the pending list.\n` +
      `Fix them. The PENDING list only shrinks: a file that passed before must keep passing.`
  );
  process.exit(1);
}

// A file that starts passing has to leave the list, or the list stops being a
// record of the work left and quietly becomes a list nobody rechecks.
const fixed = PENDING.filter((file) => !silenced.has(file));
if (fixed.length > 0) {
  for (const file of fixed) console.error(`  ${file}`);
  console.error(
    `\n${fixed.length} pending file(s) now pass strictFunctionTypes.\n` +
      `Delete them from PENDING in scripts/check-strict-function-types.ts.`
  );
  process.exit(1);
}

console.log(
  `strictFunctionTypes: ${PENDING.length} file(s) pending, everything else passes.`
);
