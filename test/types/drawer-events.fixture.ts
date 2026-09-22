// FLO-114: public drawer events match state, item activation and root forwarding.
import createDrawer, { type DrawerComponent, type DrawerEvents, type DrawerSelectEvent, type DrawerItemConfig } from "../../src/components/drawer";
import { getApiConfig } from "../../src/components/drawer/config";
import { DRAWER_EVENTS } from "../../src/components/drawer/constants";
import type { ForwardedEventPayload } from "../../src/core/dom";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const drawer = createDrawer();
export const names: Equals<keyof DrawerEvents, "open" | "close" | "select" | "click" | "keydown"> = true;
export const openHasNoPayload: Equals<Parameters<DrawerEvents["open"]>, []> = true;
export const closeHasNoPayload: Equals<Parameters<DrawerEvents["close"]>, []> = true;
export const selection: Equals<Parameters<DrawerEvents["select"]>[0], DrawerSelectEvent> = true;
export const selectionShape: Equals<DrawerSelectEvent, { id: string; label: string; index: number; originalEvent: Event }> = true;
export const click: Equals<Parameters<DrawerEvents["click"]>[0], ForwardedEventPayload<MouseEvent, HTMLElement>> = true;
export const keydown: Equals<Parameters<DrawerEvents["keydown"]>[0], ForwardedEventPayload<KeyboardEvent, HTMLElement>> = true;
export const inferredSelection: Equals<Parameters<Parameters<typeof drawer.on<"select">>[1]>[0], DrawerSelectEvent> = true;

const onSelect: DrawerEvents["select"] = ({ id, label, index, originalEvent }) => {
  const strings: string[] = [id, label];
  const position: number = index;
  originalEvent.preventDefault();
  void strings;
  void position;
};
export const chained: DrawerComponent = drawer.on(DRAWER_EVENTS.SELECT, onSelect).off("select", onSelect);
drawer.on(DRAWER_EVENTS.OPEN, () => {}).off(DRAWER_EVENTS.CLOSE, () => {});
drawer.on("click", payload => { payload.event.clientX; payload.element.style; });
drawer.on("keydown", payload => payload.originalEvent.key);

// @ts-expect-error select carries an object, not a raw DOM event
drawer.on("select", (event: Event) => event.preventDefault());
// @ts-expect-error off checks the same payload
drawer.off("select", (id: string) => id.toUpperCase());
// @ts-expect-error notifications do not supply a DOM event
drawer.on("open", (event: Event) => event.preventDefault());
// @ts-expect-error misspelled names are rejected
drawer.on("slect", () => {});
// @ts-expect-error off shares the closed map
drawer.off("slect", () => {});
// @ts-expect-error programmatic selection has no change event
drawer.on("change", () => {});
// @ts-expect-error focus is not forwarded
drawer.on("focus", () => {});
// @ts-expect-error drawer does not enable root touch gesture forwarding
drawer.on("tap", () => {});
// @ts-expect-error lifecycle notifications are not emitted through this API
drawer.on("destroy", () => {});
// @ts-expect-error root clicks are wrapped
drawer.on("click", (event: MouseEvent) => event.clientX);
// @ts-expect-error no finished component is embedded in forwarded payloads
drawer.on("click", payload => payload.component.open());
// @ts-expect-error keydown retains its native keyboard type
drawer.on("keydown", payload => payload.event.clientX);
// @ts-expect-error select's originalEvent is required
export const missingEvent: DrawerSelectEvent = { id: "mail", label: "Mail", index: 0 };

// The internal item feature accepts arrays; getApiConfig normalizes undefined.
type ItemHost = Parameters<typeof getApiConfig>[0]["drawerItems"];
export const itemsRequireArray: Equals<Parameters<ItemHost["setItems"]>[0], DrawerItemConfig[]> = true;
// The adapter still accepts optional items. The strict-function source ratchet
// enforces the distinction when test:types runs with strictNullChecks=false.
export const adapterAcceptsOptionalItems: Equals<
  Parameters<ReturnType<typeof getApiConfig>["items"]["setItems"]>[0], DrawerItemConfig[] | undefined
> = true;
