import { hydrate } from "svelte";
import App from "./svelte-ssr-context-app.svelte";

const mode = new URLSearchParams(location.search).get("mode") as "default" | "required";
const host = document.getElementById("context-tabs");
const hadDeclarativeRoot = !!host?.shadowRoot;
hydrate(App, { target: document.getElementById("root") as HTMLElement, props: { mode } });
Object.assign(window, {
  svelteContextSSR: {
    ready: true,
    hadDeclarativeRoot,
  },
});
