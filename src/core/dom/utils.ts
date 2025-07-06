// src/core/dom/utils.ts

// Import optimized normalizeClasses from classes module
export { normalizeClasses } from "./classes";

/**
 * Creates a DOM element with attributes
 *
 * @param tag - Element tag name
 * @param attributes - Element attributes
 * @returns Created element
 */
export const createElement = <T extends HTMLElement>(
  tag: string,
  attributes: Record<string, any> = {}
): T => {
  const element = document.createElement(tag) as T;

  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "className") {
      element.className = value;
    } else if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value);
    } else if (key === "data" && typeof value === "object") {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = String(dataValue);
      });
    } else if (key === "children" && Array.isArray(value)) {
      value.forEach((child) => {
        if (child instanceof Node) {
          element.appendChild(child);
        } else if (child != null) {
          element.appendChild(document.createTextNode(String(child)));
        }
      });
    } else if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (value !== null && value !== undefined) {
      element.setAttribute(key, String(value));
    }
  });

  return element;
};

/**
 * Sets inline styles on an element
 *
 * @param element - Target element
 * @param styles - Styles to set
 * @returns Modified element
 */
export const setStyles = <T extends HTMLElement>(
  element: T,
  styles: Partial<CSSStyleDeclaration>
): T => {
  Object.assign(element.style, styles);
  return element;
};

/**
 * Checks if an element matches a selector
 *
 * @param element - Element to check
 * @param selector - CSS selector
 * @returns Whether element matches selector
 */
export const matches = (element: Element, selector: string): boolean => {
  return element.matches(selector);
};

/**
 * Finds the closest ancestor matching a selector
 *
 * @param element - Starting element
 * @param selector - CSS selector
 * @returns Matching ancestor or null
 */
export const closest = <T extends HTMLElement>(
  element: Element,
  selector: string
): T | null => {
  return element.closest(selector) as T | null;
};
