// FLO-114: compile the public component barrel, including its event map.
// Runtime forwarding is covered by test/components/fab/behavior.fixture.ts.
import {
  createExtendedFab,
  type ExtendedFabComponent,
  type ExtendedFabEvents,
} from "../../src/components/extended-fab";
import type { ForwardedEventPayload } from "../../src/core/dom";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const fab = createExtendedFab({ text: "Create" });

export const exactlyTheForwardedEvents: Equals<
  keyof ExtendedFabEvents,
  "click" | "focus" | "blur"
> = true;

export const clickPayload: Equals<
  Parameters<Parameters<typeof fab.on<"click">>[1]>[0],
  ForwardedEventPayload<MouseEvent, HTMLButtonElement>
> = true;

export const focusPayload: Equals<
  Parameters<Parameters<typeof fab.on<"focus">>[1]>[0],
  ForwardedEventPayload<FocusEvent, HTMLButtonElement>
> = true;

export const blurPayload: Equals<
  Parameters<Parameters<typeof fab.on<"blur">>[1]>[0],
  ForwardedEventPayload<FocusEvent, HTMLButtonElement>
> = true;

const onClick: ExtendedFabEvents["click"] = ({ event, originalEvent, element }) => {
  event.preventDefault();
  originalEvent.preventDefault();
  element.disabled = true;
};

export const chaining: ExtendedFabComponent = fab.on("click", onClick).off("click", onClick);
fab.on("focus", () => {}).off("blur", () => {});

// @ts-expect-error misspelled event names must not silently register
fab.on("clik", () => {});
// @ts-expect-error off uses the same closed event map
fab.off("clik", () => {});
// @ts-expect-error the payload wraps the native event
fab.on("click", (event: MouseEvent) => event.preventDefault());
// @ts-expect-error off also checks the handler payload
fab.off("click", (event: MouseEvent) => event.preventDefault());
// @ts-expect-error focus does not forward a keyboard event
fab.on("focus", (_payload: ForwardedEventPayload<KeyboardEvent, HTMLButtonElement>) => {});

// Collapse/expand are DOM events, not forwarded emitter events.
// @ts-expect-error listen through element.addEventListener instead
fab.on("collapse", () => {});
// @ts-expect-error listen through element.addEventListener instead
fab.on("expand", () => {});
// @ts-expect-error lifecycle events belong to the lifecycle API
fab.on("mount", () => {});

fab.element.addEventListener("collapse", () => {});
fab.element.addEventListener("expand", () => {});
