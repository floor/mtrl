// src/core/utils/performance.ts
/**
 * @module core/utils/performance
 * @description Performance utilities for optimizing high-frequency event handlers
 */

/**
 * Creates a throttled function that only invokes the provided function 
 * at most once per every specified wait milliseconds.
 *
 * Throttling ensures that the function executes at a regular interval,
 * which is useful for limiting the rate of execution for expensive operations.
 *
 * @param {Function} fn - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @param {Object} options - Configuration options
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout (default: true)
 * @param {boolean} options.trailing - Specify invoking on the trailing edge of the timeout (default: true)
 * @returns {Function} The throttled function
 *
 * @example
 * // Throttle scroll handler to execute at most once every 100ms
 * const throttledScroll = throttle((e) => {
 *   updateScrollPosition(window.scrollY);
 * }, 100);
 * 
 * window.addEventListener('scroll', throttledScroll);
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;
  let previous = 0;
  const { leading = true, trailing = true } = options;
  
  return function(this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    
    if (!previous && !leading) {
      previous = now;
    }
    
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      previous = now;
      fn.apply(this, args);
    } else if (!timeout && trailing) {
      timeout = window.setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
};

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait milliseconds have elapsed since the last time 
 * it was invoked.
 *
 * Debouncing groups multiple sequential calls into a single execution at the end,
 * which is useful for handling rapid-fire events like resize or input.
 *
 * @param {Function} fn - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Configuration options
 * @param {boolean} options.leading - Specify invoking on the leading edge of the timeout (default: false)
 * @param {boolean} options.maxWait - Maximum time function can be delayed before execution in milliseconds
 * @returns {Function} The debounced function
 *
 * @example
 * // Debounced search that executes 300ms after the user stops typing
 * const debouncedSearch = debounce((query) => {
 *   performSearch(query);
 * }, 300);
 * 
 * searchInput.addEventListener('input', (e) => {
 *   debouncedSearch(e.target.value);
 * });
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: { leading?: boolean; maxWait?: number } = {}
): ((...args: Parameters<T>) => void) => {
  let timeout: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  
  const { leading = false, maxWait } = options;
  
  // Calculate if max wait specified
  const shouldInvoke = (time: number): boolean => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    return (
      !lastCallTime ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };
  
  // Function to invoke the original function
  const invokeFunc = (time: number): ReturnType<T> => {
    const args = lastArgs as Parameters<T>;
    const thisArg = lastThis;
    
    lastArgs = lastThis = null;
    lastInvokeTime = time;
    
    result = fn.apply(thisArg, args);
    return result;
  };
  
  // Function to handle a new call
  const trailingEdge = (time: number): ReturnType<T> => {
    timeout = null;
    
    if (lastArgs) {
      return invokeFunc(time);
    }
    
    return result;
  };
  
  // Check if we should invoke immediately (leading edge)
  const leadingEdge = (time: number): ReturnType<T> => {
    lastInvokeTime = time;
    
    // Start the timeout for the trailing edge
    timeout = window.setTimeout(() => {
      trailingEdge(Date.now());
    }, wait);
    
    return leading ? invokeFunc(time) : result;
  };
  
  // Main debounced function to return
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(time);
      }
      
      if (maxWait !== undefined) {
        // Handle maxWait timing
        timeout = window.setTimeout(() => {
          const timeNow = Date.now();
          if (shouldInvoke(timeNow)) {
            return trailingEdge(timeNow);
          }
        }, Math.min(wait, maxWait - (time - lastInvokeTime)));
      }
    }
    
    if (timeout === null) {
      timeout = window.setTimeout(() => {
        trailingEdge(Date.now());
      }, wait);
    }
    
    return result;
  };
};

/**
 * Creates a function that is restricted to invoking the provided function once.
 * Repeat calls to the function return the value of the first invocation.
 * 
 * @param {Function} fn - The function to restrict
 * @returns {Function} The restricted function
 * 
 * @example
 * // Initialize app only once
 * const initApp = once(() => {
 *   console.log('App initialized');
 *   setupEventListeners();
 *   loadInitialData();
 * });
 * 
 * // Can be called multiple times, but executes only once
 * button1.addEventListener('click', initApp);
 * button2.addEventListener('click', initApp);
 */
export const once = <T extends (...args: any[]) => any>(
  fn: T
): ((...args: Parameters<T>) => ReturnType<T>) => {
  let called = false;
  let result: ReturnType<T>;
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    
    return result;
  };
};