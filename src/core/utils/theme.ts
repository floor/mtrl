import { PREFIX } from '../config';

// Store callbacks for theme change notifications
type ThemeChangeCallback = () => void;
const themeChangeCallbacks = new Set<ThemeChangeCallback>();

// Setup theme change observer
let themeObserver: MutationObserver | null = null;

/**
 * Setup observer for theme changes anywhere in the document
 */
const setupThemeObserver = (): void => {
  if (themeObserver) return; // Already set up

  // The filter keeps the records to these two attributes, so any record is a
  // theme change
  themeObserver = new MutationObserver(() => {
    themeChangeCallbacks.forEach(callback => callback());
  });

  // A theme is data-theme / data-theme-mode on <html>, on <body>, or on any
  // element below them: a themed section, a card, a dark panel (FLO-389).
  // The subtree takes them all in; the filter keeps it to those attributes.
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-theme-mode'],
    subtree: true,
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
    if (themeChangeCallbacks.size === 0) {
      themeObserver?.disconnect();
      themeObserver = null;
    }
  };
};

const HEX = /^#([\da-f]{6}|[\da-f]{3})$/i;
const RGB_TRIPLET = /^\d+,\s*\d+,\s*\d+$/;

/** '#6750a4' or '#fff' → '103, 80, 164'; anything else → null. */
const hexToTriplet = (value: string): string | null => {
  if (!HEX.test(value)) return null;
  const hex = value.slice(1);
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  return [0, 2, 4].map((i) => parseInt(full.substring(i, i + 2), 16)).join(', ');
};

/**
 * Reads --<prefix>-<name> where `element` sits, so a theme set on any
 * ancestor, or on a shadow host, applies (FLO-389). Without a connected
 * element: from the active theme (<body>), then from :root.
 */
const readVar = (name: string, element?: Element | null): string => {
  const read = (from: Element): string => getComputedStyle(from).getPropertyValue(`--${PREFIX}-${name}`).trim();
  return element?.isConnected ? read(element) : read(document.body) || read(document.documentElement);
};

/**
 * Gets a theme color from CSS variables, with optional alpha/opacity support.
 * The prefix is automatically added to the variable name.
 * With `element`, colors are read where that element sits, so a theme set on
 * any ancestor (or a shadow host) applies. Otherwise they are retrieved from
 * the active theme (defined on body element) if available, falling back to
 * the default theme (defined on :root) if not found.
 *
 * @param {string} varName - The CSS variable name without prefix (e.g. 'sys-color-primary')
 * @param {object} [options] - Options for color retrieval
 * @param {number} [options.alpha] - Alpha value (0-1): a hex colour is returned as rgba()
 * @param {string} [options.fallback] - Fallback color if variable is not found
 * @param {Element} [options.element] - Element whose theme to read; used when it is in a document
 * @param {ThemeChangeCallback} [options.onThemeChange] - Optional callback for theme changes
 * @returns {string} The color value (hex, rgb, or rgba)
 *
 * The themes declare no `--<prefix>-sys-color-*-rgb` twins (FLO-311), and 1.0
 * no longer derives them: read `sys-color-X`, with `alpha` for rgba().
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
    element?: Element | null,
    onThemeChange?: ThemeChangeCallback 
  }
): string {
  // Register theme change callback if provided
  if (options?.onThemeChange) {
    onThemeChange(options.onThemeChange);
  }

  const value = readVar(varName, options?.element);

  // If still not found, use fallback or return empty
  if (!value && options?.fallback) return options.fallback;
  if (!value) return '';

  if (typeof options?.alpha === 'number') {
    // An rgb triplet (e.g. '103, 80, 164') or a hex colour becomes rgba()
    const triplet = RGB_TRIPLET.test(value) ? value : hexToTriplet(value);
    if (triplet) return `rgba(${triplet}, ${options.alpha})`;
  }

  return value;
}

// Cleanup observer when the page goes away. pagehide, not unload: an unload
// listener is deprecated in Chrome, reported as a permissions policy
// violation, and keeps the page out of the back/forward cache.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }
    themeChangeCallbacks.clear();
  });
} 