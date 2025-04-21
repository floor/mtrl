// src/core/layout/template.ts
/**
 * @module core/layout/template
 * @description Template literal-based layout creation without compilation requirements
 */

import { createElement } from '../dom/create';
import { createLayout } from './create';

/**
 * Helper to parse a template string into DOM nodes
 */
function parseTemplate(strings: TemplateStringsArray, ...values: any[]): DocumentFragment {
  // Combine the template parts
  let html = '';
  strings.forEach((string, i) => {
    html += string;
    if (i < values.length) {
      // Convert values to strings safely
      html += values[i] === null || values[i] === undefined ? '' : String(values[i]);
    }
  });
  
  // Create a template element to parse the HTML
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

/**
 * Converts DOM nodes to our layout schema
 */
function domToSchema(node: Node, idPrefix = 'tpl'): any[] {
  // Handle text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent || '').trim();
    return text ? [text] : [];
  }
  
  // Handle element nodes
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    
    // Create a unique ID for this element
    const id = element.id || `${idPrefix}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Collect attributes
    const attributes: Record<string, string> = {};
    const events: Record<string, Function> = {};
    const style: Record<string, string> = {};
    
    // Parse special attributes like data-* for our layout system
    Array.from(element.attributes).forEach(attr => {
      // Special attribute handling
      if (attr.name.startsWith('data-event-')) {
        const eventName = attr.name.substring(11); // Remove 'data-event-'
        // This is just a placeholder - in a real implementation we'd need a way to
        // connect string references to actual functions
        events[eventName] = new Function('event', attr.value);
      } 
      else if (attr.name.startsWith('data-style-')) {
        const styleName = attr.name.substring(11).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        style[styleName] = attr.value;
      }
      else if (attr.name !== 'id' && attr.name !== 'class') {
        attributes[attr.name] = attr.value;
      }
    });
    
    // Collect options
    const options: Record<string, any> = {
      tag: element.tagName.toLowerCase(),
      className: element.className || undefined,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      style: Object.keys(style).length > 0 ? style : undefined,
      events: Object.keys(events).length > 0 ? events : undefined
    };
    
    // Clean up undefined properties
    Object.keys(options).forEach(key => {
      if (options[key] === undefined) delete options[key];
    });
    
    // Process children
    const childSchemas: any[] = [];
    Array.from(element.childNodes).forEach(child => {
      const childSchema = domToSchema(child, `${id}-child`);
      if (childSchema.length) {
        childSchemas.push(...childSchema);
      }
    });
    
    // Create the schema for this element
    const schema = [
      createElement, id, options
    ];
    
    // Add children if we have any
    if (childSchemas.length) {
      schema.push(childSchemas);
    }
    
    return schema;
  }
  
  // For any other node type, return an empty array
  return [];
}

/**
 * Tagged template function for creating layouts
 */
export function html(strings: TemplateStringsArray, ...values: any[]): any {
  // Parse the template to DOM
  const fragment = parseTemplate(strings, ...values);
  
  // Convert the DOM to our schema
  const schemas: any[] = [];
  Array.from(fragment.childNodes).forEach(node => {
    const schema = domToSchema(node);
    if (schema.length) {
      schemas.push(...schema);
    }
  });
  
  return schemas;
}

/**
 * Creates a layout from a template literal
 */
export function createTemplateLayout(templateResult: any[], parentElement?: HTMLElement | null) {
  return createLayout(templateResult, parentElement);
}