// src/core/layout/create.ts
/**
 * @module core/layout
 * @description Main layout creation functionality
 */

import { Schema, LayoutResult, LayoutOptions } from './types';
import { processSchema } from './processor';
import { createLayoutResult } from './result';

/**
 * Creates a DOM or component layout based on a layout definition
 * 
 * @param schema - Layout definition (array-based, object-based, or HTML string)
 * @param parentElement - Optional parent element to attach layout to
 * @param options - Additional options for layout creation
 * @returns Object containing the layout and utility functions
 */
export function createLayout(
  schema: Schema | any[] | string | Function, 
  parentElement: HTMLElement | null = null,
  options: LayoutOptions = {}
): LayoutResult {
  // If schema is a function, execute it to get the actual schema
  if (typeof schema === 'function') {
    schema = schema();
  }
  
  // Parse HTML string into a layout if needed
  if (typeof schema === 'string') {
    // Create a temporary element to parse HTML
    const template = document.createElement('template');
    template.innerHTML = schema.trim();
    
    // Use the parsed DOM structure directly
    const fragment = template.content;
    
    if (parentElement && fragment.hasChildNodes()) {
      // Batch DOM operation - append all nodes at once
      parentElement.appendChild(fragment);
    }
    
    // Create a basic layout for HTML string
    const layout = { 
      element: fragment.firstElementChild as HTMLElement 
    };
    
    // Create layout result with HTML content
    return createLayoutResult(layout);
  }
  
  // Process the schema using our unified processor with options
  return processSchema(schema, parentElement, 0, options);
}