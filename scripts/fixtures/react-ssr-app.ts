// scripts/fixtures/react-ssr-app.ts
import * as React from "react";
import { Button, Switch, Tabs, Tab, Card, Carousel, FabMenu, configure } from "mtrl/react";
configure({ prefix: "demo" });
export const App = ({ mismatch = false }: { mismatch?: boolean }) => {
  const [checked, setChecked] = React.useState(true);
  const [clicks, setClicks] = React.useState(0);
  return React.createElement(React.Fragment, null,
    React.createElement(Carousel, { id: "fallback-0" }, React.createElement("span", null, "Light content")),
    React.createElement(FabMenu, { id: "fallback-1" }, React.createElement("span", null, "Light content")),
    React.createElement(Carousel, { id: "fallback-2" }, React.createElement("span", null, "Light content")),
    React.createElement("p", { id: "text" }, mismatch ? "Client mismatch" : "Server text"),
    React.createElement(Button, { id: "button", onClick: () => setClicks(n => n + 1), style: { marginTop: 4 }, className: "save", "aria-label": "Save" }, "Save"),
    React.createElement(Button, {
      id: "globals", label: "Globals", popover: "auto", inputMode: "numeric",
      enterKeyHint: "send", itemProp: "name", nonce: "abc",
    }),
    React.createElement("output", { id: "clicks" }, clicks),
    React.createElement(Switch, { id: "switch", checked, onChange: e => setChecked(e.detail.checked) }, "Wi-Fi"),
    React.createElement("output", { id: "checked" }, String(checked)),
    React.createElement(Tabs, { id: "tabs", value: "b" },
      React.createElement(Tab, { value: "a" }, "Flights"), React.createElement(Tab, { value: "b" }, "Trips")),
    React.createElement(Card, { id: "card", headline: "Nested" }, React.createElement(Button, { id: "nested" }, "Nested button")),
  );
};
