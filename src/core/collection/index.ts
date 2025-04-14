// src/core/collection/index.ts

// Export collection class and types
export { 
  Collection, 
  COLLECTION_EVENTS, 
  OPERATORS as COLLECTION_OPERATORS 
} from './collection';

export type { 
  CollectionItem, 
  CollectionConfig, 
  CollectionEvent, 
  CollectionObserver 
} from './collection';

// Export list manager
export { 
  createListManager, 
  transforms 
} from './list-manager';

export type { 
  ListManager,
  ListManagerConfig,
  ListItem,
  List,
  PageLoader,
  PageLoaderConfig,
  LoadStatus,
  PaginationMeta
} from './list-manager';

// Export adapters
export { 
  createBaseAdapter, 
  OPERATORS 
} from './adapters/base';

export type { 
  BaseAdapter, 
  BaseAdapterConfig,
  Operator
} from './adapters/base';

export { 
  createRouteAdapter 
} from './adapters/route';

export type { 
  RouteAdapter,
  RouteAdapterConfig,
  RouteEndpoints,
  QueryDefinition,
  QueryCondition,
  RequestOptions
} from './adapters/route';