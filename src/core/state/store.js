// src/core/state/store.js
import { createEmitter } from './emitter'

/**
 * Creates a state store with support for derived state and middleware
 * @template T
 * @param {T} initialState - Initial state object
 * @param {Object} [options] - Store options
 * @param {Function[]} [options.middleware] - Middleware functions
 * @returns {Object} State store interface
 */
export const createStore = (initialState = {}, options = {}) => {
  let state = { ...initialState }
  const emitter = createEmitter()
  const derivedStates = new Map()
  const middleware = options.middleware || []

  const notifyListeners = (newState, oldState) => {
    emitter.emit('change', newState, oldState)
  }

  const applyMiddleware = (newState, oldState) => {
    return middleware.reduce((state, fn) => fn(state, oldState), newState)
  }

  return {
    /**
     * Get current state including derived values
     * @returns {T} Current state
     */
    getState: () => {
      const derivedValues = {}
      derivedStates.forEach((compute, key) => {
        derivedValues[key] = compute(state)
      })
      return { ...state, ...derivedValues }
    },

    /**
     * Update state
     * @param {Object|Function} update - State update or updater function
     */
    setState: (update) => {
      const oldState = { ...state }
      const newState = typeof update === 'function' 
        ? update(state)
        : { ...state, ...update }

      state = applyMiddleware(newState, oldState)
      notifyListeners(state, oldState)
    },

    /**
     * Subscribe to state changes
     * @param {Function} listener - Change listener
     * @returns {Function} Unsubscribe function
     */
    subscribe: (listener) => emitter.on('change', listener),

    /**
     * Create a derived state value
     * @param {string} key - Derived state key
     * @param {Function} computation - Function to compute derived value
     * @returns {Function} Function to remove derived state
     */
    derive: (key, computation) => {
      derivedStates.set(key, computation)
      return () => {
        derivedStates.delete(key)
      }
    },

    /**
     * Select a specific slice of state
     * @param {Function} selector - State selector function
     * @returns {any} Selected state
     */
    select: (selector) => selector(state),

    /**
     * Reset state to initial values
     */
    reset: () => {
      state = { ...initialState }
      notifyListeners(state, null)
    }
  }
}

// Example middleware
export const loggingMiddleware = (newState, oldState) => {
  console.log('State change:', { 
    old: oldState, 
    new: newState, 
    diff: Object.keys(newState).reduce((acc, key) => {
      if (newState[key] !== oldState[key]) {
        acc[key] = { from: oldState[key], to: newState[key] }
      }
      return acc
    }, {})
  })
  return newState
}

// Example derived state
export const deriveFiltered = (predicate) => (state) => 
  Object.keys(state).reduce((acc, key) => {
    if (predicate(state[key], key)) {
      acc[key] = state[key]
    }
    return acc
  }, {})