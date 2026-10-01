// spike/ssr/detached-check.ts — the detached render (connectedCallback called
// directly, component destroyed in scope) gives the same shadow markup as a
// render connected to the server document, for every default case.
//
//   bun spike/ssr/detached-check.ts

import { installDom, inServerDom } from "./server-dom";

installDom("shim", { scoped: true });
const { renderHost, elements, kebab, ensureDefined } = await import("./render-element");
const { cases } = await import("../../scripts/fixtures/preupgrade-cases");
const error = console.error;
console.error = () => {};
inServerDom(ensureDefined);
// Generated ids differ per render; compare with them masked.
const mask = (s: string) => s.replace(/\b(id|for|aria-[a-z]+|name)="[^"]*"/g, '$1="…"');
const differ: string[] = [];
for (const key of Object.keys(elements)) {
  const c = cases.find((x) => x.element === kebab(key) && x.variant === "default")!;
  const a = inServerDom(() => renderHost(c.html).shadow);
  const b = inServerDom(() => renderHost(c.html, { detached: true }).shadow);
  if (mask(a) !== mask(b)) differ.push(kebab(key));
}
console.error = error;
console.log(`detached vs connected shadow markup: ${Object.keys(elements).length - differ.length} same, ${differ.length} differ ${JSON.stringify(differ)}`);
process.exit(0);
