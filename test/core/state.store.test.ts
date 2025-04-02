// test/core/state.store.test.ts
import { describe, test, expect, mock, spyOn } from 'bun:test';
import { createStore, loggingMiddleware } from '../../src/core/state/store';

describe('State Store', () => {
  test('should create a store with initial state', () => {
    const initialState = { count: 0, name: 'test' };
    const store = createStore(initialState);
    
    expect(store.getState()).toEqual(initialState);
  });
  
  test('should update state with partial object', () => {
    const store = createStore({ count: 0, name: 'test' });
    
    store.setState({ count: 5 });
    
    expect(store.getState()).toEqual({ count: 5, name: 'test' });
  });
  
  test('should update state with updater function', () => {
    const store = createStore({ count: 0, name: 'test' });
    
    store.setState(state => ({
      ...state,
      count: state.count + 1
    }));
    
    expect(store.getState()).toEqual({ count: 1, name: 'test' });
  });
  
  test('should notify subscribers of state changes', () => {
    const store = createStore({ count: 0 });
    const listener = mock((state, oldState) => {});
    
    store.subscribe(listener);
    store.setState({ count: 1 });
    
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
  });
  
  test('should return unsubscribe function', () => {
    const store = createStore({ count: 0 });
    const listener = mock((state, oldState) => {});
    
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    
    store.setState({ count: 1 });
    expect(listener).toHaveBeenCalledTimes(0);
  });
  
  test('should create derived state', () => {
    const store = createStore({ count: 0 });
    
    store.derive('doubleCount', state => state.count * 2);
    store.setState({ count: 3 });
    
    const state = store.getState();
    expect(state.count).toBe(3);
    expect(state.doubleCount).toBe(6);
  });
  
  test('should remove derived state when returned function is called', () => {
    const store = createStore({ count: 0 });
    
    const removeDerived = store.derive('doubleCount', state => state.count * 2);
    expect(store.getState().doubleCount).toBe(0);
    
    removeDerived();
    expect(store.getState().doubleCount).toBeUndefined();
  });
  
  test('should select a slice of state', () => {
    const store = createStore({ user: { name: 'Alice', age: 30 }, count: 0 });
    
    const userName = store.select(state => state.user.name);
    expect(userName).toBe('Alice');
  });
  
  test('should reset state to initial values', () => {
    const initialState = { count: 0, name: 'test' };
    const store = createStore(initialState);
    
    store.setState({ count: 5, name: 'updated' });
    expect(store.getState()).toEqual({ count: 5, name: 'updated' });
    
    store.reset();
    expect(store.getState()).toEqual(initialState);
  });
  
  test('should apply middleware to state changes', () => {
    const middlewareFn = mock((newState, oldState) => ({ ...newState, processed: true }));
    const store = createStore(
      { count: 0 },
      { middleware: [middlewareFn] }
    );
    
    store.setState({ count: 1 });
    
    expect(middlewareFn).toHaveBeenCalledTimes(1);
    expect(middlewareFn).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
    expect(store.getState()).toEqual({ count: 1, processed: true });
  });
  
  test('should apply multiple middleware in order', () => {
    const middleware1 = (newState: any, oldState: any) => ({ ...newState, m1: true });
    const middleware2 = (newState: any, oldState: any) => ({ ...newState, m2: true });
    
    const store = createStore(
      { count: 0 },
      { middleware: [middleware1, middleware2] }
    );
    
    store.setState({ count: 1 });
    
    expect(store.getState()).toEqual({ count: 1, m1: true, m2: true });
  });
  
  test('should support logging middleware', () => {
    // Mock console.log
    const originalConsoleLog = console.log;
    console.log = mock(() => {});
    
    const store = createStore(
      { count: 0 },
      { middleware: [loggingMiddleware] }
    );
    
    store.setState({ count: 1 });
    
    expect(console.log).toHaveBeenCalledTimes(1);
    
    // Restore console.log
    console.log = originalConsoleLog;
  });
  
  test('should handle complex state structures', () => {
    interface ComplexState {
      user: {
        name: string;
        settings: {
          theme: string;
          notifications: boolean;
        };
      };
      posts: string[];
      meta: Record<string, any>;
    }
    
    const initialState: ComplexState = {
      user: {
        name: 'Alice',
        settings: {
          theme: 'dark',
          notifications: true
        }
      },
      posts: ['Hello', 'World'],
      meta: { version: '1.0' }
    };
    
    const store = createStore(initialState);
    
    // Update nested property
    store.setState(state => ({
      ...state,
      user: {
        ...state.user,
        settings: {
          ...state.user.settings,
          theme: 'light'
        }
      }
    }));
    
    expect(store.getState().user.settings.theme).toBe('light');
    expect(store.getState().user.settings.notifications).toBe(true);
    
    // Add to array
    store.setState(state => ({
      ...state,
      posts: [...state.posts, 'New Post']
    }));
    
    expect(store.getState().posts).toEqual(['Hello', 'World', 'New Post']);
  });
});