// src/core/structure/create.ts
/**
 * @module core/structure
 * @description Main structure creation functionality with optimized DOM operations
 */

import { Schema, StructureResult } from './types';
import { processSchema } from './processor';
import { createStructureResult } from './result';

/**
 * Creates a DOM or component structure based on a structure definition
 * Uses batched DOM operations for better performance
 * 
 * @param schema - Structure definition (array-based, object-based, or HTML string)
 * @param parentElement - Optional parent element to attach structure to
 * @returns Object containing the structure and utility functions
 */
export function createStructure(
  schema: Schema | any[] | string | Function, 
  parentElement: HTMLElement | null = null
): StructureResult {
  // If schema is a function, execute it to get the actual schema
  if (typeof schema === 'function') {
    schema = schema();
  }
  
  // Parse HTML string into a structure if needed
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
    
    // Create a basic structure for HTML string
    const structure = { 
      element: fragment.firstElementChild as HTMLElement 
    };
    
    // Create structure result with HTML content
    return createStructureResult(structure);
  }
  
  // Process the schema using our unified processor
  return processSchema(schema, parentElement);
}