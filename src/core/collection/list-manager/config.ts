// src/core/collection/list-manager/config.ts
import { ListManagerConfig } from "./types";

/**
 * Default configuration for list manager
 */
export const DEFAULT_CONFIG: Partial<ListManagerConfig> = {
  // Rendering options
  renderBufferSize: 5, // Extra items to render above/below viewport
  overscanCount: 3, // Extra items to keep in DOM but invisible
  itemHeight: 48, // Default height for items in pixels
  measureItemsInitially: true, // Whether to measure initial items

  // Data loading options
  pageSize: 20, // Number of items per page
  loadThreshold: 0.8, // Load more when scrolled past this fraction

  // Performance options
  throttleMs: 16, // Throttle scroll event (ms)
  dedupeItems: true, // Remove duplicate items based on ID



  // Scroll detection strategy
  scrollStrategy: "scroll", // 'scroll', 'intersection', or 'hybrid'
};

/**
 * Configuration validation errors
 */
export class ConfigValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ConfigValidationError";
  }
}

/**
 * Validates a numeric value within specified bounds
 */
function validateNumber(
  value: any,
  fieldName: string,
  min?: number,
  max?: number,
  allowZero = false
): number {
  if (value === null || value === undefined) {
    throw new ConfigValidationError(`${fieldName} is required`, fieldName);
  }

  const num = Number(value);

  if (isNaN(num) || !isFinite(num)) {
    throw new ConfigValidationError(
      `${fieldName} must be a valid number, got: ${value}`,
      fieldName
    );
  }

  if (!allowZero && num <= 0) {
    throw new ConfigValidationError(
      `${fieldName} must be greater than 0, got: ${num}`,
      fieldName
    );
  }

  if (min !== undefined && num < min) {
    throw new ConfigValidationError(
      `${fieldName} must be at least ${min}, got: ${num}`,
      fieldName
    );
  }

  if (max !== undefined && num > max) {
    throw new ConfigValidationError(
      `${fieldName} must be at most ${max}, got: ${num}`,
      fieldName
    );
  }

  return num;
}

/**
 * Validates and normalizes pagination strategy
 */
function validatePaginationStrategy(
  strategy: any
): "page" | "cursor" | "offset" {
  if (!strategy) return "page"; // Default

  const validStrategies = ["page", "cursor", "offset"];

  if (!validStrategies.includes(strategy)) {
    throw new ConfigValidationError(
      `pagination.strategy must be one of: ${validStrategies.join(
        ", "
      )}, got: ${strategy}`,
      "pagination.strategy"
    );
  }

  return strategy;
}

/**
 * Validates and normalizes scroll strategy
 */
function validateScrollStrategy(
  strategy: any
): "scroll" | "intersection" | "hybrid" {
  if (!strategy) return "scroll"; // Default

  const validStrategies = ["scroll", "intersection", "hybrid"];

  if (!validStrategies.includes(strategy)) {
    throw new ConfigValidationError(
      `scrollStrategy must be one of: ${validStrategies.join(
        ", "
      )}, got: ${strategy}`,
      "scrollStrategy"
    );
  }

  return strategy;
}

/**
 * Validates render item function
 */
function validateRenderItem(
  renderItem: any
): (item: any, index: number, recycledElement?: HTMLElement) => HTMLElement {
  if (!renderItem || typeof renderItem !== "function") {
    throw new ConfigValidationError(
      "renderItem must be a function that creates DOM elements for list items",
      "renderItem"
    );
  }

  // Test if function accepts expected parameters
  if (renderItem.length < 1) {
    throw new ConfigValidationError(
      "renderItem function must accept at least one parameter (item data)",
      "renderItem"
    );
  }

  return renderItem;
}

/**
 * Validates transform function
 */
function validateTransform(transform: any): (item: any) => any {
  if (!transform) {
    return (item: any) => item; // Default passthrough
  }

  if (typeof transform !== "function") {
    throw new ConfigValidationError(
      "transform must be a function that processes item data",
      "transform"
    );
  }

  return transform;
}

/**
 * Validates collection name
 */
function validateCollection(collection: any): string {
  if (!collection) {
    return "items"; // Default
  }

  if (typeof collection !== "string" || collection.trim().length === 0) {
    throw new ConfigValidationError(
      "collection must be a non-empty string",
      "collection"
    );
  }

  return collection.trim();
}

/**
 * Validates base URL for API mode
 * Automatically converts relative URLs to absolute URLs using current origin
 */
function validateBaseUrl(baseUrl: any): string | undefined {
  if (!baseUrl) return undefined;

  if (typeof baseUrl !== "string") {
    throw new ConfigValidationError("baseUrl must be a string", "baseUrl");
  }

  let fullUrl = baseUrl;

  // If it's a relative URL (starts with /), convert to absolute URL
  if (baseUrl.startsWith("/")) {
    // Check if we're in a browser environment
    if (typeof window !== "undefined" && window.location) {
      fullUrl = `${window.location.origin}${baseUrl}`;
    } else {
      // Fallback for server-side or test environments
      fullUrl = `http://localhost:4000${baseUrl}`;
    }
  }

  try {
    new URL(fullUrl);
  } catch {
    throw new ConfigValidationError(
      `baseUrl must be a valid URL or relative path, got: ${baseUrl}`,
      "baseUrl"
    );
  }

  return fullUrl;
}

