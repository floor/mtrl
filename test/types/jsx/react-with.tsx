// With mtrl/react/jsx, the bare tags type-check in React's JSX (FLO-333).
import type {} from "../../../src/react/jsx";

export const typed = <m-switch checked supporting-text="Help" className="x" />;
export const declaration = <m-tabs value="t1"><m-tab value="t1">One</m-tab></m-tabs>;
// @ts-expect-error -- checked is a boolean
export const wrong = <m-switch checked="yes" />;
// The slot attribute is markup too (FLO-334)
export const label = <m-button label="Save" />;
export const host = <m-button popover="auto" inputMode="numeric" enterKeyHint="send" itemProp="name" nonce="abc" />;
// React 19 gives an on<event> prop in lower case the element's own event
export const change = <m-switch onchange={(event) => event.detail.checked} />;
// @ts-expect-error -- onChange is React's synthetic event, which has no detail
export const synthetic = <m-switch onChange={(event) => event.detail} />;
