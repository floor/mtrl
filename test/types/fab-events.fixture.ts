// test/types/fab-events.fixture.ts
//
// The FAB's typed event map (FLO-114). Nothing here runs; the assertions are
// the test.
//
// `on`/`off` took `(event: string, handler: Function)` on both the public
// `FabComponent` and the internal host in api.ts. Two consequences, and both
// were real for button when the same map was written there: a misspelled
// event name compiled and produced a listener that never fired, and the
// handler's argument was untyped, so a caller guessing "the DOM event" wrote
// something that type-checked and was wrong.
//
// The payload type is `ForwardedEventPayload`, which lives in core beside the
// forwarder that emits it rather than being redeclared here. Eleven
// components configure `forwardEvents`; without a shared payload each of
// their event maps would spell the same three fields again.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type { FabComponent, FabEvents } from "../../src/components/fab/types";
import type { ForwardedEventPayload } from "../../src/core/dom/create";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

declare const fab: FabComponent;

// --- the keys -------------------------------------------------------------

// Exactly the three that config.ts forwards. `mount` and `unmount` are not
// here: the lifecycle feature keeps its own emitter.
export const theEventsAreExactlyThese: Equals<
  keyof FabEvents,
  "click" | "focus" | "blur"
> = true;

// --- the payload ----------------------------------------------------------

type ClickPayload = Parameters<Parameters<typeof fab.on<"click">>[1]>[0];

export const clickCarriesAMouseEvent: Equals<
  ClickPayload,
  ForwardedEventPayload<MouseEvent>
> = true;

// The payload is not the DOM event; it carries one. Reading it as the event
// is the mistake the map exists to prevent.
export const payloadIsNotItselfAnEvent: Equals<ClickPayload, MouseEvent> = false;

export const originalEventIsTheDomEvent: Equals<
  ClickPayload["originalEvent"],
  MouseEvent
> = true;

// focus and blur carry a FocusEvent, so a handler written for a click is not
// silently accepted by them.
export const focusCarriesAFocusEvent: Equals<
  Parameters<Parameters<typeof fab.on<"focus">>[1]>[0],
  ForwardedEventPayload<FocusEvent>
> = true;

// --- what the map rejects -------------------------------------------------
//
// Each directive below fails the build if the line it guards stops being an
// error, so each is an assertion in both directions. (Written without the
// literal token in prose: a comment beginning with it *is* a directive.)

// @ts-expect-error "clik" is not an event a FAB reports
fab.on("clik", () => {});

// @ts-expect-error a FAB has no "change" event
fab.on("change", () => {});

// @ts-expect-error the handler receives the payload, not the DOM event
fab.on("click", (event: MouseEvent) => void event.preventDefault());

// @ts-expect-error off is generic over the same keys
fab.off("clik", () => {});

// --- what it still allows -------------------------------------------------

fab.on("click", ({ originalEvent, element }) => {
  originalEvent.preventDefault();
  element.blur();
});

// A handler that ignores its argument entirely is still fine.
fab.on("blur", () => {});

// Chaining survives the generic.
fab.on("focus", () => {}).off("focus", () => {});
