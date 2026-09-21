// src/components/list/list.ts

import { pipe } from "../../core/compose/pipe";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { withRenderer, withSelection } from "./features";
import { withAPI } from "./api";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";
import type { ListComponent, ListConfig, ListItem } from "./types";

/**
 * Creates a new List component
 *
 * The List component provides a simple way to render static arrays of data
 * with built-in selection capabilities. For virtual scrolling and complex
 * data management, use the VirtualList component from mtrl-addons.
 *
 * @param config - Configuration options for the list
 * @returns List component instance
 */
const createList = (
  config: Partial<ListConfig<ListItem>> = {},
): ListComponent<ListItem> => {
  try {
    // Process the configuration with defaults
    const baseConfig = createBaseConfig(config);

    // Create the component through functional composition
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withRenderer(baseConfig),        // Item rendering
      withSelection(baseConfig),       // Selection capabilities
      withLifecycle(),
      (comp) => withAPI(getApiConfig(comp, baseConfig))(comp) // Apply public API
    )(baseConfig);

    return component;
  } catch (error) {
    console.error("List creation error:", error);
    throw new Error(`Failed to create list: ${(error as Error).message}`);
  }
};

export default createList;