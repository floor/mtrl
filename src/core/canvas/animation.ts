/**
 * Easing function for smooth animations (Material Design standard)
 * Implements cubic-bezier(0.4, 0, 0.2, 1)
 * 
 * @param t Progress value between 0 and 1
 * @returns Eased progress value between 0 and 1
 */
export const easeOutCubic = (t: number): number => {
  // Material Design standard easing curve
  // This is an approximation of cubic-bezier(0.4, 0, 0.2, 1)
  // For exact match, we need to solve the cubic bezier
  const p1x = 0.4, p1y = 0;
  const p2x = 0.2, p2y = 1;
  
  // Newton-Raphson method to solve for the bezier curve
  let x = t;
  for (let i = 0; i < 4; i++) {
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;
    
    const x2 = x * x;
    const x3 = x2 * x;
    
    const f = ax * x3 + bx * x2 + cx * x - t;
    const df = 3 * ax * x2 + 2 * bx * x + cx;
    
    if (Math.abs(f) < 0.00001) break;
    x = x - f / df;
  }
  
  // Calculate y from x
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  
  const x2 = x * x;
  const x3 = x2 * x;
  
  return ay * x3 + by * x2 + cy * x;
};

/**
 * Standard Material Design animation durations
 */
export const ANIMATION_DURATIONS = {
  SHORT: 100,
  MEDIUM: 225,
  LONG: 375,
  EXTRA_LONG: 500
};

/**
 * Common easing functions
 */
export const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  materialStandard: easeOutCubic
}; 