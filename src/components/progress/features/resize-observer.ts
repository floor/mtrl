// src/components/progress/features/resize-observer.ts - Enhanced resize handling

/**
 * Creates a ResizeObserver to handle canvas dimension changes
 * This ensures the canvas always matches its container size
 */
export const createCanvasResizeObserver = (
  element: HTMLElement,
  canvas: HTMLCanvasElement,
  onResize: () => void
): (() => void) => {
  
  let resizeObserver: ResizeObserver | null = null;
  let timeoutId: number | null = null;
  
  // Debounced resize handler
  const debouncedResize = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      onResize();
      timeoutId = null;
    }, 100);
  };
  
  // Use ResizeObserver if available (modern browsers)
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Only trigger if the container actually changed size
        const { width, height } = entry.contentRect;
        const currentWidth = parseFloat(canvas.style.width || '0');
        const currentHeight = parseFloat(canvas.style.height || '0');
        
        if (Math.abs(width - currentWidth) > 1 || Math.abs(height - currentHeight) > 1) {
          debouncedResize();
        }
      }
    });
    
    // Observe the container element
    resizeObserver.observe(element);
  } else {
    // Fallback to window resize for older browsers
    window.addEventListener('resize', debouncedResize);
  }
  
  // Return cleanup function
  return (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    if (resizeObserver) {
      resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', debouncedResize);
    }
  };
};