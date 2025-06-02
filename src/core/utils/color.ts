/**
 * Converts a color to RGBA format with specified opacity
 * Handles hex, rgb, rgba, and named colors
 * 
 * @param color - The color string to convert (hex, rgb, rgba, or named color)
 * @param opacity - The opacity value (0-1)
 * @returns RGBA color string
 * 
 * @example
 * colorToRGBA('#ff0000', 0.5) // 'rgba(255, 0, 0, 0.5)'
 * colorToRGBA('rgb(255, 0, 0)', 0.5) // 'rgba(255, 0, 0, 0.5)'
 * colorToRGBA('red', 0.5) // 'rgba(255, 0, 0, 0.5)'
 */
export const colorToRGBA = (color: string, opacity: number): string => {
  // Create a temporary canvas to get computed color
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return `rgba(0, 0, 0, ${opacity})`;
  
  // Set the color and get computed value
  ctx.fillStyle = color;
  const computedColor = ctx.fillStyle;
  
  // Handle hex colors
  if (computedColor.startsWith('#')) {
    const hex = computedColor.substring(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Handle rgb/rgba colors
  if (computedColor.startsWith('rgb')) {
    const match = computedColor.match(/\d+/g);
    if (match) {
      const [r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  // Fallback
  return `rgba(0, 0, 0, ${opacity})`;
}; 