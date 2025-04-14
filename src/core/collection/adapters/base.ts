// src/core/collection/adapters/base.ts

/**
 * Query operators for filtering data
 */
export const OPERATORS = {
  EQ: 'eq',
  NE: 'ne',
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',
  IN: 'in',
  NIN: 'nin',
  CONTAINS: 'contains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith'
} as const;

/**
 * Type for query operators
 */
export type Operator = keyof typeof OPERATORS;

/**
 * Configuration for base adapter
 */
export interface BaseAdapterConfig {
  /**
   * Error handler function
   */
  onError?: (error: Error, context?: any) => void;
}

/**
 * Base adapter interface
 */
export interface BaseAdapter {
  /**
   * Handles errors in adapter operations
   * @param error - The error that occurred
   * @param context - Optional context information about the error
   * @throws The original error after processing
   */
  handleError(error: Error, context?: any): never;
}

/**
 * Creates a base adapter with error handling
 * @param config - Adapter configuration
 * @returns Base adapter with error handling
 */
export const createBaseAdapter = (config: BaseAdapterConfig = {}): BaseAdapter => {
  const handleError = (error: Error, context?: any): never => {
    config.onError?.(error, context);
    throw error;
  };

  return {
    handleError
  };
};