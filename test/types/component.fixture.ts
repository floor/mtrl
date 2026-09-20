// test/types/component.fixture.ts
//
// Type-level checks that a chaining method reports the component it was called
// on, not the interface that happens to declare it. Nothing here runs; the
// assertions are the test, and each one stops compiling if the declaration it
// covers goes back to naming a fixed interface.
//
// The defect these cover, from FLO-235: `addClass` was declared
// `(...classes: string[]) => ElementComponent`. At runtime it returns `this`,
// which by the time anyone can call it carries every feature the pipe applied.
// Declaring the narrow interface threw all of that away, so
// `component.addClass("x")` handed back a bare element component and the rest
// of the component's own API was gone from the type.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import { createBase, withElement, pipe } from "../../src/core/compose";
import { withEvents } from "../../src/core/compose/features/events";
import { withTextInput } from "../../src/core/compose/features/textinput";
import type { ElementComponent } from "../../src/core/compose/component";
import { withOrientation, withInset, withStyle } from "../../src/components/divider/features";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** A has every member of B, whatever else it also has */
type Has<A, B> = A extends B ? true : false;

// A component built the way every component is built: base, element, events.
const component = pipe(
  createBase,
  withElement({ tag: "div" }),
  withEvents(),
)({ componentName: "fixture", prefix: "mtrl" });

type Component = typeof component;

// The check that matters: chaining off addClass keeps the events half.
export const addClassKeepsTheComponent: Equals<
  ReturnType<Component["addClass"]>,
  Component
> = true;

// Said the other way round, because Equals passing on two equally-wrong types
// would be a silent pass: what comes back must still have `on` and `emit`.
export const addClassKeepsEvents: Has<
  ReturnType<Component["addClass"]>,
  { on: unknown; emit: unknown }
> = true;

// And it is not the bare interface that declares the method. This is the
// assertion that fails if `ElementComponent["addClass"]` stops using `this`.
export const addClassIsNotTheDeclaringInterface: Equals<
  ReturnType<Component["addClass"]>,
  ElementComponent
> = false;

// The same holds one feature further along, where the old declaration erased
// the text input's own methods from anything chained off addClass.
const textField = withTextInput({})(component);

export const textInputChainKeepsInput: Has<
  ReturnType<(typeof textField)["addClass"]>,
  { input: unknown; setValue: unknown }
> = true;

export const setValueReturnsTheComponent: Equals<
  ReturnType<(typeof textField)["setValue"]>,
  typeof textField
> = true;

// Divider, where each enhancer adds one slice: a setter from the first slice
// must still report the slices added after it.
// Applied directly rather than through `pipe`: pipe's fixed-arity overloads
// stop inferring when a stage is itself generic in a constraint the stage
// before it only satisfies after enhancement, which is a separate limit and
// not what this file is about.
const divider = withStyle({})(withInset({})(withOrientation({})(component)));

export const dividerSetterReturnsTheComponent: Equals<
  ReturnType<(typeof divider)["setOrientation"]>,
  typeof divider
> = true;

// The loose form of the same check would pass on a declaration that bound
// `this` to DividerComponent instead -- DividerComponent has setColor and
// setInset too. Equals is what tells the two apart, which is why the
// assertions above are written that way and not as membership tests.
export const dividerSetterKeepsLaterFeatures: Has<
  ReturnType<(typeof divider)["setOrientation"]>,
  { setColor: unknown; setInset: unknown }
> = true;
