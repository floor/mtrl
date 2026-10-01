// Probe: what linkedom offers for custom elements and shadow roots.
import { parseHTML } from "linkedom";
const w = parseHTML("<!doctype html><html><head></head><body></body></html>") as any;
const { document, customElements, HTMLElement } = w;
console.log("MutationObserver", typeof w.MutationObserver, "ShadowRoot", typeof w.ShadowRoot, "CSSStyleSheet", typeof w.CSSStyleSheet);
class X extends HTMLElement {
  constructor() {
    super();
    const r = this.attachShadow({ mode: "open" });
    console.log("ctor", !!r, typeof this.attachInternals);
  }
  connectedCallback() {
    console.log("connected", this.getAttribute("a"), this.childNodes.length);
    const d = document.createElement("div");
    d.className = "k";
    this.shadowRoot.append(d);
  }
}
customElements.define("x-y", X);
document.body.innerHTML = `<x-y a="1">hi</x-y>`;
const el = document.body.firstChild;
console.log("shadow", el.shadowRoot && el.shadowRoot.innerHTML);
console.log(document.body.innerHTML);
