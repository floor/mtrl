// src/core/compose/pipe.ts
/**
 * @namespace compose
 * @description Core composition utilities for creating and combining components
 */

/**
 * Performs left-to-right function composition.
 * Each function takes the return value of the previous function as its input.
 *
 * @memberof compose
 * @function pipe
 * @param {...Function} fns - Functions to compose
 * @returns {Function} Composed function that passes its argument through the pipeline
 *
 * @example
 * const addOne = x => x + 1;
 * const double = x => x * 2;
 * const addOneThenDouble = pipe(addOne, double);
 * console.log(addOneThenDouble(3)); // Output: 8
 */
export function pipe<A, B>(
  f1: (arg: A) => B
): (x: A) => B;
export function pipe<A, B, C>(
  f1: (arg: A) => B,
  f2: (arg: B) => C
): (x: A) => C;
export function pipe<A, B, C, D>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D
): (x: A) => D;
export function pipe<A, B, C, D, E>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E
): (x: A) => E;
export function pipe<A, B, C, D, E, F>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F
): (x: A) => F;
export function pipe<A, B, C, D, E, F, G>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G
): (x: A) => G;
export function pipe<A, B, C, D, E, F, G, H>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H
): (x: A) => H;
export function pipe<A, B, C, D, E, F, G, H, I>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I
): (x: A) => I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J
): (x: A) => J;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K
): (x: A) => K;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L
): (x: A) => L;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M
): (x: A) => M;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M,
  f13: (arg: M) => N
): (x: A) => N;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M,
  f13: (arg: M) => N,
  f14: (arg: N) => O
): (x: A) => O;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M,
  f13: (arg: M) => N,
  f14: (arg: N) => O,
  f15: (arg: O) => P
): (x: A) => P;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M,
  f13: (arg: M) => N,
  f14: (arg: N) => O,
  f15: (arg: O) => P,
  f16: (arg: P) => Q
): (x: A) => Q;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M,
  f13: (arg: M) => N,
  f14: (arg: N) => O,
  f15: (arg: O) => P,
  f16: (arg: P) => Q,
  f17: (arg: Q) => R
): (x: A) => R;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M,
  f13: (arg: M) => N,
  f14: (arg: N) => O,
  f15: (arg: O) => P,
  f16: (arg: P) => Q,
  f17: (arg: Q) => R,
  f18: (arg: R) => S
): (x: A) => S;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M,
  f13: (arg: M) => N,
  f14: (arg: N) => O,
  f15: (arg: O) => P,
  f16: (arg: P) => Q,
  f17: (arg: Q) => R,
  f18: (arg: R) => S,
  f19: (arg: S) => T
): (x: A) => T;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U>(
  f1: (arg: A) => B,
  f2: (arg: B) => C,
  f3: (arg: C) => D,
  f4: (arg: D) => E,
  f5: (arg: E) => F,
  f6: (arg: F) => G,
  f7: (arg: G) => H,
  f8: (arg: H) => I,
  f9: (arg: I) => J,
  f10: (arg: J) => K,
  f11: (arg: K) => L,
  f12: (arg: L) => M,
  f13: (arg: M) => N,
  f14: (arg: N) => O,
  f15: (arg: O) => P,
  f16: (arg: P) => Q,
  f17: (arg: Q) => R,
  f18: (arg: R) => S,
  f19: (arg: S) => T,
  f20: (arg: T) => U
): (x: A) => U;
// A runtime-built array of enhancers that each take and return the same shape
export function pipe<T>(...fns: Array<(arg: T) => T>): (x: T) => T;
export function pipe(
  ...fns: Array<(arg: unknown) => unknown>
): (x: unknown) => unknown {
  return (x: unknown) => fns.reduce((v, f) => f(v), x);
}

/**
 * Performs right-to-left function composition.
 * This is the mathematical composition order: (f ∘ g)(x) = f(g(x))
 *
 * @memberof compose
 * @function compose
 * @param {...Function} fns - Functions to compose
 * @returns {Function} Composed function following mathematical composition order
 *
 * @example
 * const addOne = x => x + 1;
 * const double = x => x * 2;
 * const doubleTheAddOne = compose(addOne, double);
 * console.log(doubleTheAddOne(3)); // Output: 7
 */
