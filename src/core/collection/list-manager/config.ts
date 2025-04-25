// src/core/collection/list-manager/config.ts
import { ListManagerConfig } from './types';

/**
 * Default configuration for list manager
 */
export const DEFAULT_CONFIG: Partial<ListManagerConfig> = {
  // Rendering options
  renderBufferSize: 5,   // Extra items to render above/below viewport
  overscanCount: 3,      // Extra items to keep in DOM but invisible
  itemHeight: 48,        // Default height for items in pixels
  measureItemsInitially: true, // Whether to measure initial items
  
  // Data loading options
  pageSize: 20,          // Number of items per page
  loadThreshold: 0.8,    // Load more when scrolled past this fraction
  
  // Performance options
  throttleMs: 16,        // Throttle scroll event (ms)
  dedupeItems: true,     // Remove duplicate items based on ID
  
  // Scroll detection strategy
  scrollStrategy: 'scroll' // 'scroll', 'intersection', or 'hybrid'
};

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
 * @returns Validated configuration object
 */
export function validateConfig(config: ListManagerConfig): ListManagerConfig {
  if (!config.renderItem || typeof config.renderItem !== 'function') {
    throw new Error('List manager requires a renderItem function');
  }
  
  const mergedConfig = mergeConfig(config);
  
  // Add collection name default if not provided
  if (!mergedConfig.collection) {
    mergedConfig.collection = 'items';
  }
  
  // Set up transform function default
  if (!mergedConfig.transform) {
    mergedConfig.transform = (item) => item;
  }
  
  return mergedConfig;
}

/**
 * Determines if the list manager should use API mode
 * @param config User configuration
 * @returns Whether to use API mode
 */
export function determineApiMode(config: ListManagerConfig): boolean {
  return config.baseUrl !== null;
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