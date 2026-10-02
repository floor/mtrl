<script lang="ts">
  import { setContext } from "svelte";
  import { Tab, Tabs } from "mtrl/svelte";
  import ReadContext from "./svelte-ssr-context-child.svelte";

  let { mode = "default" }: { mode?: "default" | "required" | "error" } = $props();
  setContext("k", mode === "required" ? "required provider" : "from provider");
</script>

<Tabs id="context-tabs" value="a"><Tab value="a"><ReadContext {mode} /></Tab></Tabs>
