// Server entry: registers mtrl/ssr's renderer, then renders the app.
import "./ssr-react";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { App } from "./app";

export const render = (): string => renderToString(React.createElement(App));
