// test/types/dialog-hosts.fixture.ts
//
// Dialog's internal hosts, narrowed to the callback their producer supplies
// (FLO-114). Nothing here runs; the assertions are the test.
//
// Dialog reported five errors and they were one failure with four shadows.
// The `pipe()` overload at dialog.ts:111 could not resolve because
// `DialogFeatureComponent.on` declared `handler: Function` while the
// component the pipe hands it takes an `EventCallback`. `Function` is a
// supertype, so a host promising to call a handler with anything cannot
// accept one that takes a typed payload -- contravariant and unsound. Every
// stage after the failing overload then typed `unknown`, which is what lines
// 123, 130 and 135 were reporting. Fixing the root cleared all five.
//
// Non-contract, and that was checked rather than assumed: the package's
// `./components/*` export maps to `dist/components/*/index.d.ts` only, so a
// type exported from a component's types.ts but not re-exported from its
// index.ts cannot be reached by a consumer. `DialogFeatureComponent` is in
// that position. The public `DialogComponent.on` (types.ts:516) was already
// typed and is untouched.
//
// Two sibling hosts moved with it -- `ApiOptions.events` in api.ts and the
// host in config.ts -- because each link had been written to the same wider
// shape. Neither is exported at all, so neither can be imported here;
// `strictfn:check` is the detector for those, and it compiles dialog.ts with
// the flag on.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type { DialogFeatureComponent } from "../../src/components/dialog/types";
import type { EventCallback } from "../../src/core/state/emitter";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export const onTakesAnEventCallback: Equals<
  Parameters<DialogFeatureComponent["on"]>,
  [event: string, handler: EventCallback]
> = true;

// Stated the other way round, because this is the assertion that fails if
// `Function` comes back: the handler is not the untyped supertype.
export const theHandlerIsNotAFunction: Equals<
  Parameters<DialogFeatureComponent["on"]>[1],
  Function
> = false;
