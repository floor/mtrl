// spike/ssr/react/run.ts — Risk 4: React server render with declarative
// shadow roots, hydrated in Chromium, on React 19 and React 18.
//
//   bun run build && bun spike/ssr/emit-css.ts && bun spike/ssr/react/run.ts
//
// Checks, per version: the server HTML has a <template shadowrootmode> per
// host and it is not escaped; before any script the hosts have declarative
// shadow roots; hydration logs no error or warning and reports no
// recoverable error; after hydration the elements upgraded (the declarative
// root was cleared and the factory rendered), the click handler runs and the
// switch keeps its default. Writes results/react.json.

import { chromium } from "playwright";
import type { BunPlugin } from "bun";

const dir = import.meta.dir;
const root = `${dir}/../../..`;

const react18: BunPlugin = {
  name: "react-18",
  setup(build) {
    build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (args) => ({
      path: Bun.resolveSync(args.path.replace(/^react-dom(?=\/|$)/, "react-dom-18").replace(/^react(?=\/|$)/, "react-18"), root),
    }));
  },
};
const define = { "process.env.NODE_ENV": '"development"' };
const bundle = async (entry: string, target: "browser" | "bun", plugins: BunPlugin[]) => {
  const r = await Bun.build({ entrypoints: [entry], target, plugins, define });
  if (!r.success) throw new Error(String(r.logs));
  return r.outputs[0].text();
};

const results: Record<string, unknown> = {};
const browser = await chromium.launch();
for (const version of [19, 18] as const) {
  const plugins = version === 18 ? [react18] : [];
  const serverFile = `${dir}/.server-${version}.js`;
  await Bun.write(serverFile, await bundle(`${dir}/server.ts`, "bun", plugins));
  const serverErrors: string[] = [];
  const error = console.error;
  console.error = (...a: unknown[]) => void serverErrors.push(a.map(String).join(" ").slice(0, 300));
  let html: string;
  try {
    html = ((await import(serverFile)) as { render: () => string }).render();
  } finally {
    console.error = error;
    await Bun.file(serverFile).delete();
  }
  // Mutation check (MUTATE=1): a server/client mismatch must be reported.
  if (process.env.MUTATE) html = html.replace(">Save<", ">Saved<");
  await Bun.write(`${dir}/../out/react-${version}.html`, html);
  const client = await bundle(`${dir}/client.ts`, "browser", plugins);

  const http = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(req) {
      const p = new URL(req.url).pathname;
      if (p === "/client.js") return new Response(client, { headers: { "Content-Type": "text/javascript" } });
      if (p === "/base.css") return new Response(Bun.file(`${root}/dist/styles/base.css`));
      if (p.startsWith("/css/")) return new Response(Bun.file(`${dir}/../out/css/${p.slice(5)}`), { headers: { "Content-Type": "text/css" } });
      const script = new URL(req.url).searchParams.has("nojs") ? "" : '<script type="module" src="/client.js"></script>';
      return new Response(
        `<!doctype html><html data-theme="baseline"><head><link rel="stylesheet" href="/base.css"></head><body><div id="root">${html}</div>${script}</body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    },
  });
  const base = `http://127.0.0.1:${http.port}/`;

  // Before any script: declarative roots attached by the parser.
  const ctxNoJs = await browser.newContext({ javaScriptEnabled: false });
  const pre = await ctxNoJs.newPage();
  await pre.goto(`${base}?nojs`);
  const beforeScript = await pre.evaluate(() =>
    Array.from(document.querySelectorAll("m-button, m-switch, m-tabs"), (h) => ({
      tag: h.localName,
      shadow: !!h.shadowRoot,
      templateLeft: !!h.querySelector("template"),
      firstChild: h.shadowRoot?.querySelector("button, div, input")?.className ?? null,
    }))
  ).catch((e) => `evaluate failed with JS disabled: ${e.message}`);
  await pre.screenshot({ path: `${dir}/../out/react-${version}-nojs.png`, clip: { x: 0, y: 0, width: 420, height: 220 } });
  await ctxNoJs.close();

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const problems: string[] = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`${m.type()}: ${m.text().slice(0, 400)}`);
  });
  await page.goto(base);
  await page.waitForFunction(() => (window as any).hydrated);
  await page.evaluate(() => new Promise((r) => setTimeout(r, 300)));
  await page.click("#save");
  await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
  const after = await page.evaluate(() => ({
    recoverable: (window as any).recoverable as string[],
    count: document.getElementById("count")?.textContent,
    hosts: Array.from(document.querySelectorAll("m-button, m-switch, m-tabs"), (h: any) => ({
      tag: h.localName,
      upgraded: !!h.component,
      links: h.shadowRoot?.querySelectorAll("link").length ?? -1,
      checked: h.localName === "m-switch" ? h.checked : undefined,
      value: h.localName === "m-tabs" ? h.value : undefined,
    })),
  }));
  await page.screenshot({ path: `${dir}/../out/react-${version}-hydrated.png`, clip: { x: 0, y: 0, width: 420, height: 220 } });
  await ctx.close();
  http.stop();

  const templates = (html.match(/<template shadowrootmode="open"/g) ?? []).length;
  const escaped = /&lt;template|&lt;button/.test(html);
  results[`react${version}`] = { templates, escaped, serverErrors, beforeScript, problems, ...after };
  console.log(
    `React ${version}: ${templates} templates in the server HTML, escaped: ${escaped}, server console.error: ${serverErrors.length}; ` +
      `before script: ${JSON.stringify(beforeScript)}; hydration problems: ${problems.length}${problems.length ? " " + JSON.stringify(problems) : ""}; ` +
      `recoverable: ${after.recoverable.length}; after: count=${after.count} ${JSON.stringify(after.hosts)}`
  );
}
await browser.close();
await Bun.write(`${dir}/../results/react.json`, JSON.stringify(results, null, 2));
