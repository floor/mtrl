// test/types/card-host.fixture.ts
//
// Card's internal host and the component it is actually handed (FLO-114).
// Nothing here runs; the assertions are the test.
//
// This one is not an event map. Card's `BaseComponent` -- internal, exported
// from its types.ts but not from its index.ts -- declared
// `getClass: (name?: string) => string`, with the name optional. The
// component the pipe hands it comes from core, where `getClass` requires a
// name and is implemented as `${prefix}-${name}`.
//
// Under strictFunctionTypes that is unsound in the direction that matters: a
// host promising it may call `getClass()` with no argument cannot accept a
// function that requires one. It is the same contravariance as the
// `Function` vs `EventCallback` roots elsewhere in F14, on a different
// method, and it is what stopped the pipe at card.ts:103 resolving.
//
// Card was the only component declaring the optional form. No call anywhere
// in src or test passes no name, and a bare call would have returned
// "mtrl-undefined", so nothing depended on the wider declaration.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type { BaseComponent } from "../../src/components/card/types";
import type { ElementComponent } from "../../src/core/compose/component";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// --- the host now says what core provides ---------------------------------

export const getClassRequiresAName: Equals<
  Parameters<BaseComponent["getClass"]>,
  [name: string]
> = true;

// Stated the other way round, because this is the assertion that fails if the
// optional form comes back: the parameter is not optional.
export const theNameIsNotOptional: Equals<
  Parameters<BaseComponent["getClass"]>,
  [name?: string]
> = false;

// --- and a core component satisfies the host ------------------------------
//
// The property that actually broke. `ElementComponent` is what the pipe has
// built by the time `withAPI` runs, and its `getClass` must be assignable to
// the host's. With the optional declaration it was not, and every stage after
// the failing `pipe()` overload became `unknown`.
//
// tsconfig.types.json now inherits strict mode, so this assignment also
// checks the host's parameter variance. The structural assertions above and
// below remain useful under tsconfig.test.json, which relaxes that flag.
// `bun run ts:check` checks the real composition pipeline in strict mode.

declare const built: ElementComponent;

export const coreSatisfiesTheHostsGetClass: BaseComponent["getClass"] =
  built.getClass;

// --- what the narrowed host rejects ---------------------------------------
//
// The directive below fails the build if the line it guards stops being an
// error, so it is an assertion in both directions. (Written without the
// literal token in prose: a comment beginning with it *is* a directive.)

declare const host: BaseComponent;

// @ts-expect-error getClass needs the name it interpolates into the class
host.getClass();
