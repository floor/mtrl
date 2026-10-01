// spike/ssr/attach-probe.ts — the upgrade contract per engine: what
// attachShadow({ mode: "open", delegatesFocus: true }) (define.ts:322) does
// on a host that already has a declarative shadow root, with and without
// shadowrootdelegatesfocus on the template.
//
//   bun spike/ssr/attach-probe.ts

import { chromium, firefox, webkit, type BrowserType } from "playwright";

const page = `<!doctype html>
<x-a id="a"><template shadowrootmode="open" shadowrootdelegatesfocus><p>server</p></template></x-a>
<x-b id="b"><template shadowrootmode="open"><p>server</p></template></x-b>
<script>
  window.log = [];
  for (const tag of ["x-a", "x-b"]) {
    customElements.define(tag, class extends HTMLElement {
      constructor() {
        super();
        const before = this.shadowRoot ? this.shadowRoot.innerHTML : null;
        try {
          const root = this.attachShadow({ mode: "open", delegatesFocus: true });
          log.push({ tag, before, same: root === this.shadowRoot, clearedTo: root.innerHTML, delegatesFocus: root.delegatesFocus });
        } catch (e) { log.push({ tag, before, error: e.name + ": " + e.message }); }
      }
    });
  }
</script>`;

for (const [name, type] of [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]] as [string, BrowserType][]) {
  const browser = await type.launch();
  const p = await browser.newPage();
  await p.setContent(page);
  console.log(name, JSON.stringify(await p.evaluate(() => (window as any).log)));
  await browser.close();
}

// Defined before the host is parsed (a blocking script in <head>): the
// constructor runs at element creation, before the parser reaches the
// <template>. What becomes of the declarative template?
const early = `<!doctype html><script>
  window.log = [];
  customElements.define("x-c", class extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open", delegatesFocus: true }); }
    connectedCallback() { log.push({ phase: "connected", shadow: this.shadowRoot.innerHTML }); }
  });
</script><x-c id="c"><template shadowrootmode="open" shadowrootdelegatesfocus><p>server</p></template>light</x-c>`;
for (const [name, type] of [["chromium", chromium], ["firefox", firefox], ["webkit", webkit]] as [string, BrowserType][]) {
  const browser = await type.launch();
  const p = await browser.newPage();
  await p.setContent(early);
  const end = await p.evaluate(() => {
    const c = document.getElementById("c") as HTMLElement;
    return { shadow: c.shadowRoot?.innerHTML, light: c.innerHTML, log: (window as any).log };
  });
  console.log(name, "defined-before-parse", JSON.stringify(end));
  await browser.close();
}