export function compose<A, B>(
  f1: (arg: A) => B
): (x: A) => B;
export function compose<A, B, C>(
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => C;
export function compose<A, B, C, D>(
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => D;
export function compose<A, B, C, D, E>(
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => E;
export function compose<A, B, C, D, E, F>(
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => F;
export function compose<A, B, C, D, E, F, G>(
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => G;
export function compose<A, B, C, D, E, F, G, H>(
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => H;
export function compose<A, B, C, D, E, F, G, H, I>(
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => I;
export function compose<A, B, C, D, E, F, G, H, I, J>(
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => J;
export function compose<A, B, C, D, E, F, G, H, I, J, K>(
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => K;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L>(
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => L;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => M;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  f13: (arg: M) => N,
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => N;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  f14: (arg: N) => O,
  f13: (arg: M) => N,
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => O;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  f15: (arg: O) => P,
  f14: (arg: N) => O,
  f13: (arg: M) => N,
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => P;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
  f16: (arg: P) => Q,
  f15: (arg: O) => P,
  f14: (arg: N) => O,
  f13: (arg: M) => N,
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => Q;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
  f17: (arg: Q) => R,
  f16: (arg: P) => Q,
  f15: (arg: O) => P,
  f14: (arg: N) => O,
  f13: (arg: M) => N,
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => R;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
  f18: (arg: R) => S,
  f17: (arg: Q) => R,
  f16: (arg: P) => Q,
  f15: (arg: O) => P,
  f14: (arg: N) => O,
  f13: (arg: M) => N,
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => S;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
  f19: (arg: S) => T,
  f18: (arg: R) => S,
  f17: (arg: Q) => R,
  f16: (arg: P) => Q,
  f15: (arg: O) => P,
  f14: (arg: N) => O,
  f13: (arg: M) => N,
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => T;
export function compose<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U>(
  f20: (arg: T) => U,
  f19: (arg: S) => T,
  f18: (arg: R) => S,
  f17: (arg: Q) => R,
  f16: (arg: P) => Q,
  f15: (arg: O) => P,
  f14: (arg: N) => O,
  f13: (arg: M) => N,
  f12: (arg: L) => M,
  f11: (arg: K) => L,
  f10: (arg: J) => K,
  f9: (arg: I) => J,
  f8: (arg: H) => I,
  f7: (arg: G) => H,
  f6: (arg: F) => G,
  f5: (arg: E) => F,
  f4: (arg: D) => E,
  f3: (arg: C) => D,
  f2: (arg: B) => C,
  f1: (arg: A) => B
): (x: A) => U;
// A runtime-built array of enhancers that each take and return the same shape
export function compose<T>(...fns: Array<(arg: T) => T>): (x: T) => T;
export function compose(
  ...fns: Array<(arg: unknown) => unknown>
): (x: unknown) => unknown {
  return (x: unknown) => fns.reduceRight((v, f) => f(v), x);
}

/**
 * Creates a function that applies transformations to an object with shared context.
 * Useful for applying multiple transformations while maintaining a shared state.
 *
 * @memberof compose
 * @function transform
 * @param {...Function} transformers - Functions that transform the object
 * @returns {Function} Function that applies all transformations with shared context
 *
 * @example
 * const withName = (obj, context) => ({ ...obj, name: context.name });
 * const withAge = (obj, context) => ({ ...obj, age: context.age });
 * const createPerson = transform(withName, withAge);
 *
 * const person = createPerson({}, { name: 'John', age: 30 });
 * // Result: { name: 'John', age: 30 }
 */
export const transform = <T, C = Record<string, unknown>>(
  ...transformers: Array<(obj: T, context: C) => Partial<T>>
) => (obj: T, context: C = {} as C): T => 
  transformers.reduce(
    (acc, transformer) => ({
      ...acc,
      ...transformer(acc, context)
    }), 
    obj
  );

/**
 * @typedef {Object} TransformContext
 * @property {any} [key] - Any contextual data needed by transformers
 */