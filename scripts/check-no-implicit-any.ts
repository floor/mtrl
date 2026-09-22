#!/usr/bin/env bun
// Retains the zero-exclusion noImplicitAny guard from FLO-114.
// Strict mode is now enabled in tsconfig.json. All files from the original
// noImplicitAny migration have been cleared from the pending list.
// The list must stay empty: new errors fail instead of becoming exclusions.
//
//   bun run scripts/check-no-implicit-any.ts
import { execFileSync } from "node:child_process";

/** Files with noImplicitAny errors left to fix (F14). */
// Empty: every file that had noImplicitAny errors has been typed. The list
// stays, and so does the staleness check below, because the point of a ratchet
// is that it cannot be added to -- a new file with implicit anys fails here
// rather than being appended.
const PENDING: string[] = [];

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
    "PENDING is empty. Strict mode is enabled in tsconfig.json (FLO-114).",
  );
}
