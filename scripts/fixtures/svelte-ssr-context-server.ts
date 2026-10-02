import "mtrl/ssr/svelte";
import { render } from "svelte/server";
import App from "./svelte-ssr-context-app.svelte";

export const renderContext = (mode: "default" | "required" | "error"): string =>
  render(App, { props: { mode } }).body;
