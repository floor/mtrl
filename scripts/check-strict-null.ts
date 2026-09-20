#!/usr/bin/env bun
// Type-checks src/ with strictNullChecks, against a list of files that do not
// pass yet.
//
// tsconfig.json has `strict: false`, while the repository's own notes claimed
// strict mode (F14). Turning strictNullChecks on reported 257 errors in 79
// files; one narrowing in core/config/component.ts cleared 22 of the files,
// and the 57 below hold the 225 that remain. Gating the whole tree would be
// red on arrival and get switched off, so the gate covers everything else and
// names these. Fixing a file is then a one-line deletion from the list, and
// the list is the public record of how far strictNullChecks has to go;
// noImplicitAny follows once it is empty.
//
// The exclusions shrink. They never grow: adding a file here means a file that
// passed strictNullChecks no longer does, which is a regression, not a chore.
//
//   bun run scripts/check-strict-null.ts
import { execFileSync } from "node:child_process";

/** Files with strictNullChecks errors left to fix (F14). */
const PENDING = [
  "src/components/bottom-app-bar/bottom-app-bar.ts",
  "src/components/button/button.ts",
  "src/components/chips/api.ts",
  "src/components/chips/chip/chip.ts",
  "src/components/chips/config.ts",
  "src/components/datepicker/api.ts",
  "src/components/datepicker/config.ts",
  "src/components/datepicker/datepicker.ts",
  "src/components/datepicker/utils.ts",
  "src/components/drawer/drawer.ts",
  "src/components/icon-button/icon-button.ts",
  "src/components/navigation-rail/navigation-rail.ts",
  "src/components/navigation/features/items.ts",
  "src/components/navigation/system/core.ts",
  "src/components/navigation/system/events.ts",
  "src/components/navigation/system/mobile.ts",
  "src/components/progress/features/canvas.ts",
  "src/components/segmented-button/segment.ts",
  "src/components/segmented-button/segmented-button.ts",
  "src/components/slider/slider.ts",
  "src/components/tabs/features.ts",
  "src/components/tabs/tab.ts",
  "src/components/tabs/utils.ts",
  "src/components/textfield/config.ts",
  "src/components/timepicker/api.ts",
  "src/components/timepicker/render.ts",
  "src/components/timepicker/timepicker.ts",
  "src/components/tooltip/api.ts",
  "src/components/top-app-bar/top-app-bar.ts",
];

const EXCLUDED = new Set(PENDING);

const raw = (() => {
  try {
    execFileSync("bunx", ["tsc", "-p", "tsconfig.strictnull.json"], {
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
    `\n${offenders.length} strictNullChecks error(s) outside the pending list.\n` +
      `Fix them. The PENDING list only shrinks: a file that passed before must keep passing.`,
  );
  process.exit(1);
}

// A file that stops erroring should leave the list, or the list stops meaning
// anything. This is the ratchet: it only ever tightens.
const stale = [...EXCLUDED].filter((file) => !silenced.has(file)).sort();
if (stale.length > 0) {
  console.error("These files now pass strictNullChecks and must leave PENDING in scripts/check-strict-null.ts:");
  for (const file of stale) console.error(`  ${file}`);
  process.exit(1);
}

console.log(`strictNullChecks: ${silenced.size} file(s) pending, everything else passes.`);
