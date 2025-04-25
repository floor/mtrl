// src/core/collection/list-manager/dom-elements.ts
import { ListManagerElements } from './types';

/**
 * Creates and initializes the DOM elements needed by the list manager
 * @param container Container element
 * @returns Initialized DOM elements
 */
export function createDomElements(container: HTMLElement): ListManagerElements {
  // Set up container styles if needed
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  
  // Create content container
  const content = document.createElement('div');
  content.style.position = 'relative';
  content.style.width = '100%';
  content.style.willChange = 'transform';
  
  // Create spacer element for scroll height
  const spacer = document.createElement('div');
  spacer.style.position = 'absolute';
  spacer.style.top = '0';
  spacer.style.left = '0';
  spacer.style.width = '1px';
  spacer.style.visibility = 'hidden';
  spacer.style.pointerEvents = 'none';
  
  // Add elements to container
  container.appendChild(content);
  container.appendChild(spacer);
  
  return {
    container,
    content,
    spacer
  };
}

/**
 * Creates sentinel elements for intersection observer
 * @param elements List manager elements
 * @returns The DOM elements with sentinels added
 */
export function createSentinels(elements: ListManagerElements): ListManagerElements {
  // Create top sentinel
  const topSentinel = document.createElement('div');
  topSentinel.className = 'mtrl-list-sentinel mtrl-list-sentinel--top';
  topSentinel.style.position = 'absolute';
  topSentinel.style.top = '0';
  topSentinel.style.left = '0';
  topSentinel.style.width = '100%';
  topSentinel.style.height = '1px';
  topSentinel.style.pointerEvents = 'none';
  topSentinel.style.visibility = 'hidden';
  
  // Create bottom sentinel
  const bottomSentinel = document.createElement('div');
  bottomSentinel.className = 'mtrl-list-sentinel mtrl-list-sentinel--bottom';
  bottomSentinel.style.position = 'absolute';
  bottomSentinel.style.bottom = '0';
  bottomSentinel.style.left = '0';
  bottomSentinel.style.width = '100%';
  bottomSentinel.style.height = '1px';
  bottomSentinel.style.pointerEvents = 'none';
  bottomSentinel.style.visibility = 'hidden';
  
  // Add to DOM
  elements.content.appendChild(topSentinel);
  elements.content.appendChild(bottomSentinel);
  
  return {
    ...elements,
    topSentinel,
    bottomSentinel
  };
}

/**
 * Updates the position of the bottom sentinel based on total height
 * @param elements List manager elements
 * @param totalHeight Total height of list
 */
export function updateSentinelPositions(
  elements: ListManagerElements, 
  totalHeight: number
): void {
  if (elements.bottomSentinel && totalHeight > 0) {
    elements.bottomSentinel.style.top = `${totalHeight - 1}px`;
  }
}

/**
 * Updates the spacer element height
 * @param elements List manager elements
 * @param totalHeight Total height to set
 */
export function updateSpacerHeight(
  elements: ListManagerElements, 
  totalHeight: number
): void {
  elements.spacer.style.height = `${totalHeight}px`;
}

/**
 * Cleans up DOM elements
 * @param elements List manager elements
 */
export function cleanupDomElements(elements: ListManagerElements): void {
  // Remove content element if it exists in DOM
  if (elements.content.parentNode) {
    elements.content.parentNode.removeChild(elements.content);
  }
  
  // Remove spacer element if it exists in DOM
  if (elements.spacer.parentNode) {
    elements.spacer.parentNode.removeChild(elements.spacer);
  }
  
  // Remove sentinel elements if they exist
  if (elements.topSentinel && elements.topSentinel.parentNode) {
    elements.topSentinel.remove();
  }
  
  if (elements.bottomSentinel && elements.bottomSentinel.parentNode) {
    elements.bottomSentinel.remove();
  }
}