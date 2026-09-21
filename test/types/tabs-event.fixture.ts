// test/types/tabs-event.fixture.ts
//
// What `handleTabClick` accepts. Nothing here runs; the assertions are the
// test, and each stops compiling if the declaration it covers drifts.
//
// The defect, from FLO-114: tabs declared this handler twice and the two
// declarations contradicted each other. `types.ts` and the internal hosts said
// `(event: unknown, tab)`; `api.ts` and one host in `features.ts` said
// `(event: Event, tab)`. Both were wrong, in opposite directions:
//
//   - `unknown` is too wide. Under `strictFunctionTypes` a host promising to
//     call the handler with anything cannot accept one that takes an `Event`,
//     which is what made the tabs pipe fail to resolve and put every stage
//     after it at `unknown`.
//   - `Event` is too narrow. `utils.ts` calls `handleTabClick(null, target)`
//     on purpose, routing an arrow key through the same path as a click when
//     there is no event to cancel.
//
// `Event | null` is what the code actually does, so it is what the type says.
// The `false` assertions below are not decoration: an `Equals` that has gone
// vacuous passes against anything, so each wrong shape is named and required
// to be wrong.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type { TabsComponent } from "../../src/components/tabs/types";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** true when B is assignable to A */
type Accepts<A, B> = B extends A ? true : false;

/**
 * Whether the compiling config has strictNullChecks on.
 *
 * This file is compiled twice with different answers. `tooling:check` uses
 * tsconfig.types.json, which inherits the real config and has it on.
 * `test:types` uses tsconfig.test.json, which sets `strictNullChecks: false`
 * -- and there `null` is assignable to everything, so `Event | null` collapses
 * to `Event` and the two cannot be told apart. The assertion that depends on
 * that distinction is gated on this rather than deleted, so the strict gate
 * still makes it.
 */
type StrictNulls = null extends number ? false : true;

type ClickPayload = Parameters<TabsComponent["handleTabClick"]>[0];

// The declaration itself.
export const handlerTakesEventOrNull: Equals<ClickPayload, Event | null> = true;

// Both halves are load-bearing, so both are asserted from the other side.
export const aDomEventIsAccepted: Accepts<ClickPayload, Event> = true;
export const nullIsAccepted: Accepts<ClickPayload, null> = true;

// And the two shapes it used to have are required to be wrong. Without these,
// an `Equals` that silently resolved to `unknown` on both sides would pass.
export const notUnknown: Equals<ClickPayload, unknown> = false;
export const notBareEvent: StrictNulls extends true
  ? Equals<ClickPayload, Event>
  : false = false;

// The second parameter is untouched by this change; asserted so that a future
// edit to the signature cannot quietly reorder or drop it.
export const secondParameterIsTheTab: Equals<
  Parameters<TabsComponent["handleTabClick"]>["length"],
  2
> = true;
