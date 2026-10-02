// With mtrl/solid/jsx, the bare tags and their prop: and on: forms type-check in Solid's JSX (FLO-333).
// Solid types prop: and on: for every tag at once: on:change is any element's change.
import type {} from "../../../src/solid/jsx";

export const typed = <m-switch checked supporting-text="Help" class="x" prop:checked={true} on:change={(event) => void event.detail} />;
export const declaration = <m-tabs value="t1"><m-tab value="t1">One</m-tab></m-tabs>;
// @ts-expect-error -- checked is a boolean
export const wrong = <m-switch checked="yes" />;
// The slot attribute is markup too (FLO-334)
export const label = <m-button label="Save" />;
export const host = <m-button popover="auto" inputMode="numeric" enterkeyhint="send" itemProp="name" nonce="abc" />;
