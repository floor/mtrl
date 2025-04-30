/**
 * Result interface for background color lookup
 */
export interface BackgroundResult {
  /** The computed background color value */
  color: string;
  /** The element from which the color was obtained */
  element: HTMLElement | null;
}

/**
 * Gets the computed background color of an element or its ancestors.
 * Recursively traverses the DOM tree upward until it finds a non-transparent background.
 * Resolves CSS variables if used in background color.
 * 
 * @param {HTMLElement} element - The starting element to check
 * @param {number} [maxDepth=20] - Maximum number of parent levels to check
 * @returns {BackgroundResult} Object containing the color and source element
 * 
 * @example
 * // Get the inherited background color and its source element
 * const { color, element: sourceElement } = getInheritedBackground(myElement);
 * console.log(color); // 'rgb(255, 255, 255)' or '#1c2526' for dark mode
 * 
 * // Observe the source element for changes
 * if (sourceElement) {
 *   const observer = new MutationObserver(() => {
 *     const { color } = getInheritedBackground(myElement);
 *     myElement.style.backgroundColor = color;
 *   });
 *   
 *   observer.observe(sourceElement, { attributes: true, attributeFilter: ['style', 'class'] });
 * }
 */
export const getInheritedBackground = (element: HTMLElement, maxDepth = 17): BackgroundResult => {
  // Safety checks
  if (!element || !(element instanceof HTMLElement)) {
    return { color: '', element: null };
  }

  // Prevent infinite loops
  let depth = 0;
  let currentElement: HTMLElement | null = element;

  while (currentElement && depth < maxDepth) {
    // Get computed style
    const computedStyle = window.getComputedStyle(currentElement);
    let bgColor = computedStyle.backgroundColor;

    // Resolve CSS variables
    if (bgColor.startsWith('var(')) {
      const varMatch = bgColor.match(/var\((--[\w-]+)\)/);
      if (varMatch) {
        const varName = varMatch[1];
        bgColor = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || 'transparent';
      }
    }

    // Check if the background color is set and not transparent
    if (bgColor && 
        bgColor !== 'transparent' && 
        bgColor !== 'rgba(0, 0, 0, 0)' && 
        bgColor !== 'rgba(0,0,0,0)') {
      return { color: bgColor, element: currentElement };
    }

    // Move up to parent element
    currentElement = currentElement.parentElement;
    depth++;
  }

  // Fall back to document body
  const documentBG = window.getComputedStyle(document.body).backgroundColor;
  if (documentBG !== 'transparent' && documentBG !== 'rgba(0, 0, 0, 0)') {
    return { color: documentBG, element: document.body };
  }

  // Default to white
  return { color: 'rgb(255, 255, 255)', element: null };
};

/**
 * For backwards compatibility
 * @deprecated Use getInheritedBackground instead
 */
export const getInheritedBG = (element: HTMLElement, maxDepth = 17): string => {
  return getInheritedBackground(element, maxDepth).color;
};

export default getInheritedBackground;