// Client entry: the element CSS modules, then hydration.
import "../../../dist/elements/css/button.js";
import "../../../dist/elements/css/switch.js";
import "../../../dist/elements/css/tabs.js";
import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./app";

const w = window as unknown as { hydrated: boolean; recoverable: string[] };
w.recoverable = [];
hydrateRoot(document.getElementById("root") as HTMLElement, React.createElement(App), {
  onRecoverableError: (error) => void w.recoverable.push(String((error as Error)?.message ?? error)),
});
w.hydrated = true;
