import { h } from "vue";
import { MButton } from "mtrl/vue";

export const ok = h(MButton, { disabled: false, onChange: (event) => { const value: string = event.detail.value; void value; } });

// @ts-expect-error disabled is a boolean
export const bad = h(MButton, { disabled: "no", onChange: (event) => { const value: string = event.detail.value; void value; } });

// @ts-expect-error value is a string, not a number: fails if the payload collapsed to any
export const payload = h(MButton, { onChange: (event) => { const value: number = event.detail.value; void value; } });
