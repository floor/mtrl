// src/core/layout/object.ts
/**
 * @module core/layout
 * @description Processor for object-based layout schemas
 */

import { createElement } from "../dom/create";
import { Schema, LayoutResult, LayoutOptions } from "./types";
import { isComponent, createFragment, processClassNames } from "./utils";
import { createLayoutResult } from "./result";
import { createComponentInstance } from "./processor";

/**
 * Interface for the layout object
 */
interface LayoutObject {
  element?: any;
  [key: string]: any;
}

/**
 * Processes an object-based layout definition
 *
 * @param schema - Object-based layout definition
 * @param parentElement - Optional parent element to attach layout to
 * @param options - Layout creation options
 * @returns Layout result object
 */
export function processObjectSchema(
  schema: Schema,
  parentElement: HTMLElement | SVGElement | DocumentFragment | null = null,
  options: LayoutOptions = {}
): LayoutResult {
  const layout: LayoutObject = {};

  // Get default creator function from options or use createElement
  const defaultCreator = options.creator || createElement;

  // Handle root element creation
  if (schema.element && !parentElement) {
    const elementDef = schema.element;
    const createElementFn = elementDef.creator || defaultCreator;

    // Process class names based on prefix option
    const elementOptions = elementDef.options || {};
    const processedOptions =
      options.prefix !== false
        ? processClassNames(elementOptions)
        : { ...elementOptions };

    const rootComponent = createComponentInstance(
      createElementFn,
      processedOptions,
      options
    );
    const rootElement = isComponent(rootComponent)
      ? rootComponent.element
      : rootComponent;

    layout.element = rootComponent;
    if (elementDef.name) layout[elementDef.name] = rootComponent;

    // Process children
    if (elementDef.children) {
      const fragment = createFragment();
      const childLayouts = [];

      for (const key in elementDef.children) {
        const childDef = elementDef.children[key];

        // Simple fix: Store component's key as name if not provided
        if (childDef && !childDef.name) {
          childDef.name = key;
        }

        const childResult = processObjectSchema(
          { [key]: childDef },
          fragment,
          options
        );
        childLayouts.push(childResult.layout);
      }

      rootElement.appendChild(fragment);

      // Merge child layouts
      for (const childLayout of childLayouts) {
        Object.assign(layout, childLayout);
      }
    }

    return createLayoutResult(layout);
  }

  // Process normal schema elements
  const fragment = parentElement ? createFragment() : null;
  const childLayouts = [];

  for (const key in schema) {
    const def = schema[key];
    if (!def) continue;

    // Use appropriate creator
    const elementCreator = def.creator || defaultCreator;

    // Process class names based on prefix option
    const elementOptions = def.options || {};
    const shouldApplyPrefix =
      "prefix" in elementOptions
        ? elementOptions.prefix
        : options.prefix !== false;

    const processedOptions = shouldApplyPrefix
      ? processClassNames(elementOptions)
      : { ...elementOptions };

    // Simple fix: Always set name property to key if not provided
    if (!def.name && key !== "element") {
      def.name = key;
    }

    // Create element
    const created = createComponentInstance(
      elementCreator,
      processedOptions,
      options
    );

    // Store in layout
    layout[key] = created;
    if (def.name && def.name !== key) layout[def.name] = created;

    // Handle DOM operations
    const element = isComponent(created) ? created.element : created;
    if (fragment) fragment.appendChild(element);

    // Process children
    if (def.children) {
      // Fix: Instead of comparing functions directly, use instanceof to check for SVG elements
      // or check a specific property in the creator function to identify its type
      const isSvgElement =
        typeof SVGElement !== "undefined" && element instanceof SVGElement;

      const childResult = processObjectSchema(def.children, element, options);
      childLayouts.push(childResult.layout);

      // Simple fix: For SVG elements, register all children at this level for easy access
      if (isSvgElement) {
        Object.assign(layout, childResult.layout);
      }
    }
  }

  // Append to parent
  if (parentElement && fragment) {
    const parentDom = isComponent(parentElement)
      ? parentElement.element
      : parentElement;
    parentDom.appendChild(fragment);
  }

  // Merge child layouts
  for (const childLayout of childLayouts) {
    Object.assign(layout, childLayout);
  }

  return createLayoutResult(layout);
}
