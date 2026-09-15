// test/types/pipe.fixture.ts
//
// Type-level checks for pipe and compose, compiled by `bun run tooling:check`
// with the library's own compiler options (tsconfig.types.json). Nothing here
// runs. The rest overload for runtime-built arrays must not accept a pipe
// that the fixed-arity overloads reject: each @ts-expect-error below fails
// the check if its line compiles.
import { pipe, compose } from "../../src/core/compose/pipe";

interface Foo {
  foo: string;
}
interface Bar {
  bar: number;
}
interface Baz {
  baz: boolean;
}

declare const fooToFoo: (foo: Foo) => Foo;
declare const fooToBar: (foo: Foo) => Bar;
declare const barToFoo: (bar: Bar) => Foo;
declare const barToBaz: (bar: Bar) => Baz;

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// A runtime-built array of same-shape enhancers can be spread
const enhancers: Array<(foo: Foo) => Foo> = [fooToFoo, fooToFoo];

const piped = pipe(...enhancers);
export const pipedSpreadType: Equals<typeof piped, (x: Foo) => Foo> = true;

const composed = compose(...enhancers);
export const composedSpreadType: Equals<typeof composed, (x: Foo) => Foo> = true;

// Typed stages still infer through the fixed-arity overloads
const typedPipe = pipe(fooToBar, barToBaz);
export const typedPipeType: Equals<typeof typedPipe, (x: Foo) => Baz> = true;

const typedCompose = compose(barToBaz, fooToBar);
export const typedComposeType: Equals<typeof typedCompose, (x: Foo) => Baz> = true;

// A second stage that does not accept the first stage's output
// @ts-expect-error barToBaz takes Bar, fooToFoo returns Foo
pipe(fooToFoo, barToBaz);

// A middle stage that returns the wrong shape
// @ts-expect-error barToFoo returns Foo, barToBaz takes Bar
pipe(fooToBar, barToFoo, barToBaz);

// compose, applied right to left: a second stage that does not accept the first
// @ts-expect-error barToBaz takes Bar, fooToFoo returns Foo
compose(barToBaz, fooToFoo);

// compose: a middle stage that returns the wrong shape
// @ts-expect-error barToFoo returns Foo, barToBaz takes Bar
compose(barToBaz, barToFoo, fooToBar);
