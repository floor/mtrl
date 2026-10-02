import type { ComponentProps } from "svelte";
import { Button } from "mtrl/svelte";

const ok: ComponentProps<typeof Button> = { disabled: false, onchange: (event) => { const value: string = event.detail.value; void value; } };

// @ts-expect-error disabled is a boolean
const bad: ComponentProps<typeof Button> = { disabled: "no", onchange: (event) => { const value: string = event.detail.value; void value; } };

// @ts-expect-error value is a string, not a number: fails if the payload collapsed to any
const payload: ComponentProps<typeof Button> = { onchange: (event) => { const value: number = event.detail.value; void value; } };

export { ok, bad, payload };
