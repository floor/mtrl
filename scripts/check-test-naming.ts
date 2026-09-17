#!/usr/bin/env bun
// Fails when a file under test/ defines tests but is not named so the runner
// collects it.
//
// This exists because two suites sat in the tree for months without ever
// running. `test/core/compose/features/checkable.ts` and `disabled.ts` held 24
// tests between them and lacked the `.test.ts` suffix, so bun never picked
// them up. Nothing reported a skip: a directory listing showed them sitting
// next to their `.test.ts` siblings, so the checkbox/radio/switch primitive
// looked covered while it was unverified. When they were finally renamed and
// run, 8 of the 24 failed, one of them a real defect in withDisabled.
//
// A test that is never collected is worse than a missing test, because it
// reads as coverage. This guard makes that state impossible to reach again.
//
//   bun run scripts/check-test-naming.ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const TEST_DIR = join(ROOT, "test");

/** Suffixes the runner collects, plus fixtures that are spawned deliberately. */
const COLLECTED = /\.(test|fixture)\.tsx?$/;

/** A call in statement position: describe(, test(, it(, and their modifiers. */
const DEFINES_TESTS = /^[\t ]*(describe|test|it)(\.\w+)*\s*\(/m;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (/\.tsx?$/.test(entry)) out.push(path);
  }
  return out;
}

const offenders: { file: string; line: number; call: string }[] = [];

for (const file of walk(TEST_DIR)) {
  if (COLLECTED.test(file)) continue;
  const source = readFileSync(file, "utf8");
  const match = DEFINES_TESTS.exec(source);
  if (!match) continue;
  const line = source.slice(0, match.index).split("\n").length;
  offenders.push({ file: relative(ROOT, file), line, call: match[1] });
}

if (offenders.length > 0) {
  for (const o of offenders) {
    console.error(
      `${o.file}:${o.line}: defines tests with ${o.call}( but is not named *.test.ts or *.fixture.ts, so it never runs`,
    );
  }
  console.error(
    `\n${offenders.length} file(s) define tests the runner will not collect.`,
  );
  process.exit(1);
}

console.log("check-test-naming: every file defining tests is collectable");
