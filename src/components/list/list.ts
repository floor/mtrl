// src/components/list/list.ts

import { pipe } from "../../core/compose/pipe";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { withListManager, withSelection } from "./features";
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

    // Create the component through functional composition
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withListManager(baseConfig), // Add list management capabilities
      withSelection(baseConfig), // Add selection capabilities
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