/**
 * Merges user configuration with default configuration
 * @param config User configuration
 * @returns Merged configuration
 */
export function mergeConfig(config: ListManagerConfig): ListManagerConfig {
  return { ...DEFAULT_CONFIG, ...config };
}

/**
 * Validates configuration and sets up defaults
 * @param config User configuration
 * @returns Validated and normalized configuration object
 */
export function validateConfig(config: ListManagerConfig): ListManagerConfig {
  try {
    // Start with merged config
    const mergedConfig = mergeConfig(config);

    // Validate required function
    mergedConfig.renderItem = validateRenderItem(mergedConfig.renderItem);

    // Validate optional functions
    mergedConfig.transform = validateTransform(mergedConfig.transform);

    // Validate strings
    mergedConfig.collection = validateCollection(mergedConfig.collection);
    mergedConfig.baseUrl = validateBaseUrl(mergedConfig.baseUrl);

    // Validate numeric values
    mergedConfig.itemHeight = validateNumber(
      mergedConfig.itemHeight,
      "itemHeight",
      1,
      10000
    );
    mergedConfig.pageSize = validateNumber(
      mergedConfig.pageSize,
      "pageSize",
      1,
      1000
    );
    mergedConfig.renderBufferSize = validateNumber(
      mergedConfig.renderBufferSize,
      "renderBufferSize",
      0,
      100,
      true
    );
    mergedConfig.overscanCount = validateNumber(
      mergedConfig.overscanCount,
      "overscanCount",
      0,
      50,
      true
    );
    mergedConfig.throttleMs = validateNumber(
      mergedConfig.throttleMs,
      "throttleMs",
      1,
      1000
    );

    // Validate load threshold (percentage)
    if (mergedConfig.loadThreshold !== undefined) {
      mergedConfig.loadThreshold = validateNumber(
        mergedConfig.loadThreshold,
        "loadThreshold",
        0,
        1,
        true
      );
    }

    // Validate strategies
    mergedConfig.scrollStrategy = validateScrollStrategy(
      mergedConfig.scrollStrategy
    );

    // Validate pagination config
    if (mergedConfig.pagination) {
      mergedConfig.pagination.strategy = validatePaginationStrategy(
        mergedConfig.pagination.strategy
      );
    }

    // Validate boolean values with defaults
    if (mergedConfig.dedupeItems === undefined) {
      mergedConfig.dedupeItems = true;
    }

    if (mergedConfig.measureItemsInitially === undefined) {
      mergedConfig.measureItemsInitially = true;
    }

    return mergedConfig;
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new ConfigValidationError(
      `Configuration validation failed: ${error.message}`,
      "unknown"
    );
  }
}

/**
 * Determines if the list manager should use API mode
 * @param config User configuration
 * @returns Whether to use API mode
 */
export function determineApiMode(config: ListManagerConfig): boolean {
  return Boolean(config.baseUrl);
}

/**
 * Gets all static items from config
 * @param config User configuration
 * @returns Static items array or empty array
 */
export function getStaticItems(config: ListManagerConfig): any[] {
  // Support both staticItems (preferred) and items (legacy) properties
  return config.staticItems || config.items || [];
}

/**
 * Gets the appropriate limit size based on pagination strategy
 * @param config Validated configuration
 * @returns Strategy-specific limit size
 */
export function getStrategyLimit(config: ListManagerConfig): number {
  const strategy = config.pagination?.strategy || "page";

  switch (strategy) {
    case "page":
    case "cursor":
      // For page/cursor strategies, use pagination.limitSize or fallback to legacy pageSize
      return config.pagination?.limitSize || config.pageSize || 20;

    case "offset":
      // For offset strategy, return a special marker to indicate viewport-based calculation
      // The actual calculation happens in viewport logic using OFFSET.VIEWPORT_MULTIPLIER
      return -1; // Special value indicating "use viewport calculation"

    default:
      return config.pageSize || 20;
  }
}

/**
 * Checks if the given strategy should use viewport-based sizing
 * @param config Validated configuration
 * @returns Whether to use viewport multiplier instead of fixed size
 */
export function useViewportBasedSizing(config: ListManagerConfig): boolean {
  const strategy = config.pagination?.strategy || "page";
  return strategy === "offset";
}

/**
 * Validates configuration without throwing errors
 * @param config User configuration
 * @returns Validation result with success flag and errors
 */
export function validateConfigSafe(config: ListManagerConfig): {
  success: boolean;
  config?: ListManagerConfig;
  errors: { field?: string; message: string }[];
} {
  try {
    const validatedConfig = validateConfig(config);
    return {
      success: true,
      config: validatedConfig,
      errors: [],
    };
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return {
        success: false,
        errors: [{ field: error.field, message: error.message }],
      };
    }

    return {
      success: false,
      errors: [{ message: error.message || "Unknown validation error" }],
    };
  }
}
