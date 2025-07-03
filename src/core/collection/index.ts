// src/core/collection/index.ts

// Export collection factory and types
export { createCollection } from "./collection";
export { COLLECTION_EVENTS } from "./collection";
export { OPERATORS as COLLECTION_OPERATORS } from "./collection";

export type {
  CollectionItem,
  CollectionConfig,
  CollectionEvent,
  CollectionObserver,
  Collection,
} from "./collection";

// Export list manager
export { createListManager } from "./list-manager";

export type {
  ListManager,
  ListManagerConfig,
  ListItem,
  List,
  PageLoader,
  PageLoaderConfig,
  LoadStatus,
  PaginationMeta,
} from "./list-manager";

// Export adapters
export { createBaseAdapter, OPERATORS } from "./adapters/base";

export type { BaseAdapter, BaseAdapterConfig, Operator } from "./adapters/base";

export { createRouteAdapter } from "./adapters/route";

export type { RouteAdapterConfig, ParsedResponse } from "./adapters/route";
