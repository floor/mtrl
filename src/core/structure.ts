// src/core/structure.ts

/**
 * Creates a DOM structure based on a structure definition
 * @param definition Structure definition object
 * @param parentElement Optional parent element to attach structure to
 * @returns Object containing all created elements
 */
export function createStructure(definition, parentElement = null) {
  const structure = {};
  
  // Handle case for root component creation
  if (definition.element && !parentElement) {
    // Extract the element definition
    const elementDef = definition.element;
    
    // Create the root element
    const rootElement = elementDef.creator(elementDef.options);
    structure.element = rootElement;
    
    // Add element to structure with its name
    if (elementDef.name) {
      structure[elementDef.name] = rootElement;
    }
    
    // Process children of the root element
    if (elementDef.children) {
      Object.entries(elementDef.children).forEach(([key, childDef]) => {
        // Create child structure and attach to root element
        const childStructure = createStructure({ [key]: childDef }, rootElement);
        // Merge child components into the structure
        Object.assign(structure, childStructure);
      });
    }
    
    return structure;
  }
  
  // Normal case for non-root structures
  for (const [key, def] of Object.entries(definition)) {
    // Skip if no definition
    if (!def) continue;
    
    // Create the element
    const element = def.creator(def.options);
    
    // Attach to parent if provided
    if (parentElement) {
      parentElement.appendChild(element);
    }
    
    // Add element to structure with its key
    structure[key] = element;
    
    // Add element to structure with its name if different from key
    if (def.name && def.name !== key) {
      structure[def.name] = element;
    }
    
    // Process children recursively
    if (def.children) {
      const childStructure = createStructure(def.children, element);
      Object.assign(structure, childStructure);
    }
  }
  
  return structure;
}

/**
 * Flattens a nested structure into a simple object with element references
 * @param structure Structure object
 * @returns Flattened structure with all elements
 */
export function flattenStructure(structure) {
  const flattened = {};
  
  // Process each key in the structure
  for (const [key, value] of Object.entries(structure)) {
    // Skip functions and objects that aren't DOM elements
    if (typeof value === 'function' || 
        (typeof value === 'object' && 
         !(value instanceof Element || value instanceof HTMLElement))) {
      continue;
    }
    
    // Add to flattened structure
    flattened[key] = value;
  }
  
  return flattened;
}