// test/build/ci-commands.test.ts
import { describe, expect, test } from "bun:test";

// What CI runs on every pull request. The jobs can be split, merged or reordered
// to make a run faster, and this list must come out the same: a check that moves
// stays in it, a check that is dropped fails here. Adding a check to CI adds it
// to this list in the same change.
const COMMANDS = [
  // static
  "ts:check", "lint", "test:naming", "test:types",
  // tests
  "bun test",
  // build, and the checks that read the built package
  "build", "elements-css:check", "tooling:check", "classes:check", "ssr-consumer:check", "size:check", "size",
  "adapters:size",
  // the browser checks
  "elements:check", "shadow-styles:check",
  "react:check", "react-ssr:check", "vue:check", "svelte:check", "svelte-ssr:check", "vue-ssr:check", "solid-ssr:check", "solid:check",
  // the same SSR checks on the lowest peer version package.json allows
  "solid-ssr:floor", "vue-ssr:floor",
  "react-types:check", "vue-types:check", "solid-types:check", "svelte-types:check",
  "react-types:floor", "vue-types:floor", "solid-types:floor", "svelte-types:floor",
  "consumer:check", "tabs:check", "slider:check", "drawer:check", "navigation-bar:check", "navigation-rail:check",
  "core:check", "preupgrade:check", "tokens:check", "ssr:check",
];

interface Step { run?: string; if?: string; "continue-on-error"?: unknown }
interface Job {
  needs?: string | string[];
  if?: string;
  "continue-on-error"?: unknown;
  steps: Step[];
  strategy?: { matrix?: { include?: Record<string, string>[] } };
}

// Bun parses YAML; the installed @types/bun does not declare it yet.
const { YAML } = Bun as unknown as { YAML: { parse(text: string): unknown } };
const workflow = YAML.parse(await Bun.file(".github/workflows/ci.yml").text()) as { jobs: Record<string, Job> };
const manifest = await Bun.file("package.json").json() as { scripts: Record<string, string>; peerDependencies: Record<string, string> };
const { scripts, peerDependencies: peers } = manifest;

// The commands of one step: `bun test`, `bun run <script>`, and the scripts of a
// `for script in …` loop. A list written out counts once per step (the static step
// loops over it twice, to run and then to report). A list that comes from the
// matrix counts once per group it appears in, so a command in two groups, or twice
// in one, is two runs.
const commandsOf = (job: Job, step: Step): string[] => {
  const written = new Set<string>();
  const perGroup: string[] = [];
  const fromMatrix = new Set<string>();
  for (const line of (step.run ?? "").split("\n").map(text => text.trim())) {
    if (line === "bun test") written.add(line);
    const single = /^bun run ([\w:-]+)$/.exec(line);
    if (single) written.add(single[1]);
    const loop = /^for script in (.+); do$/.exec(line);
    if (!loop) continue;
    const key = /^\$\{\{ matrix\.(\w+) \}\}$/.exec(loop[1]);
    if (!key) for (const script of loop[1].split(/\s+/)) written.add(script);
    else if (!fromMatrix.has(key[1])) {
      fromMatrix.add(key[1]);
      for (const entry of job.strategy?.matrix?.include ?? []) perGroup.push(...entry[key[1]].split(/\s+/));
    }
  }
  return [...written, ...perGroup];
};

const ran = Object.values(workflow.jobs).flatMap(job => job.steps.flatMap(step => commandsOf(job, step)));

describe("CI (.github/workflows/ci.yml)", () => {
  test("runs every command of the list, each once", () => {
    expect([...ran].sort()).toEqual([...COMMANDS].sort());
  });

  // A floor run is the check's own script on another version of the peer, by a
  // script that restores the installed one: nothing a floor run could weaken.
  test("runs each peer-floor check through check-at-peer-floor.ts, on a check CI also runs as installed", () => {
    const floors = COMMANDS.filter(command => command.endsWith(":floor"));
    expect(floors.length).toBeGreaterThan(0);
    for (const floor of floors) {
      const match = /^bun run scripts\/check-at-peer-floor\.ts (\S+)(?: \S+)* -- ([\w:-]+)$/.exec(scripts[floor] ?? "");
      expect(match, `${floor} must run scripts/check-at-peer-floor.ts`).not.toBeNull();
      expect(match![2]).toBe(floor.replace(/:floor$/, ":check"));
      expect(COMMANDS).toContain(match![2]);
      expect(Object.keys(peers)).toContain(match![1]);
    }
  });

  test("runs only scripts that package.json defines", () => {
    expect(ran.filter(command => command !== "bun test" && !(command in scripts))).toEqual([]);
  });

  // A command that may be skipped, or may fail without failing its job, still
  // appears in the list above and no longer checks anything.
  test("runs them unconditionally, and their failure fails the job", () => {
    const loose: string[] = [];
    for (const [name, job] of Object.entries(workflow.jobs)) {
      const steps = job.steps.filter(step => commandsOf(job, step).length);
      if (!steps.length) continue;
      if (job.if !== undefined) loose.push(`${name}: if`);
      if (job["continue-on-error"] !== undefined) loose.push(`${name}: continue-on-error`);
      for (const step of steps) {
        const command = commandsOf(job, step).join(" ");
        if (step.if !== undefined) loose.push(`${name} (${command}): if`);
        if (step["continue-on-error"] !== undefined) loose.push(`${name} (${command}): continue-on-error`);
      }
    }
    expect(loose).toEqual([]);
  });

  test("gates the required `check` status on every other job", () => {
    const { check, ...jobs } = workflow.jobs;
    expect([check.needs].flat().sort()).toEqual(Object.keys(jobs).sort());
    const gate = check.steps.map(step => step.run ?? "").join("\n");
    for (const job of Object.keys(jobs)) expect(gate).toContain(`[ '\${{ needs.${job}.result }}' = success ]`);
  });
});
