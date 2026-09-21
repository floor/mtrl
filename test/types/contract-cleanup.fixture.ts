// test/types/contract-cleanup.fixture.ts
//
// The two type-level halves of the 0.10.0 contract cleanup. Nothing here
// runs; the assertions are the test.
//
// FLO-118 removed the `prefix` config option, and FLO-115 closed the layering
// inversion where core imported leaf component types. Neither change has a
// runtime surface to assert — a removed option is simply absent, and a closed
// import cycle is simply not there — so both are pinned here instead.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type { BaseComponentConfig } from "../../src/core/config/component";
import type { ComponentConfigMap } from "../../src/core/config/global";
import { setComponentDefaults } from "../../src/core/config/global";

// Importing a component's types is what registers its key on the map. These
// are the two the assertions below use; without them the map is empty, which
// is exactly the behaviour FLO-115 chose.
import type {} from "../../src/components/button/types";
import type {} from "../../src/components/slider/types";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// --- FLO-118: the prefix option is gone ------------------------------------
//
// It was accepted on the config and then overwritten with the PREFIX constant
// in the force-these-values block, so a consumer could set it and nothing
// would change.

export const configHasNoPrefix: "prefix" extends keyof BaseComponentConfig
  ? false
  : true = true;

// The neighbouring options are still there, so the assertion above is about
// `prefix` specifically rather than the interface having gone missing.
export const configStillHasClassName: "className" extends keyof BaseComponentConfig
  ? true
  : false = true;

// --- FLO-115: components register themselves -------------------------------
//
// Core declares ComponentConfigMap empty; each component augments it from its
// own types.ts. So the keys below exist only because this file imported those
// components' types above.

export const buttonRegistersItself: "button" extends keyof ComponentConfigMap
  ? true
  : false = true;

export const sliderRegistersItself: "slider" extends keyof ComponentConfigMap
  ? true
  : false = true;

// The map is not a free-for-all: it is a closed set of registered keys, not
// an index signature that accepts anything.
export const theMapIsNotOpen: Equals<
  ComponentConfigMap,
  Record<string, unknown>
> = false;

// --- what these reject -----------------------------------------------------
//
// Each directive below fails the build if the line it guards stops being an
// error, so each is an assertion in both directions.

// @ts-expect-error prefix is no longer a config option (FLO-118)
const config: BaseComponentConfig = { prefix: "acme" };
void config;

// @ts-expect-error a component that has not registered itself is not a key
setComponentDefaults("tooltip", {});

// @ts-expect-error nor is a misspelling of one that has
setComponentDefaults("buton", {});

// --- what they still allow -------------------------------------------------

setComponentDefaults("button", { variant: "filled" });
setComponentDefaults("slider", { min: 0, max: 100 });
