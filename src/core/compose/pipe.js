// @file src/core/compose/pipe.js
// @module core/compose

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
export const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x)

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
export const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x)

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
export const transform = (...transformers) => (obj, context = {}) =>
  transformers.reduce((acc, transformer) => ({
    ...acc,
    ...transformer(acc, context)
  }), obj)

/**
 * @typedef {Object} TransformContext
 * @property {any} [key] - Any contextual data needed by transformers
 */
