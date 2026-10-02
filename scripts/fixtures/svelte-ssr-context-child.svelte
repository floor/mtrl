<script lang="ts">
  import { getContext } from "svelte";

  let { mode }: { mode: "default" | "required" | "error" } = $props();
  const context = getContext<string>("k");
  if (mode === "required" && context === undefined) throw new Error("Required context is missing");
  if (mode === "error") throw new Error("Real child error");
  const value = context ?? "DEFAULT";
</script>

<span id="context-label">{value}</span>
