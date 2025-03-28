// src/core/layout/processor.ts
/**
 * @module core/layout
 * @description Lightweight processor for layout creation, optimized for bundle size
 */

import { Schema, LayoutResult, LayoutOptions } from './types';
import { isComponent } from './utils';
import { processArraySchema } from './array';
import { processObjectSchema } from './object';
import { isObject } from '../utils';

/**
 * Creates a component from a constructor or factory function
 * 
 * @param Component - Component constructor or factory function
 * @param options - Component creation options 
 * @param layoutOptions - Global layout options
 * @returns Created component instance
 */
export function createComponentInstance(
  Component: any, 
  options: Record<string, any> = {}, 
  layoutOptions: LayoutOptions = {}
): any {
  // Check if Component is a class constructor
  const isClass = typeof Component === 'function' && 
                 Component.prototype && 
                 Component.prototype.constructor === Component &&
                 // Exclude native constructors like Object, Array, etc.
                 Object.getPrototypeOf(Component) !== Function.prototype;

  // Use 'new' for class constructors, call directly for function factories
  return isClass
    ? new Component(options)
    : Component(options);
}

/**
 * Processes any type of layout definition (array or object)
 * This is the main entry point for schema processing
 * 
 * @param schema - Layout schema to process
 * @param parentElement - Parent element to attach to
 * @param level - Current nesting level 
 * @param options - Layout creation options
 * @returns Layout result object
 */
export function processSchema(
  schema: any, 
  parentElement: HTMLElement | null = null, 
  level: number = 0,
  options: LayoutOptions = {}
): LayoutResult {
  return Array.isArray(schema)
    ? processArraySchema(schema, parentElement, level, options)
    : processObjectSchema(schema, parentElement, options);
}