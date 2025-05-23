import { PREFIX } from '../config';

// Store callbacks for theme change notifications
type ThemeChangeCallback = () => void;
const themeChangeCallbacks = new Set<ThemeChangeCallback>();

// Setup theme change observer
let themeObserver: MutationObserver | null = null;

/**
 * Setup observer for theme changes on body element
 */
const setupThemeObserver = (): void => {
  if (themeObserver) return; // Already set up

  themeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' && 
        (mutation.attributeName === 'data-theme' || mutation.attributeName === 'data-theme-mode')
      ) {
        // Notify all registered callbacks
        themeChangeCallbacks.forEach(callback => callback());
        break;
      }
    }
  });

  // Start observing body for theme changes
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-theme-mode']
  });
};

/**
 * Register a callback to be notified of theme changes
 * @param callback Function to call when theme changes
 * @returns Function to unregister the callback
 */
export const onThemeChange = (callback: ThemeChangeCallback): (() => void) => {
  // Setup observer if not already done
  if (!themeObserver) {
    setupThemeObserver();
  }

  themeChangeCallbacks.add(callback);
  
  // Return function to unregister
  return () => {
    themeChangeCallbacks.delete(callback);
  };
};

/**
 * Gets a theme color from CSS variables, with optional alpha/opacity support.
 * The prefix is automatically added to the variable name.
 * Colors are retrieved from the active theme (defined on body element) if available,
 * falling back to the default theme (defined on :root) if not found.
 *
 * @param {string} varName - The CSS variable name without prefix (e.g. 'sys-color-primary' or 'sys-color-primary-rgb')
 * @param {object} [options] - Options for color retrieval
 * @param {number} [options.alpha] - Alpha value (0-1) for rgba output (only works with --*-rgb variables)
 * @param {string} [options.fallback] - Fallback color if variable is not found
 * @param {ThemeChangeCallback} [options.onThemeChange] - Optional callback for theme changes
 * @returns {string} The color value (hex, rgb, or rgba)
 *
 * @example
 * // Basic usage
 * getThemeColor('sys-color-primary') // '#006493' (from active theme)
 * 
 * // With theme change notification
 * getThemeColor('sys-color-primary', {
 *   onThemeChange: () => {
 *     // Re-render or update component
 *     component.update();
 *   }
 * });
 */
export function getThemeColor(
  varName: string, 
  options?: { 
    alpha?: number, 
    fallback?: string,
    onThemeChange?: ThemeChangeCallback 
  }
): string {
  const prefixedVarName = `--${PREFIX}-${varName}`;
  
  // Register theme change callback if provided
  if (options?.onThemeChange) {
    onThemeChange(options.onThemeChange);
  }
  
  // First try to get the color from the active theme (body element)
  const bodyStyles = getComputedStyle(document.body);
  let value = bodyStyles.getPropertyValue(prefixedVarName).trim();
  
  // If not found in active theme, fall back to default theme (:root)
  if (!value) {
    const rootStyles = getComputedStyle(document.documentElement);
    value = rootStyles.getPropertyValue(prefixedVarName).trim();
  }
  
  // If still not found, use fallback or return empty
  if (!value && options?.fallback) return options.fallback;
  if (!value) return '';

  // If alpha is requested and value is rgb (e.g. '103, 80, 164')
  if (typeof options?.alpha === 'number' && /\d+,\s*\d+,\s*\d+/.test(value)) {
    return `rgba(${value}, ${options.alpha})`;
  }

  // If value is a hex color and alpha is requested, convert to rgba
  if (typeof options?.alpha === 'number' && /^#([\da-f]{6}|[\da-f]{3})$/i.test(value)) {
    const hex = value.replace('#', '');
    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${options.alpha})`;
  }

  return value;
}

// Cleanup observer when module is unloaded
if (typeof window !== 'undefined') {
  window.addEventListener('unload', () => {
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }
    themeChangeCallbacks.clear();
  });
} 