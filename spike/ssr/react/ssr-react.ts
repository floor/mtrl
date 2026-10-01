// spike/ssr/react/ssr-react.ts — THROWAWAY: what `mtrl/ssr/react` would be.
//
// Server-only. Importing it builds the server DOM (linkedom, scoped: no
// globals outside a render, so the adapter still sees a server) and
// registers the renderer the React adapter looks up under
// Symbol.for("mtrl.ssr"). The client bundle never reaches this module.

import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { installDom, inServerDom } from "../server-dom";

installDom("shim", { scoped: true });
const { renderHost, ensureDefined } = await import("../render-element");
inServerDom(ensureDefined);

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const attributeString = (attributes: Record<string, unknown>): string =>
  Object.entries(attributes)
    .filter(([name, v]) => v !== undefined && v !== null && v !== false && typeof v !== "function" && typeof v !== "object" && name !== "key")
    .map(([name, v]) => (v === true || v === "" ? ` ${name}` : ` ${name}="${esc(String(v))}"`))
    .join("");

export const cssBase = { value: "/css" };

(globalThis as Record<symbol, unknown>)[Symbol.for("mtrl.ssr")] = {
  render(tag: string, attributes: Record<string, unknown>, lightHtml: string): string | null {
    const error = console.error;
    console.error = () => {}; // the factories' own logging
    try {
      return inServerDom(() => renderHost(`<${tag}${attributeString(attributes)}>${lightHtml}</${tag}>`, { cssBase: cssBase.value, detached: true }).inner);
    } catch {
      return null; // no declarative root: the element renders on upgrade, as today
    } finally {
      console.error = error;
    }
  },
  toHtml: (children: ReactNode) => renderToStaticMarkup(children as never),
};
