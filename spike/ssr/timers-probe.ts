// spike/ssr/timers-probe.ts — timers a factory leaves behind after a scoped
// server render (globals restored), as mtrl/ssr would run in a real server.
//
//   bun spike/ssr/timers-probe.ts [detached]
//
// Renders every default case inside inServerDom(), then waits 1 s with the
// globals gone and reports what the leftover timers throw.

import { installDom, inServerDom } from "./server-dom";

installDom("shim", { scoped: true });
const { renderHost, elements, kebab, ensureDefined } = await import("./render-element");
const { cases } = await import("../../scripts/fixtures/preupgrade-cases");
const late: string[] = [];
process.on("uncaughtException", (e) => void late.push(`${e.message} @ ${((e.stack ?? "").match(/\/src\/[^\s:)]+:\d+/g) ?? ["?"]).slice(0, 3).join(" < ")}`));
const error = console.error;
console.error = (...a: unknown[]) => void late.push(`console.error: ${a.map((x) => (x instanceof Error ? x.message : String(x))).join(" ").slice(0, 160)}`);
inServerDom(ensureDefined);
const pending = { timers: 0 };
const realSetTimeout = globalThis.setTimeout;
(globalThis as any).setTimeout = (fn: any, ms?: number, ...a: any[]) => (pending.timers++, realSetTimeout(fn, ms, ...a));
for (const key of Object.keys(elements)) {
  const c = cases.find((x) => x.element === kebab(key) && x.variant === "default");
  inServerDom(() => renderHost(c!.html, { detached: process.argv[2] === "detached" }));
}
await new Promise((r) => realSetTimeout(r, 1000));
console.error = error;
console.log(`timers started during 36 scoped renders: ${pending.timers}; errors after the scope closed: ${late.length}`);
for (const l of [...new Set(late)]) console.log("  ", l);
await Bun.write(`${import.meta.dir}/results/timers-probe-${process.argv[2] ?? "connected"}.json`, JSON.stringify({ timers: pending.timers, late: [...new Set(late)] }, null, 2));
process.exit(0);
