// src/core/layout/jsx.ts
/**
 * @module core/layout/jsx
 * @description Lightweight JSX implementation for the layout system
 */

import { createElement } from '../dom/create';
import { createLayout } from './create';

// Fragment support
export const Fragment = Symbol('Fragment');

/**
 * Convert JSX to our layout array schema
 */
export function h(type: string | Function | symbol, props: Record<string, any> | null, ...children: any[]): any {
  // Handle fragments (just return children)
  if (type === Fragment) {
    return children.flat(Infinity).filter(Boolean);
  }
  
  // Normalize props
  const normalizedProps = props || {};
  
  // Handle style prop - convert object to string
  if (normalizedProps.style && typeof normalizedProps.style === 'object') {
    normalizedProps.style = Object.entries(normalizedProps.style)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case
        const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        return `${kebabKey}: ${value}`;
      })
      .join('; ');
  }
  
  // Generate ID for the element if not provided
  const id = normalizedProps.id || normalizedProps.name || `el-${Math.floor(Math.random() * 10000)}`;
  
  // Remove special props that we'll handle separately
  const cleanProps = { ...normalizedProps };
  delete cleanProps.id;
  delete cleanProps.name;
  
  // Flatten children and convert to layout arrays
  const flatChildren = children
    .flat(Infinity)
    .filter(child => child !== null && child !== undefined && child !== false);
  
  // Convert JSX structure to array schema
  if (typeof type === 'function') {
    // Component function
    return [
      type, 
      id, 
      cleanProps, 
      flatChildren.length > 0 ? convertChildrenToArraySchema(flatChildren) : undefined
    ].filter(Boolean);
  } else if (typeof type === 'string') {
    // HTML tag via createElement
    return [
      createElement, 
      id, 
      { ...cleanProps, tag: type }, 
      flatChildren.length > 0 ? convertChildrenToArraySchema(flatChildren) : undefined
    ].filter(Boolean);
  }
  
  return [];
}

/**
 * Helper to convert children to array schema format
 */
function convertChildrenToArraySchema(children: any[]): any[] {
  const result = [];
  
  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
      // Text nodes become text options on parent or separate text nodes
      result.push(String(child));
    } else if (Array.isArray(child)) {
      // Handle arrays (like Fragment results)
      result.push(...convertChildrenToArraySchema(child));
    } else if (child && typeof child === 'object') {
      // JSX elements
      result.push(child);
    }
  }
  
  return result;
}

/**
 * Create a layout from JSX
 */
export function createJsxLayout(jsxElement: any, parentElement?: HTMLElement | null) {
  return createLayout(jsxElement, parentElement);
}