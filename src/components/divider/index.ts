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
 * const divider = createDivider();
 * document.body.appendChild(divider.element);
 * 
 * // Create a vertical divider with custom styles
 * const verticalDivider = createDivider({
 *   orientation: 'vertical',
 *   thickness: 2,
 *   color: '#2196F3',
 *   variant: 'middle-inset'
 * });
 * ```
 * 
 * @category Components
 */

// Use a more explicit export to avoid bundler confusion
import { createDivider } from './divider';
export { createDivider };

// Export types
export type { DividerConfig } from './config';
export type { DividerComponent } from './types';