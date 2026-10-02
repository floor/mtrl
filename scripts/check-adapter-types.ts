#!/usr/bin/env bun
// scripts/check-adapter-types.ts
/**
 * Compiles one adapter's built declarations the way an app does, with
 * `skipLibCheck` off, against whatever version of that framework is installed.
 *
 *   bun run scripts/check-adapter-types.ts react
 *
 * The `*-types:floor` scripts install the lowest version `peerDependencies`
 * allows and then run this. `@types/react` is pinned in
 * `check-at-peer-floor.ts` rather than at react's floor. The consumer in
 * `scripts/fixtures/peer-types` uses a component with a prop and an event,
 * reads `event.detail.value`, and has `@ts-expect-error` on a wrong prop and
 * a wrong payload, so a declaration that collapsed to `any` fails here.
 */
import { spawnSync } from "node:child_process";

const adapters = ["react", "vue", "solid", "svelte"] as const;
type Adapter = (typeof adapters)[number];

/** Packages whose installed version this run reports. React's types are not the peer. */
const reported: Record<Adapter, readonly string[]> = {
  react: ["react", "@types/react"],
  vue: ["vue"],
  solid: ["solid-js"],
  svelte: ["svelte"],
};

const adapter = process.argv[2] as Adapter;
if (!adapters.includes(adapter)) {
  console.error("Usage: check-adapter-types.ts <react|vue|solid|svelte>");
  process.exit(2);
}

const versionOf = async (name: string): Promise<string> =>
  (await Bun.file(`node_modules/${name}/package.json`).json() as { version: string }).version;

const installed = await Promise.all(reported[adapter].map(async name => `${name}@${await versionOf(name)}`));
console.log(`${adapter} declarations, skipLibCheck false, against ${installed.join(", ")}`);

const tsc = spawnSync(
  process.execPath,
  ["node_modules/typescript/bin/tsc", "-p", `scripts/fixtures/peer-types/${adapter}.json`],
  { stdio: "inherit" },
);
process.exit(tsc.status ?? 1);
