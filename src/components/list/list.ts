// src/components/list/list.ts

import { pipe } from "../../core/compose/pipe";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { withListManager, withSelection, withStaticItems } from "./features";
import { withAPI } from "./api";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Creates a new List component
 *
 * The List component provides a high-performance way to render large datasets
 * with built-in virtualization, pagination, and efficient DOM management.
 *
 * @param {Object} config - Configuration options for the list
 * @returns {Object} List component instance
 */
const createList = (config = {}) => {
  try {
    // Process the configuration with defaults
    const baseConfig = createBaseConfig(config);

    // Determine if this is a static list or needs the complex list manager
    const hasStaticItems = Array.isArray(baseConfig.items) && baseConfig.items.length > 0;
    const hasApiConfig = Boolean(baseConfig.baseUrl);
    const isStaticList = hasStaticItems && !hasApiConfig;

    console.log(`📋 Creating ${isStaticList ? 'static' : 'dynamic'} list with ${hasStaticItems ? baseConfig.items.length : 0} items`);

    // Create the component through functional composition
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      // Choose the appropriate list implementation
      isStaticList 
        ? withStaticItems(baseConfig)  // Simple static list for static data
        : withListManager(baseConfig), // Complex list manager for API data
      withSelection(baseConfig), // Add selection capabilities (works with both)
      withLifecycle(),
      (comp) => withAPI(getApiConfig(comp, baseConfig))(comp) // Apply public API
    )(baseConfig);

    return component;
  } catch (error) {
    console.error("List creation error:", error);
    throw new Error(`Failed to create list: ${error.message}`);
  }
};

export default createList;
