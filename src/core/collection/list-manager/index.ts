/**
 * List Manager - Public API
 *
 * A comprehensive list management system for handling large datasets with:
 * - Virtual scrolling and viewport management
 * - Multiple pagination strategies (cursor, page, offset)
 * - Placeholder data for seamless infinite scrolling
 * - Efficient scroll jump operations
 * - Background preloading and boundary detection
 * - Automatic cleanup and lifecycle management
 */

// Main list manager implementation
export { createListManager } from "./list-manager";

// Utility functions
export { createPageLoader } from "./list-manager";

// Transform functions for common data types
export { transforms } from "./list-manager";

// Re-export all types for external use
export * from "./types";
