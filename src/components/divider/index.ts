// src/components/divider/index.ts

/**
 * @module Divider
 * 
 * The Divider component provides horizontal or vertical lines that separate content into distinct sections.
 * Dividers follow Material Design 3 guidelines for separating content in lists, layouts, and other UI containers.
 * 
 * Features:
 * - Horizontal and vertical orientations
 * - Multiple inset variants (full-width, inset, middle-inset)
 * - Customizable thickness and color
 * - Responsive to parent container
 * 
 * @example
 * ```typescript
 * // Create a standard horizontal divider
 * const divider = fDivider();
 * document.body.appendChild(divider.element);
 * 
 * // Create a vertical divider with custom styles
 * const verticalDivider = fDivider({
 *   orientation: 'vertical',
 *   thickness: 2,
 *   color: '#2196F3',
 *   variant: 'middle-inset'
 * });
 * ```
 * 
 * @category Components
 */

// Export new function name
import { fDivider } from './divider';
export { fDivider };

// Re-export legacy function name for backward compatibility
import { fDivider as createDivider } from './divider';
export { createDivider };

// Export types
export type { DividerConfig } from './config';
export type { DividerComponent } from './types';