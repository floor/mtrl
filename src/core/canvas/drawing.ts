/**
 * Canvas drawing utilities
 * Provides common drawing functions for canvas operations
 */

/**
 * Creates a rounded rectangle path
 * @param ctx - Canvas 2D rendering context
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param radius - Corner radius (can be a number or array of radii)
 */
export const createRoundedRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | [number, number, number, number]
): void => {
  if (width < 0 || height < 0) return;
  
  // Handle single radius or array of radii [topLeft, topRight, bottomRight, bottomLeft]
  const radii = typeof radius === 'number' 
    ? [radius, radius, radius, radius] 
    : radius;
  
  const [tl, tr, br, bl] = radii;
  
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + width - tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + tr);
  ctx.lineTo(x + width, y + height - br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
  ctx.lineTo(x + bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
};

/**
 * Draws a filled rounded rectangle
 * @param ctx - Canvas 2D rendering context
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param radius - Corner radius
 * @param fillStyle - Fill color/style
 */
export const fillRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | [number, number, number, number],
  fillStyle?: string | CanvasGradient | CanvasPattern
): void => {
  ctx.save();
  if (fillStyle) ctx.fillStyle = fillStyle;
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.restore();
};

/**
 * Creates a clipping region with rounded corners
 * @param ctx - Canvas 2D rendering context
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param radius - Corner radius
 * @returns Function to restore the canvas state
 */
export const clipRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | [number, number, number, number]
): (() => void) => {
  ctx.save();
  createRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.clip();
  
  // Return restore function
  return () => ctx.restore();
};

/**
 * Draws a rounded rectangle with different left and right radii
 * Useful for track segments that connect to other elements
 * @param ctx - Canvas 2D rendering context
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param leftRadius - Left side radius
 * @param rightRadius - Right side radius
 * @param fillStyle - Fill color/style
 */
export const fillRoundedRectLR = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  leftRadius: number,
  rightRadius: number,
  fillStyle?: string | CanvasGradient | CanvasPattern
): void => {
  if (width < 0 || height < 0) return;
  
  ctx.save();
  if (fillStyle) ctx.fillStyle = fillStyle;
  
  ctx.beginPath();
  // Top edge
  ctx.moveTo(x + leftRadius, y);
  ctx.lineTo(x + width - rightRadius, y);
  // Top right corner
  ctx.quadraticCurveTo(x + width, y, x + width, y + rightRadius);
  // Right edge
  ctx.lineTo(x + width, y + height - rightRadius);
  // Bottom right corner
  ctx.quadraticCurveTo(x + width, y + height, x + width - rightRadius, y + height);
  // Bottom edge
  ctx.lineTo(x + leftRadius, y + height);
  // Bottom left corner
  ctx.quadraticCurveTo(x, y + height, x, y + height - leftRadius);
  // Left edge
  ctx.lineTo(x, y + leftRadius);
  // Top left corner
  ctx.quadraticCurveTo(x, y, x + leftRadius, y);
  ctx.closePath();
  
  ctx.fill();
  ctx.restore();
};

/**
 * Clears a canvas with optional background color
 * @param ctx - Canvas 2D rendering context
 * @param width - Canvas width
 * @param height - Canvas height
 * @param backgroundColor - Optional background color
 */
export const clearCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundColor?: string
): void => {
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }
}; 