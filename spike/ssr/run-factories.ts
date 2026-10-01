// spike/ssr/run-factories.ts — Risk 1: every element factory on a server DOM.
//
//   bun spike/ssr/run-factories.ts bare   # linkedom only: what breaks
//   bun spike/ssr/run-factories.ts shim   # recording stubs: what is reached
//
// Each element is rendered from its "default" case in
// scripts/fixtures/preupgrade-cases.ts (the host and light DOM an adapter's
// server render emits, the Phase A source of default configs). Writes
// spike/ssr/results/factories-<mode>.json.

import { installDom, hit, takeHits, setRecording, type Mode } from "./server-dom";

const mode = (process.argv[2] ?? "bare") as Mode;
installDom(mode);

// Timers a factory leaves behind on a server keep running against a detached tree.
const realSetTimeout = globalThis.setTimeout;
const realSetInterval = globalThis.setInterval;
(globalThis as any).setTimeout = (fn: any, ms?: number, ...a: any[]) => (hit("setTimeout"), realSetTimeout(fn, ms, ...a));
(globalThis as any).setInterval = (fn: any, ms?: number, ...a: any[]) => (hit("setInterval"), realSetInterval(fn, ms, ...a));

const late: unknown[] = [];
process.on("uncaughtException", (e) => void late.push(e));
process.on("unhandledRejection", (e) => void late.push(e));

const { renderHost, elements, kebab, ensureDefined } = await import("./render-element");
const { cases } = await import("../../scripts/fixtures/preupgrade-cases");

const frame = (e: unknown): string => {
  const stack = (e as Error)?.stack ?? "";
  for (const line of stack.split("\n").slice(1)) {
    const m = line.match(/(\/(?:src|node_modules\/linkedom)\/[^\s:)]+):(\d+)/);
    if (m) return `${m[1].slice(1)}:${m[2]}`;
  }
  return "?";
};

interface Row {
  element: string;
  html: string;
  status: "ok" | "fail" | "empty";
  error?: string;
  at?: string;
  /** The innermost error (factories log it before wrapping it). */
  root?: string;
  late?: string[];
  hits: { api: string; at: string }[];
  shadow?: string;
}

const rows: Row[] = [];
const realError = console.error;
let defineError: string | null = null;
try {
  ensureDefined();
} catch (e) {
  defineError = `${(e as Error).message} @ ${frame(e)}`;
}
takeHits();

for (const key of Object.keys(elements)) {
  const element = kebab(key);
  const c = cases.find((x) => x.element === element && x.variant === "default");
  if (!c) throw new Error(`no default case for ${element}`);
  const row: Row = { element, html: c.html, status: "ok", hits: [] };
  late.length = 0;
  const logged: unknown[] = [];
  try {
    setRecording(true);
    console.error = (...a: unknown[]) => void logged.push(...a.filter((x) => x instanceof Error));
    const { shadow } = renderHost(c.html);
    row.shadow = shadow;
    if (!shadow.trim()) row.status = "empty";
  } catch (e) {
    row.status = "fail";
    row.error = (e as Error)?.message ?? String(e);
    row.at = frame(e);
    const root = logged[0] ?? e;
    row.root = `${(root as Error).message} @ ${frame(root)}`;
  }
  console.error = realError;
  // Deferred work (microtasks, timers up to 50 ms) that fails after the render.
  console.error = () => {};
  await new Promise((r) => realSetTimeout(r, 60));
  if (late.length) {
    row.late = late.map((e) => `${(e as Error)?.message ?? String(e)} @ ${frame(e)}`);
    if (row.status === "ok") row.status = "fail";
  }
  console.error = realError;
  setRecording(false);
  row.hits = takeHits();
  document.body.innerHTML = "";
  rows.push(row);
}

await Bun.write(`${import.meta.dir}/results/factories-${mode}.json`, JSON.stringify({ mode, defineError, rows }, null, 2));
const ok = rows.filter((r) => r.status === "ok").length;
console.log(`${mode}: ${ok}/${rows.length} ok${defineError ? ` (defineAll: ${defineError})` : ""}`);
for (const r of rows) {
  const apis = [...new Set(r.hits.map((h) => h.api))].join(", ");
  console.log(
    `${r.element.padEnd(18)} ${r.status.padEnd(5)} ${r.root ? r.root : ""}${r.late ? ` late: ${r.late.join(" | ")}` : ""}${apis ? `  [${apis}]` : ""}`
  );
}
process.exit(0);
