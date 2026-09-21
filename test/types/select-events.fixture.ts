// test/types/select-events.fixture.ts
//
// Select's *public* `on`/`off` were already generic over a `SelectEvents`
// map -- it and `list` are the two components that had one before FLO-114.
// What was not narrowed is the internal host, `BaseComponent` in the same
// file, which still declared `on?: (event: string, handler: Function)`.
//
// That one line is what made the pipe in select.ts fail to resolve under
// strictFunctionTypes: a host promising to call a handler with *anything*
// cannot accept a producer that takes a typed payload, because parameter
// positions are contravariant. The failure then typed every stage after it
// `unknown`, which is where select's other six errors came from.
//
// So the assertions here come in two halves: the public map, which guards
// against drift, and the host, which is what this change actually altered.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type {
  BaseComponent,
  SelectComponent,
  SelectEvents,
  SelectEvent,
  SelectChangeEvent,
} from "../../src/components/select/types";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// --- the public map -------------------------------------------------------

export const theEventsAreExactlyThese: Equals<
  keyof SelectEvents,
  "change" | "open" | "close"
> = true;

export const changeCarriesAChangeEvent: Equals<
  Parameters<SelectEvents["change"]>[0],
  SelectChangeEvent
> = true;

export const openCarriesTheBaseEvent: Equals<
  Parameters<SelectEvents["open"]>[0],
  SelectEvent
> = true;

// A change event is the base event plus the selection, so a handler written
// for `open` is accepted for `change` but not the other way round.
export const changeExtendsTheBaseEvent: SelectChangeEvent extends SelectEvent
  ? true
  : false = true;
export const theBaseEventIsNotAChangeEvent: SelectEvent extends SelectChangeEvent
  ? true
  : false = false;

// --- the host, which is what this change narrowed -------------------------
//
// The assertion that fails if `BaseComponent.on` goes back to taking a
// `Function`. Written as "not the wide form" rather than "is the narrow
// form", because the narrow form is generic and `Equals` on a generic
// signature is brittle.

type WideOn = (event: string, handler: Function) => void;

export const theHostIsNotTheWideForm: Equals<
  NonNullable<BaseComponent["on"]>,
  WideOn
> = false;

export const theHostOffIsNotTheWideFormEither: Equals<
  NonNullable<BaseComponent["off"]>,
  WideOn
> = false;

// And the host still accepts a handler for a real event, which is the thing
// the narrowing must not have broken.
declare const host: Required<Pick<BaseComponent, "on">>;
host.on("change", (event) => void event.value);

// --- what the map rejects -------------------------------------------------
//
// Each directive below fails the build if the line it guards stops being an
// error, so each is an assertion in both directions. (Written without the
// literal token in prose: a comment beginning with it *is* a directive.)

declare const select: SelectComponent;

// @ts-expect-error "changed" is not an event a select reports
select.on("changed", () => {});

// @ts-expect-error a select has no "input" event
select.on("input", () => {});

// A handler whose payload is unrelated to the event's. Note what is *not*
// asserted here: that `open` rejects a handler typed for the narrower
// `SelectChangeEvent`. It does not, yet -- with strictFunctionTypes off
// parameter positions are bivariant, so a narrower handler is still
// accepted. That case starts failing when the flag lands, which is the whole
// point of FLO-114; asserting it now would fail this file instead.
// @ts-expect-error a string is not the payload `open` carries
select.on("open", (event: string) => void event.length);

// @ts-expect-error off is generic over the same keys
select.off("changed", () => {});

// @ts-expect-error the host rejects an unknown event too
host.on("changed", () => {});

// --- what it still allows -------------------------------------------------

select.on("change", (event) => {
  const value: string = event.value;
  void value;
});

select.on("close", () => {});
