// spike/ssr/browser-entry.ts — browser side of the parity and upgrade probes.
// The built elements with their CSS modules (one module graph, as
// scripts/fixtures/preupgrade.ts), plus helpers the probes call.
import "../../dist/elements/css/index.js";
import { defineAll } from "../../dist/elements/index.js";

declare global {
  interface Window {
    ready: boolean;
    defineAll: typeof defineAll;
    shadowOf: (host: Element) => string;
    renderBrowser: (html: string) => Promise<{ sync: string; settled: string }>;
    canon: (html: string, steps: Steps) => string;
  }
}

export interface Steps {
  attrOrder?: boolean;
  style?: boolean;
  ids?: boolean;
  whitespace?: boolean;
  /** Drop <input> checked/value attributes: the server writes live state as defaults. */
  state?: boolean;
}

/** The shadow root's markup, without the <style> fallback or the DST <link>s. */
const shadowOf = (host: Element): string => {
  const copy = document.createElement("template");
  copy.innerHTML = host.shadowRoot?.innerHTML ?? "";
  for (const n of Array.from(copy.content.querySelectorAll("style, link[rel=stylesheet]"))) n.remove();
  return copy.innerHTML;
};

const frames = (n: number) =>
  new Promise<void>((resolve) => {
    const step = (i: number) => (i ? requestAnimationFrame(() => step(i - 1)) : resolve());
    step(n);
  });

/** Renders host HTML the way a page does on the client and serialises it right away and once settled. */
const renderBrowser = async (html: string) => {
  const stage = document.getElementById("stage") as HTMLElement;
  stage.innerHTML = html;
  const host = stage.firstElementChild as Element;
  const sync = shadowOf(host);
  await frames(3);
  await new Promise((r) => setTimeout(r, 400)); // past the factories' short timers
  const settled = shadowOf(host);
  return { sync, settled };
};

const GENERATED = /^(?:mtrl-[a-z_-]+-[a-z0-9]{5,}|[a-z-]+-\d{10,}-\d+|.*[0-9a-z]{6,}-[0-9a-z]{4,}.*)$/;
const ID_REFS = ["id", "for", "aria-controls", "aria-labelledby", "aria-describedby", "aria-owns", "aria-activedescendant", "list", "name", "popovertarget", "anchor"];

/**
 * A canonical form, one element per line, applying the chosen normalisations:
 * attrOrder sorts attributes; style re-serialises inline styles through the
 * browser's CSSOM; ids replaces generated ids (and references to them) by
 * their order of appearance; whitespace drops whitespace-only text.
 */
const canon = (html: string, steps: Steps): string => {
  const t = document.createElement("template");
  t.innerHTML = html;
  const ids = new Map<string, string>();
  if (steps.ids) {
    for (const el of Array.from(t.content.querySelectorAll("*"))) {
      for (const name of ID_REFS) {
        const v = el.getAttribute(name);
        if (!v) continue;
        for (const token of v.split(/\s+/)) if (GENERATED.test(token) && !ids.has(token)) ids.set(token, `ID${ids.size + 1}`);
      }
    }
  }
  const lines: string[] = [];
  const walk = (node: Node, depth: number) => {
    const pad = "  ".repeat(depth);
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      if (steps.whitespace && !text.trim()) return;
      lines.push(`${pad}#text ${JSON.stringify(steps.whitespace ? text.trim() : text)}`);
      return;
    }
    if (node.nodeType === 8) {
      lines.push(`${pad}<!--${node.textContent}-->`);
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const skip = (name: string) => !!steps.state && el.localName === "input" && (name === "checked" || name === "value");
    let attrs = Array.from(el.attributes).filter((a) => !skip(a.name)).map((a) => {
      let value = a.value;
      if (steps.ids) value = value.split(/(\s+)/).map((tok) => ids.get(tok) ?? tok).join("");
      if (steps.whitespace && a.name === "class") value = value.trim().split(/\s+/).join(" ");
      if (steps.style && a.name === "style") {
        const probe = document.createElement("div");
        probe.setAttribute("style", value);
        value = probe.style.cssText;
      }
      return `${a.name}=${JSON.stringify(value)}`;
    });
    if (steps.attrOrder) attrs = attrs.sort();
    lines.push(`${pad}<${el.localName}${attrs.length ? " " + attrs.join(" ") : ""}>`);
    const kids = el.localName === "template" ? (el as HTMLTemplateElement).content.childNodes : el.childNodes;
    for (const child of Array.from(kids)) walk(child, depth + 1);
  };
  for (const child of Array.from(t.content.childNodes)) walk(child, 0);
  return lines.join("\n");
};

window.defineAll = defineAll;
window.shadowOf = shadowOf;
window.renderBrowser = renderBrowser;
window.canon = canon;
if (!new URLSearchParams(location.search).has("nodefine")) defineAll();
window.ready = true;
