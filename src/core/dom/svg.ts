/**
 * @module core/dom
 * @description SVG-specific DOM utilities
 */

/**
 * Case-sensitive SVG attributes that must preserve their casing
 */
export const SVG_CASE_SENSITIVE_ATTRS = [
  'viewBox',
  'preserveAspectRatio', 
  'gradientTransform',
  'patternTransform',
  'maskContentUnits',
  'maskUnits',
  'filterUnits',
  'primitiveUnits',
  'gradientUnits',
  'patternUnits'
];

/**
 * Creates an SVG element with proper namespace
 * 
 * @param {string} tag - SVG tag name (e.g., 'svg', 'circle', 'rect')
 * @param {Record<string, any>} attributes - Element attributes
 * @returns {SVGElement} Created SVG element
 */
export const createSvgElement = (tag: string, attributes: Record<string, any> = {}): SVGElement => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  
  // Set attributes with correct casing
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    
    // Check if attribute needs case preservation
    const lowerKey = key.toLowerCase();
    const caseSensitiveAttr = SVG_CASE_SENSITIVE_ATTRS.find(
      attr => attr.toLowerCase() === lowerKey
    );
    
    if (caseSensitiveAttr) {
      element.setAttributeNS(null, caseSensitiveAttr, String(value));
    } else {
      element.setAttribute(key, String(value));
    }
  });
  
  return element;
};

/**
 * Checks if an element is an SVG element
 * 
 * @param {Element} element - Element to check
 * @returns {boolean} Whether the element is an SVG element
 */
export const isSvgElement = (element: Element): boolean => {
  return element.namespaceURI === 'http://www.w3.org/2000/svg';
};

/**
 * Sets an attribute on an SVG element, preserving case sensitivity for attributes that need it
 * 
 * @param {SVGElement} element - SVG element
 * @param {string} name - Attribute name
 * @param {any} value - Attribute value
 * @returns {SVGElement} The element for chaining
 */
export const setSvgAttribute = (element: SVGElement, name: string, value: any): SVGElement => {
  if (value === null || value === undefined) return element;
  
  // Check if attribute needs case preservation
  const lowerName = name.toLowerCase();
  const caseSensitiveAttr = SVG_CASE_SENSITIVE_ATTRS.find(
    attr => attr.toLowerCase() === lowerName
  );
  
  if (caseSensitiveAttr) {
    element.setAttributeNS(null, caseSensitiveAttr, String(value));
  } else {
    element.setAttribute(name, String(value));
  }
  
  return element;
};

/**
 * Sets multiple attributes on an SVG element
 * 
 * @param {SVGElement} element - SVG element
 * @param {Record<string, any>} attributes - Attributes to set
 * @returns {SVGElement} The element for chaining
 */
export const setSvgAttributes = (element: SVGElement, attributes: Record<string, any> = {}): SVGElement => {
  Object.entries(attributes).forEach(([key, value]) => {
    setSvgAttribute(element, key, value);
  });
  
  return element;
}; 