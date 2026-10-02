// test/types/tabs-events.fixture.ts
//
// FLO-523: `on` and `off` are generic over a closed map, so a misspelled name
// is an error and the handler's payload is inferred. Compiled twice, once with
// strictNullChecks (tooling:check) and once without (test:types). A wrong
// parameter type below is unrelated in both directions, so it is an error
// under bivariant checking too.
import createTabs from "../../src/components/tabs";
import { createTab } from "../../src/components/tabs/tab";
import type { TabsComponent, TabComponent, TabChangeEventData, TabsEvents, TabEvents, TabsConfig } from "../../src/components/tabs/types";
import type { ForwardedEventPayload } from "../../src/core/dom";
import type { ElementEvents, TabsSpec } from "../../src/elements";
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export const modelGetter: Equals<ReturnType<TabsComponent["getValue"]>, string | null> = true;
export const changeValue: Equals<TabChangeEventData["value"], string> = true;
export const elementValue: Equals<ElementEvents<TabsSpec>["change"]["detail"]["value"], ReturnType<TabsComponent["getValue"]>> = true;
export const groupNames: Equals<keyof TabsEvents, "change"> = true;
export const tabNames: Equals<keyof TabEvents, "click" | "focus" | "blur"> = true;
export const clickPayload: Equals<Parameters<TabEvents["click"]>[0], ForwardedEventPayload<MouseEvent, HTMLElement>> = true;
export const focusPayload: Equals<Parameters<TabEvents["focus"]>[0], FocusEvent> = true;
export const blurPayload: Equals<Parameters<TabEvents["blur"]>[0], FocusEvent> = true;
export const configEvents: Equals<TabsConfig["on"], Partial<TabsEvents> | undefined> = true;

declare const tabs: TabsComponent;
// No annotation: the parameter is TabChangeEventData, and value is the string a selected tab carries.
tabs.on("change", event => { const value: string = event.value; void value; });
const onChange: TabsEvents["change"] = event => { const value: string = event.value; void value; };
export const chained: TabsComponent = tabs.on("change", onChange).off("change", onChange);
tabs.off("change", event => { const value: string = event.value; void value; });
// @ts-expect-error "chnage" is not an event a tabs group emits
tabs.on("chnage", () => {});
// @ts-expect-error off accepts the same names
tabs.off("chnage", () => {});
// @ts-expect-error a number is not the change payload
tabs.on("change", (event: number) => event.toFixed());
// @ts-expect-error off checks the same payload
tabs.off("change", (event: number) => event.toFixed());
// @ts-expect-error the group does not emit click
tabs.on("click", () => {});
// @ts-expect-error config rejects a name the group does not emit
createTabs({ on: { select: () => {} } });
// @ts-expect-error config checks the change payload
createTabs({ on: { change: (event: number) => event.toFixed() } });

declare const tab: TabComponent;
tab.on("click", payload => { payload.event.clientX; payload.originalEvent.preventDefault(); });
tab.on("focus", event => { const type: string = event.type; void type; });
tab.on("blur", event => { const type: string = event.type; void type; });
const onClick: TabEvents["click"] = payload => { payload.event.clientX; };
export const tabChained: TabComponent = tab.on("click", onClick).off("click", onClick);
tab.off("focus", event => { const type: string = event.type; void type; });
tab.off("blur", () => {});
// @ts-expect-error "clik" is not an event a tab emits
tab.on("clik", () => {});
// @ts-expect-error off shares the closed map
tab.off("clik", () => {});
// @ts-expect-error click is the wrapped button payload, not a MouseEvent
tab.on("click", (event: MouseEvent) => event.preventDefault());
// A number is unrelated to FocusEvent in both directions. A MouseEvent is not:
// with strictFunctionTypes off, sibling DOM events compare bivariantly, so
// that assertion would be unused on the loose gate (test:types).
// @ts-expect-error focus carries a FocusEvent, not a number
tab.on("focus", (event: number) => event.toFixed());
// @ts-expect-error off checks the payload
tab.off("blur", (event: number) => event.toFixed());
// The factory return type carries the same map.
createTab({ text: "One", value: "one" }).on("click", payload => payload.element.style);
