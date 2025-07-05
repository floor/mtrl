import { createCollection } from "../collection";
import { createRouteAdapter } from "../adapters/route";
import { createDomElements } from "./dom/elements";
import { createItemMeasurement } from "./dom/measurement";
import { createRenderer } from "./render/items";
import { createRecyclingPool } from "./utils/recycling";
import { installPlaceholderHook } from "./data/generator";
import { createInitialState } from "./utils/state";
import { validateConfig, determineApiMode } from "./config";
import { COLLECTION } from "./constants";
import { ListManagerConfig } from "./types";

/**
 * Initialize core dependencies for the list manager
 * @param collection - Collection name
 * @param container - Container element
 * @param config - Configuration options
 * @returns Core dependencies object
 */
export const initialize = (
  collection: string,
  container: HTMLElement,
  config: ListManagerConfig
) => {
  // Add collection name to config
  config.collection = collection;

  // Validate and merge configuration
  const validatedConfig = validateConfig(config);

  if (!container || !(container instanceof HTMLElement)) {
    throw new Error("List manager requires a valid container element");
  }

  // List manager only handles API-based lists now
  const useApi = determineApiMode(validatedConfig);
  
  if (!useApi) {
    throw new Error("List manager requires a baseUrl for API-based lists. Use static list component for static data.");
  }

  // Create state object with initial values
  const state = {
    // Core state
    ...createInitialState(validatedConfig),
    items: [],
    mounted: false,

    // Virtual scrolling support
    virtualOffset: 0, // Offset for virtual positioning when jumping to pages

    // Measurement and layout
    containerHeight: container.clientHeight,
    totalHeightDirty: true,
  };

  // Create DOM elements
  const elements = createDomElements(container);

  // Initialize tools and utilities
  const itemMeasurement = createItemMeasurement(validatedConfig.itemHeight);
  const recyclePool = createRecyclingPool();
  const renderer = createRenderer(
    validatedConfig,
    elements,
    itemMeasurement,
    recyclePool
  );

  // Install placeholder render hook for automatic styling
  installPlaceholderHook(renderer.setRenderHook);

  // Initialize collection for data management
  const itemsCollection = createCollection({
    initialCapacity: COLLECTION.DEFAULT_INITIAL_CAPACITY,
  });

  // Initialize route adapter for API communication
  const adapter = createRouteAdapter({
    base: validatedConfig.baseUrl!,
    endpoints: {
      list: `/${collection}`,
    },
    headers: {
      "Content-Type": "application/json",
    },
    cache: true,
    pagination: validatedConfig.pagination
      ? {
          strategy: validatedConfig.pagination.strategy || "cursor",
          ...validatedConfig.pagination,
        }
      : { strategy: "cursor" },
  });

  // Track cleanup functions
  const cleanupFunctions: (() => void)[] = [];

  return {
    validatedConfig,
    state,
    elements,
    itemMeasurement,
    recyclePool,
    renderer,
    itemsCollection,
    adapter,
    cleanupFunctions,
    useApi,
    container,
    collection,
  };
};
