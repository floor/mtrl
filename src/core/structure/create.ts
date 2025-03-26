// src/core/structure/create.ts
/**
 * @module core/structure
 * @description Main structure creation functionality
 */

import { Schema, StructureResult } from './types';
import { processArraySchema } from './array';
import { processObjectSchema } from './object';

/**
 * Creates a DOM or component structure based on a structure definition
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
  
  // Process array-based schema directly
  if (Array.isArray(schema)) {
    return processArraySchema(schema, parentElement);
  }
  
  // Process object schema (default)
  return processObjectSchema(schema as Schema, parentElement);
}