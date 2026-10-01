// spike/ssr/parity.ts — Risk 2: server markup vs the browser factory's.
//
//   bun run build
//   bun spike/ssr/run-factories.ts shim    # server shadows (linkedom + recording stubs)
//   bun spike/ssr/parity.ts [shim|min]     # compares in Chromium
//
// For each element's default case, the server shadow root (from
// results/factories-<mode>.json) is compared with the shadow root the same
// host HTML gets in Chromium, both right after upgrade (sync) and settled
// (3 frames + 400 ms). Both are parsed by the browser and canonicalised step
// by step: raw, sorted attributes, CSSOM-normalised inline styles, generated
// ids by order, whitespace-only text dropped. The first step at which they
// match says what kind of difference it is; what is left after all steps is
// a real difference, listed line by line. Writes results/parity.json.

import { chromium } from "playwright";

const root = `${import.meta.dir}/../..`;
const server = (await Bun.file(`${import.meta.dir}/results/factories-${process.argv[2] ?? "shim"}.json`).json()) as {
  rows: { element: string; html: string; status: string; shadow?: string }[];
};

const built = await Bun.build({ entrypoints: [`${import.meta.dir}/browser-entry.ts`], target: "browser" });
if (!built.success) throw new Error(String(built.logs));
const js = await built.outputs[0].text();

const http = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/entry.js") return new Response(js, { headers: { "Content-Type": "text/javascript" } });
    if (url.pathname === "/base.css") return new Response(Bun.file(`${root}/dist/styles/base.css`));
    return new Response(
      `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/base.css"></head><body><div id="stage" style="width:360px"></div><script type="module" src="/entry.js"></script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  },
});

const STEPS = [
  { name: "raw", steps: {} },
  { name: "attr-order", steps: { attrOrder: true } },
  { name: "style", steps: { attrOrder: true, style: true } },
  { name: "ids", steps: { attrOrder: true, style: true, ids: true } },
  { name: "whitespace", steps: { attrOrder: true, style: true, ids: true, whitespace: true } },
  { name: "state", steps: { attrOrder: true, style: true, ids: true, whitespace: true, state: true } },
] as const;

const diffLines = (a: string[], b: string[]): string[] => {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: string[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) (i++, j++);
    else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) out.push(`+ browser: ${b[j++].trim()}`);
    else out.push(`- server:  ${a[i++].trim()}`);
  }
  return out;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${http.port}/`);
await page.waitForFunction(() => window.ready);

interface Result {
  element: string;
  sync: string;
  settled: string;
  syncNeeds: string[];
  settledNeeds: string[];
  diff: string[];
  syncDiff: string[];
}
const results: Result[] = [];
const compare = async (a: string, b: string) => {
  const needs: string[] = [];
  let equal = "differs";
  for (const { name, steps } of STEPS) {
    const [x, y] = await page.evaluate(([a, b, s]) => [window.canon(a, s), window.canon(b, s)], [a, b, steps] as const);
    if (x === y) {
      equal = name;
      break;
    }
    needs.push(name);
  }
  const full = STEPS[STEPS.length - 1].steps;
  const [x, y] = await page.evaluate(([a, b, s]) => [window.canon(a, s), window.canon(b, s)], [a, b, full] as const);
  return { equal, needs, diff: x === y ? [] : diffLines(x.split("\n"), y.split("\n")) };
};

for (const row of server.rows) {
  if (row.status !== "ok" || row.shadow === undefined) {
    results.push({ element: row.element, sync: "no server render", settled: "no server render", syncNeeds: [], settledNeeds: [], diff: [], syncDiff: [] });
    continue;
  }
  const b = await page.evaluate((html) => window.renderBrowser(html), row.html);
  const s = await compare(row.shadow, b.sync);
  const t = await compare(row.shadow, b.settled);
  results.push({ element: row.element, sync: s.equal, settled: t.equal, syncNeeds: s.needs, settledNeeds: t.needs, diff: t.diff, syncDiff: s.diff });
}

await Bun.write(`${import.meta.dir}/results/parity.json`, JSON.stringify({ errors, results }, null, 2));
for (const r of results) {
  console.log(`${r.element.padEnd(18)} sync: ${r.sync.padEnd(10)} settled: ${r.settled.padEnd(10)}${r.diff.length ? `  ${r.diff.length} lines differ` : ""}`);
}
if (errors.length) console.log("page errors:", errors);
await browser.close();
http.stop();
