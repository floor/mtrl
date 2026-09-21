// test/types/snackbar-events.fixture.ts
//
// Snackbar's typed event map (FLO-114). Nothing here runs; the assertions are
// the test.
//
// Snackbar is a different starting point from button's. Its public `on`
// already took a typed event name and a typed payload --
// `(event: SnackbarEventType, handler: (event: SnackbarEvent) => void)` -- so
// a misspelled name was already caught. What was wrong was one level down:
// the internal `BaseComponent` host in the same file declared
// `on?: (event: string, handler: Function)`, wider than the producer it is
// handed, and under strictFunctionTypes that stopped the pipe in
// `snackbar.ts:37` from resolving, which typed every stage after it `unknown`.
//
// So the assertions below are mostly about keeping what was already true,
// while the map replaces a single union-and-one-payload signature with one
// that can tell its four events apart.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type {
  SnackbarComponent,
  SnackbarEvent,
  SnackbarEvents,
} from "../../src/components/snackbar/types";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

declare const snackbar: SnackbarComponent;

// --- the keys -------------------------------------------------------------

// Exactly the four names in SNACKBAR_EVENTS. `dismiss` fires alongside
// `close` and is what the queue listens to, so it is a real event rather than
// an alias and belongs in the map.
export const theEventsAreExactlyThese: Equals<
  keyof SnackbarEvents,
  "open" | "close" | "action" | "dismiss"
> = true;

// --- the payload ----------------------------------------------------------

type CloseHandler = Parameters<typeof snackbar.on<"close">>[1];
type ClosePayload = Parameters<CloseHandler>[0];

export const closeCarriesTheSnackbarEvent: Equals<ClosePayload, SnackbarEvent> = true;

// The payload is not the DOM event. It carries one, under `originalEvent`,
// and that field is nullable because three of the four events have no DOM
// event behind them at all.
export const payloadIsNotItselfAnEvent: Equals<ClosePayload, Event> = false;

export const theDomEventIsNullable: Equals<
  ClosePayload["originalEvent"],
  Event | null
> = true;

// All four carry the same shape today. That is worth asserting rather than
// assuming: the map's value is that the four *can* diverge -- `reason` is
// only ever set on `close` and `dismiss` -- and narrowing those two later is
// now a local change instead of a new signature.
export const openCarriesTheSameShapeForNow: Equals<
  Parameters<Parameters<typeof snackbar.on<"open">>[1]>[0],
  SnackbarEvent
> = true;

// --- what the map rejects -------------------------------------------------
//
// Each directive below fails the build if the line it guards stops being an
// error, so each is an assertion in both directions. (Written without the
// literal token in prose: a comment beginning with it *is* a directive
// wherever it appears.)

// A misspelled event name.
// @ts-expect-error "closed" is not an event a snackbar reports
snackbar.on("closed", () => {});

// An event that exists on other components but not this one.
// @ts-expect-error a snackbar has no "change" event
snackbar.on("change", () => {});

// The handler receives the payload, not the DOM event.
// @ts-expect-error a snackbar handler is not handed a MouseEvent
snackbar.on("action", (event: MouseEvent) => void event.preventDefault());

// And off is generic over the same keys.
// @ts-expect-error "closed" is not an event a snackbar reports
snackbar.off("closed", () => {});

// --- what it still allows -------------------------------------------------

snackbar.on("close", ({ reason, originalEvent }) => {
  void reason;
  void originalEvent;
});

// A handler that ignores its argument entirely is still fine.
snackbar.on("open", () => {});

// Chaining survives the generic: both still return the component.
snackbar.on("action", () => {}).off("action", () => {});
