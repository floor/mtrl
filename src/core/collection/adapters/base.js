// src/core/collection/adapters/base.js

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
}

export const createBaseAdapter = ({ onError } = {}) => {
  const handleError = (error, context) => {
    onError?.(error, context)
    throw error
  }

  return {
    handleError
  }
}
