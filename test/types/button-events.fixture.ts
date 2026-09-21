// test/types/button-events.fixture.ts
//
// The first component migrated to a typed event map (FLO-114). Nothing here
// runs; the assertions are the test.
//
// `on` and `off` took `(event: string, handler: Function)`. Two things follow
// from that, and both were real:
//
//   - a misspelled event name compiled and produced a listener that never
//     fired;
//   - a handler's argument was untyped, so every caller in the repository
//     guessed at it -- and four of them guessed wrong. `button-group`,
//     `dialog` and `split-button` (twice) each read the handler argument as
//     the DOM event, when the forwarder hands a
//     `{ event, element, originalEvent }` payload. `ButtonGroupEvent
//     .originalEvent` and `SplitButtonEvent.originalEvent` are declared
//     `Event` and held that object instead; `DialogButton.onClick` is
//     declared to take a `MouseEvent` and was handed it too.
//
// Typing the map is what surfaced all four. These assertions keep the map
// honest so it can keep doing that.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type {
  ButtonComponent,
  ButtonEvents,
  ButtonEventPayload,
} from "../../src/components/button/types";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

declare const button: ButtonComponent;

// --- the keys -------------------------------------------------------------

// Exactly the three events the element forwards. `mount` and `unmount` are
// deliberately absent: the lifecycle feature keeps its own emitter and
// exposes them as `lifecycle.onMount` / `onUnmount`, so they never arrive
// through `on`.
export const theEventsAreExactlyThese: Equals<
  keyof ButtonEvents,
  "click" | "focus" | "blur"
> = true;

// --- the payload ----------------------------------------------------------

type ClickHandler = Parameters<typeof button.on<"click">>[1];
type ClickPayload = Parameters<ClickHandler>[0];

export const clickCarriesAMouseEvent: Equals<
  ClickPayload,
  ButtonEventPayload<MouseEvent>
> = true;

// The field the four broken call sites wanted. Asserted by name and type,
// because reading the payload itself as the event is the mistake this map
// exists to prevent.
export const originalEventIsTheDomEvent: Equals<
  ClickPayload["originalEvent"],
  MouseEvent
> = true;

export const payloadIsNotItselfAnEvent: Equals<ClickPayload, MouseEvent> = false;

// focus and blur carry a FocusEvent, not a MouseEvent -- so a handler written
// for one is not silently accepted by the other.
export const focusCarriesAFocusEvent: Equals<
  Parameters<Parameters<typeof button.on<"focus">>[1]>[0],
  ButtonEventPayload<FocusEvent>
> = true;

// --- what the map rejects -------------------------------------------------
//
// Each directive below fails the build if the line it guards stops being an
// error, so each is an assertion in both directions. (Written without the
// literal token: a comment that starts with it *is* a directive, wherever it
// appears, and this paragraph was being read as one.)

// A misspelled event name. This is the case that used to compile and produce
// a listener that never fired.
// @ts-expect-error "chick" is not an event a button reports
button.on("chick", () => {});

// An event that exists on other components but not this one.
// @ts-expect-error a button has no "change" event
button.on("change", () => {});

// The mistake the four call sites made, now caught at the call.
// @ts-expect-error the handler receives the payload, not the DOM event
button.on("click", (event: MouseEvent) => void event.preventDefault());

// And off is generic over the same keys.
// @ts-expect-error "chick" is not an event a button reports
button.off("chick", () => {});

// --- what it still allows -------------------------------------------------

// A correctly written handler, with the payload destructured the way the
// fixed call sites now do it.
button.on("click", ({ originalEvent, element }) => {
  originalEvent.preventDefault();
  element.blur();
});

// A handler that ignores its argument entirely is still fine.
button.on("blur", () => {});
