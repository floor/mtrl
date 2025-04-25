// src/core/collection/list-manager/types.ts
import { Collection } from '../collection';

/**
 * Configuration for list manager
 */
export interface ListManagerConfig {
  transform?: (item: any) => any;
  baseUrl?: string | null;
  renderItem: (item: any, index: number, recycledElement?: HTMLElement) => HTMLElement;
  afterLoad?: (result: LoadStatus) => void;
  staticItems?: any[] | null;
  renderBufferSize?: number;
  overscanCount?: number;
  itemHeight?: number;
  measureItemsInitially?: boolean;
  pageSize?: number;
  loadThreshold?: number;
  throttleMs?: number;
  dedupeItems?: boolean;
  scrollStrategy?: ScrollStrategy;
  items?: any[]; // For backward compatibility
  collection?: string;
}

/**
 * Scroll tracking strategies
 */
export type ScrollStrategy = 'scroll' | 'intersection' | 'hybrid';

/**
 * List manager interface
 */
export interface ListManager {
  loadItems: (params?: any) => Promise<{items: any[], meta: PaginationMeta}>;
  loadMore: () => Promise<{hasNext: boolean, items: any[]}>;
  refresh: () => Promise<void>;
  updateVisibleItems: (scrollTop?: number) => void;
  scrollToItem: (itemId: string, position?: ScrollToPosition) => void;
  setItemHeights: (heightsMap: Record<string, number>) => void;
  getCollection: () => Collection<any>;
  getVisibleItems: () => any[];
  getAllItems: () => any[];
  isLoading: () => boolean;
  hasNextPage: () => boolean;
  isApiMode: () => boolean;
  setRenderHook?: (hookFn: (item: any, element: HTMLElement) => void) => void;
  destroy: () => void;
}

/**
 * Position for scrolling to an item
 */
export type ScrollToPosition = 'start' | 'center' | 'end';

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  cursor: string | null;
  hasNext: boolean;
  total?: number;
}

/**
 * Load operation status
 */
export interface LoadStatus {
  loading: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  items: any[];
  allItems: any[];
}

/**
 * List interface
 */
export interface List {
  component: HTMLElement;
  items: any[];
  setItems: (items: any[]) => void;
}

/**
 * Page loader configuration
 */
export interface PageLoaderConfig {
  onLoad?: (status: LoadStatus) => void;
  pageSize?: number;
}

/**
 * Page loader interface
 */
export interface PageLoader {
  load: (cursor?: string | null, addToHistory?: boolean) => Promise<{hasNext: boolean, hasPrev: boolean}>;
  loadNext: () => Promise<{hasNext: boolean, hasPrev: boolean}>;
  loadPrev: () => Promise<{hasNext: boolean, hasPrev: boolean}>;
  loading: boolean;
  cursor: string | null;
}

/**
 * Item interface
 */
export interface ListItem {
  id: string;
  headline: string;
  supportingText: string;
  meta: string;
}

/**
 * Internal list manager state
 */
export interface ListManagerState {
  items: any[];
  visibleItems: any[];
  visibleRange: { start: number; end: number };
  totalHeight: number;
  totalHeightDirty: boolean;
  itemHeights: Map<string, number>;
  loading: boolean;
  cursor: string | null;
  hasNext: boolean;
  itemElements: Map<string, HTMLElement>;
  scrollTop: number;
  containerHeight: number;
  scrollRAF: number | null;
  mounted: boolean;
  itemCount: number;
  useStatic: boolean;
  renderHook: ((item: any, element: HTMLElement) => void) | null;
}

/**
 * DOM elements used by the list manager
 */
export interface ListManagerElements {
  container: HTMLElement;
  content: HTMLElement;
  spacer: HTMLElement;
  topSentinel?: HTMLElement | null;
  bottomSentinel?: HTMLElement | null;
}

/**
 * Visible range calculation result
 */
export interface VisibleRange {
  start: number;
  end: number;
}