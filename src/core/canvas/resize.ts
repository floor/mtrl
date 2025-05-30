/**
 * Canvas resize utilities
 * Provides utilities for observing and handling canvas resize events
 */

/**
 * Observes resize events on an element and triggers a callback
 * Watches the specified element and debounces resize events
 * 
 * @param element - The element to observe for size changes
 * @param canvas - The canvas element (for context)
 * @param onResize - Callback to execute when the element resizes
 * @returns Cleanup function to stop observing
 */
export const observeCanvasResize = (
  element: HTMLElement,
  canvas: HTMLCanvasElement,
  onResize: () => void
): (() => void) => {
  
  let timeoutId: number | null = null;
  
  // Debounced resize handler
  const debouncedResize = (): void => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      onResize();
    }, 100);
  };
  
  // Use ResizeObserver if available
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const currentWidth = parseFloat(canvas.style.width || '0');
        
        // Only trigger if the element actually changed size significantly
        if (Math.abs(width - currentWidth) > 2) {
          debouncedResize();
        }
      }
    });
    
    // Observe the specified element
    observer.observe(element);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  } else {
    // Fallback to window resize
    window.addEventListener('resize', debouncedResize);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }
}; 