// test/types/search-hosts.fixture.ts
//
// Search's internal hosts, narrowed to what their producers actually supply
// (FLO-114). Nothing here runs; the assertions are the test.
//
// Search contributed three errors and they were one failure with two
// shadows: the `pipe()` overload at search.ts:54 could not resolve, so every
// stage after it typed `unknown`, which is what lines 66 and 69 were
// reporting. Fixing the root cleared all three.
//
// The root was three separate hosts each declaring something *wider* than
// the producer handed to it -- the same contravariance as the rest of F14,
// once on a union and twice on a callback:
//
//   - `InputHost.states.setViewMode` took `string`; the producer takes
//     `SearchViewMode`, so the host promised to call it with any string;
//   - `SuggestionsHost.input.selectSuggestion` took `SearchSuggestion |
//     string`; the producer takes only the object, and the single call site
//     passes an element of `getSuggestions()`, which is `SearchSuggestion[]`;
//   - `InternalComponent.on/off` took `Function`, and the forwarder built
//     from it and `ApiOptions.events` had to follow.
//
// **What this file can and cannot reach.** Three of those four interfaces --
// `InputHost`, `SuggestionsHost`, `InternalComponent` -- are declared without
// `export`, which is why narrowing them is not a contract change. That also
// means a fixture cannot import them, and exporting them so a test could
// would add public surface to prove a private point. So the assertions below
// cover the one reachable seam, `getApiConfig`, and the other three are
// enforced by `ts:check`, which compiles search.ts with
// strictFunctionTypes on and fails if any of them widens again. That check is
// the detector; this file is the part of it that can be read.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import { getApiConfig } from "../../src/components/search/config";
import type { EventCallback } from "../../src/core/state/emitter";
import type { SearchViewMode } from "../../src/components/search/types";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type ApiConfig = ReturnType<typeof getApiConfig>;

// --- the events seam ------------------------------------------------------

export const onTakesAnEventCallback: Equals<
  Parameters<ApiConfig["events"]["on"]>,
  [e: string, h: EventCallback]
> = true;

export const offTakesAnEventCallback: Equals<
  Parameters<ApiConfig["events"]["off"]>,
  [e: string, h: EventCallback]
> = true;

// Stated the other way round, because this is the assertion that fails if
// `Function` comes back: the handler is not the untyped supertype.
export const theHandlerIsNotAFunction: Equals<
  Parameters<ApiConfig["events"]["on"]>[1],
  Function
> = false;

// --- the view-mode seam ---------------------------------------------------
//
// `setViewMode` reaches this config from the same host that declared it
// `string`, so the union survives here and is worth pinning: a widening back
// to `string` shows up in this return type too.

export const setViewModeTakesTheUnion: Equals<
  Parameters<ApiConfig["state"]["setViewMode"]>,
  [m: SearchViewMode]
> = true;

export const viewModeIsNotAnyString: Equals<
  Parameters<ApiConfig["state"]["setViewMode"]>[0],
  string
> = false;
