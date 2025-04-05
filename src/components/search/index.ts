// src/components/search/index.ts

// Export main component creator with both naming conventions
export { default, default as fSearch, default as createSearch } from './search';

// Export types for TypeScript users
export type { SearchConfig, SearchComponent, SearchEvent } from './types';