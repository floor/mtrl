// test/types/emit-closed.fixture.ts
//
// 1.0 closes `emit` on the two public component types that declare it, the
// card and the tabs, to the component's own event map: the names and payloads
// `on` and `off` already accept. A component built with `withEvents` keeps its
// open `emit(event: string, …)`.
import type { CardComponent } from "../../src/components/card";
import type { TabsComponent, TabChangeEventData } from "../../src/components/tabs";
import { createBase, pipe, withElement, withEvents } from "../../src/core/compose";

declare const card: CardComponent;
declare const tabs: TabsComponent;
declare const change: TabChangeEventData;

// The component's own events, with their payloads
card.emit?.("expandedChanged", { expanded: true });
tabs.emit?.("change", change);

// @ts-expect-error "custom" is not an event a card emits
card.emit?.("custom", {});
// @ts-expect-error "custom" is not an event a tabs group emits
tabs.emit?.("custom", {});
// @ts-expect-error the payload is the event's own
card.emit?.("expandedChanged", { expanded: "yes" });
// @ts-expect-error a number is not the change payload
tabs.emit?.("change", 3);

// A custom component keeps the open emitter
const custom = pipe(createBase, withElement({ tag: "div" }), withEvents())({ componentName: "note" });
custom.emit("anything", { at: 1 });
