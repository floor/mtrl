// src/core/state/store.ts

import { createEmitter, Emitter } from './emitter';

/**
 * State store options
 */
export interface StoreOptions<T> {
  /**
   * Middleware functions that process state changes
   */
  middleware?: Array<(newState: T, oldState: T) => T>;
}

/**
 * State selector function type
 */
export type Selector<T, R> = (state: T) => R;

/**
 * State computation function type for derived state
 */
export type Computation<T, R> = (state: T) => R;

/**
 * State updater function type
 */
export type Updater<T> = (state: T) => T;

/**
 * State store interface
 */
export interface Store<T> {
  /**
   * Gets current state including derived values
   * @returns Current state
   */
  getState: () => T;
  
  /**
   * Updates state
   * @param update - State update object or updater function
   */
  setState: (update: Partial<T> | Updater<T>) => void;
  
  /**
   * Subscribes to state changes
   * @param listener - Change listener
   * @returns Unsubscribe function
   */
  subscribe: (listener: (state: T, oldState: T) => void) => () => void;
  
  /**
   * Creates a derived state value
   * @param key - Derived state key
   * @param computation - Function to compute derived value
   * @returns Function to remove derived state
   */
  derive: <K extends string, R>(key: K, computation: Computation<T, R>) => () => void;
  
  /**
   * Selects a specific slice of state
   * @param selector - State selector function
   * @returns Selected state
   */
  select: <R>(selector: Selector<T, R>) => R;
  
  /**
   * Resets state to initial values
   */
  reset: () => void;
}

/**
 * Creates a state store with support for derived state and middleware
 * 
 * @param initialState - Initial state object
 * @param options - Store options
 * @returns State store interface
 */
export const createStore = <T extends Record<string, any>>(
  initialState: T = {} as T, 
  options: StoreOptions<T> = {}
): Store<T> => {
  let state = { ...initialState };
  const emitter: Emitter = createEmitter();
  const derivedStates = new Map<string, Computation<T, any>>();
  const middleware = options.middleware || [];

  const notifyListeners = (newState: T, oldState: T): void => {
    emitter.emit('change', newState, oldState);
  };

  const applyMiddleware = (newState: T, oldState: T): T => {
    return middleware.reduce((state, fn) => fn(state, oldState), newState);
  };

  return {
    /**
     * Gets current state including derived values
     * @returns Current state
     */
    getState: (): T => {
      const derivedValues: Record<string, any> = {};
      derivedStates.forEach((compute, key) => {
        derivedValues[key] = compute(state);
      });
      return { ...state, ...derivedValues };
    },

    /**
     * Updates state
     * @param update - State update object or updater function
     */
    setState: (update: Partial<T> | Updater<T>): void => {
      const oldState = { ...state };
      const newState = typeof update === 'function' 
        ? update(state)
        : { ...state, ...update };

      state = applyMiddleware(newState as T, oldState);
      notifyListeners(state, oldState);
    },

    /**
     * Subscribes to state changes
     * @param listener - Change listener
     * @returns Unsubscribe function
     */
    subscribe: (listener: (state: T, oldState: T) => void): (() => void) => 
      emitter.on('change', listener),

    /**
     * Creates a derived state value
     * @param key - Derived state key
     * @param computation - Function to compute derived value
     * @returns Function to remove derived state
     */
    derive: <K extends string, R>(key: K, computation: Computation<T, R>): (() => void) => {
      derivedStates.set(key, computation);
      return () => {
        derivedStates.delete(key);
      };
    },

    /**
     * Selects a specific slice of state
     * @param selector - State selector function
     * @returns Selected state
     */
    select: <R>(selector: Selector<T, R>): R => selector(state),

    /**
     * Resets state to initial values
     */
    reset: (): void => {
      state = { ...initialState };
      notifyListeners(state, {} as T);
    }
  };
};

/**
 * Example middleware that logs state changes
 * 
 * @param newState - New state after change
 * @param oldState - Previous state before change
 * @returns Processed state (unchanged in this middleware)
 */
export const loggingMiddleware = <T extends Record<string, any>>(newState: T, oldState: T): T => {
  console.log('State change:', { 
    old: oldState, 
    new: newState, 
    diff: Object.keys(newState).reduce((acc, key) => {
      if (newState[key] !== oldState[key]) {
        acc[key] = { from: oldState[key], to: newState[key] };
      }
      return acc;
    }, {} as Record<string, { from: any; to: any }>)
  });
  return newState;
};

/**
 * Creates a derived state selector for filtering objects
 * 
 * @param predicate - Filter predicate function
 * @returns Computation function for derived state
 */
export const deriveFiltered = <T>(predicate: (value: any, key: string) => boolean) => 
  (state: Record<string, T>): Record<string, T> => 
    Object.keys(state).reduce((acc, key) => {
      if (predicate(state[key], key)) {
        acc[key] = state[key];
      }
      return acc;
    }, {} as Record<string, T>);