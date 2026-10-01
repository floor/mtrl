// spike/ssr/react/app.ts — the app the React proof renders and hydrates.
// Components from create-dst.ts over the built element specs (dist).
import * as React from "react";
import { buttonElement, defineButton } from "../../../dist/elements/button.js";
import { switchElement, defineSwitch } from "../../../dist/elements/switch.js";
import { tabsElement, tabDeclaration, defineTabs } from "../../../dist/elements/tabs.js";
import { createComponent, createDeclaration } from "./create-dst";

const h = React.createElement;
export const Button = createComponent<any, HTMLElement>(buttonElement.spec as any, defineButton, "Button");
export const Switch = createComponent<any, HTMLElement>(switchElement.spec as any, defineSwitch, "Switch");
export const Tabs = createComponent<any, HTMLElement>(tabsElement.spec as any, defineTabs, "Tabs");
export const Tab = createDeclaration<any>(tabDeclaration as any, "Tab");

export const App = () => {
  const [count, setCount] = React.useState(0);
  return h(
    "main",
    null,
    h("p", null, h(Button, { variant: "filled", id: "save", onClick: () => setCount((c: number) => c + 1) }, "Save"), " ", h("span", { id: "count" }, String(count))),
    h("p", null, h(Switch, { defaultChecked: true, id: "wifi" }, "Wi-Fi")),
    h(Tabs, { defaultValue: "a", "aria-label": "Trips" } as any, h(Tab, { value: "a" }, "Flights"), h(Tab, { value: "b" }, "Trips"))
  );
};
