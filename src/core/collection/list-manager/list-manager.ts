// src/core/collection/list-manager/index.ts
import { createCollection, COLLECTION_EVENTS } from "../collection";
import { createRouteAdapter } from "../adapters/route";
import {
  ListManagerConfig,
  ListManager,
  PaginationMeta,
  LoadStatus,
  ScrollToPosition,
  PAGE_EVENTS,
  PageEvent,
  PageChangeEventData,
  VisibleRange,
  LoadParams,
} from "./types";
import { createPageEventManager } from "./events";
import { createPaginationManager } from "./managers/pagination";
import { createRenderingManager } from "./render/virtual";
import {
  createDataLoadingManager,
  type DataLoadingDependencies,
} from "./data/loading";
import {
  createViewportManager,
  type ViewportDependencies,
} from "./managers/viewport";
import {
  createLifecycleManager,
  type LifecycleDependencies,
} from "./managers/lifecycle";
import { validateConfig, determineApiMode, getStaticItems } from "./config";
import {
  createDomElements,
  updateSpacerHeight,
  cleanupDomElements,
} from "./dom/elements";
import { createItemMeasurement } from "./dom/measurement";
import { createRenderer } from "./render/items";
import { createScrollTracker } from "./scroll/tracker";
import { createRecyclingPool } from "./utils/recycling";
import {
  calculateVisibleRange,
  isLoadThresholdReached,
} from "./utils/viewport";
import {
  createInitialState,
  updateStateAfterLoad,
  updateVisibleItems as updateStateVisibleItems,
  updateTotalHeight,
  updateLoadingState,
  resetState,
  createLoadParams,
} from "./utils/state";
import {
  RENDERING,
  PAGINATION,
  BOUNDARIES,
  COLLECTION,
  TIMING,
  DEFAULTS,
  PLACEHOLDER,
} from "./constants";
import {
  installPlaceholderHook,
  placeholderRenderHook,
} from "./data/generator";

// Import new manager modules
import { createTimeoutManager } from "./managers/timeout";
import { createBoundaryManager } from "./managers/boundary";
import { createScrollingManager } from "./scroll/manager";
import { initialize } from "./initialize";
import { createPublicAPI } from "./api";

/**
 * Pagination helper functions
 * @private
 */

// createLoadPageFunction moved to pagination manager

/**
 * Creates a list manager for a specific collection
 * @param {string} collection - Collection name
 * @param {HTMLElement} container - Container element
 * @param {ListManagerConfig} config - Configuration options
 * @returns {ListManager} List manager methods
 */
export const createListManager = (
  collection: string,
  container: HTMLElement,
  config: ListManagerConfig
): ListManager => {
  // Phase 1: Initialize core dependencies
  const core = initialize(collection, container, config);
  const {
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
    useStatic,
    initialItems,
  } = core;

  // Create timeout manager to centralize timeout and state flag management
  const timeoutManager = createTimeoutManager();

  // Initialize page event manager
  const pageEventManager = createPageEventManager(validatedConfig);
  const {
    onPageChange,
    emitPageChange,
    calculateCurrentPage,
    checkPageChange,
  } = pageEventManager;

  // Initialize rendering manager
  const renderingManager = createRenderingManager({
    config: validatedConfig,
    elements,
  });

  // Initialize data loading manager
  let dataLoadingManager = createDataLoadingManager({
    state,
    config: validatedConfig,
    elements,
    collection,
    adapter,
    itemsCollection,
    getPaginationFlags: () => timeoutManager.getState(),
    setPaginationFlags: (flags) => timeoutManager.updateState(flags),
  });

  // Create pagination manager with enhanced functions
  const paginationManager = createPaginationManager({
    state,
    config: validatedConfig,
    elements,
    container,
    itemsCollection,
    adapter,
    itemMeasurement,
    renderer,
    loadItems: dataLoadingManager.loadItems,
    updateVisibleItems: (scrollTop?: number, isPageJump?: boolean) => {
      functionContainer.updateVisibleItems?.(scrollTop, isPageJump);
    },
  });

  // Create core function containers that will be injected with implementations
  const functionContainer = {
    updateVisibleItems: null as
      | ((scrollTop?: number, isPageJump?: boolean) => void)
      | null,
    checkLoadMore: null as ((scrollTop: number) => void) | null,
  };

  /**
   * Load items with cursor pagination or from static data
   */
  let loadItems = dataLoadingManager.loadItems;

  /**
   * Pre-bound update visible items function to avoid recreation
   */
  const updateVisibleItems = (
    scrollTop = state.scrollTop,
    isPageJump = false
  ): void => {
    // Debug: Only log page jumps
    if (isPageJump) {
      console.log("[LIST-MANAGER] updateVisibleItems called (page jump)");
    }
    functionContainer.updateVisibleItems?.(scrollTop, isPageJump);
  };

  /**
   * Check if we need to load more data based on scroll position
   */
  const checkLoadMore = (scrollTop: number): void => {
    // checkLoadMore called
    functionContainer.checkLoadMore?.(scrollTop);
  };

  // loadNext moved to pagination manager as loadNextPage

  /**
   * Refresh the list with the latest data
   */
  const refresh = dataLoadingManager.refresh;

  /**
   * Loads a specific page (only works with page-based pagination)
   */
  const loadPage = paginationManager.loadPage;

  // loadPreviousPage moved to pagination manager

  // Create centralized scrolling manager for all scroll operations
  const scrollingManager = createScrollingManager({
    state,
    config: validatedConfig,
    container,
    loadPage,
    loadItems,
    updateVisibleItems,
    timeoutManager: {
      setScrollJumpState: timeoutManager.setScrollJumpState,
      getState: timeoutManager.getState,
      updateState: timeoutManager.updateState,
    },
    itemMeasurement,
    collection,
  });

  // Extract functions from centralized scrolling manager
  const { scrollToItem, scrollToIndex, scrollToItemById } = scrollingManager;

  // Create boundary manager first
  const boundaryManager = createBoundaryManager({
    state,
    config: validatedConfig,
    loadItems,
    timeoutManager,
    scrollJumpManager: {
      loadScrollToIndexWithBackgroundRanges:
        scrollingManager.loadScrollToIndexWithBackgroundRanges,
    },
  });

  // Create viewport manager ONCE with all dependencies
  const viewportManager = createViewportManager({
    state,
    config: validatedConfig,
    elements,
    container,
    itemMeasurement,
    renderer,
    checkPageChange,
    paginationManager: {
      scheduleScrollStopPageLoad: scrollingManager.scheduleScrollStopPageLoad,
      checkPageBoundaries: boundaryManager.checkPageBoundaries,
      loadNext: paginationManager.loadNextPage,
      getPaginationFlags: () => timeoutManager.getState(),
    },
    renderingManager: {
      renderItemsWithVirtualPositions:
        renderingManager.renderItemsWithVirtualPositions,
    },
  });

  // Inject implementations into function container
  functionContainer.updateVisibleItems = viewportManager.updateVisibleItems;
  functionContainer.checkLoadMore = viewportManager.checkLoadMore;

  // Get placeholder replacement function for seamless transitions
  const replacePlaceholdersWithReal =
    viewportManager.replacePlaceholdersWithReal;

  // Update data loading manager with replacement support
  dataLoadingManager = createDataLoadingManager({
    state,
    config: validatedConfig,
    elements,
    collection,
    adapter,
    itemsCollection,
    getPaginationFlags: () => timeoutManager.getState(),
    setPaginationFlags: (flags) => timeoutManager.updateState(flags),
    replacePlaceholdersWithReal,
  });

  // Update loadItems reference
  loadItems = dataLoadingManager.loadItems;

  // Create lifecycle manager
  const lifecycleManager = createLifecycleManager({
    state,
    config: validatedConfig,
    elements,
    container,
    updateVisibleItems,
    checkLoadMore,
    loadNext: paginationManager.loadNextPage,
    loadPage,
    itemsCollection,
    initialItems,
    cleanupFunctions,
    createScrollTracker: createScrollTracker,
    COLLECTION_EVENTS,
    getPaginationFlags: () => timeoutManager.getState(),
    getTimeoutFlags: () => timeoutManager.getTimeouts(),
    clearTimeouts: () => timeoutManager.clearAllTimeouts(),
    scrollJumpManager: {
      loadScrollToIndexWithBackgroundRanges:
        scrollingManager.loadScrollToIndexWithBackgroundRanges,
    },
  });

  // Initialize immediately
  const actualCleanup = lifecycleManager.initialize();

  // Attach list manager to container for scroll interrupt detection
  const listManagerInstance = {
    timeoutManager,
    state,
    config: validatedConfig,
  };
  (container as any).__listManager = listManagerInstance;

  // Add timeout manager cleanup to the main cleanup
  cleanupFunctions.push(() => timeoutManager.cleanup());
  cleanupFunctions.push(() => {
    // Clean up the container reference on destroy
    delete (container as any).__listManager;
  });

  // Return public API
  return createPublicAPI({
    loadItems,
    loadPage,
    refresh,
    updateVisibleItems,
    scrollToItem,
    scrollToIndex,
    scrollToItemById,
    paginationManager,
    pageEventManager,
    state,
    validatedConfig,
    itemsCollection,
    cleanupFunctions,
    actualCleanup,
  });
};

// createCursorPageLoader moved to data/cursor-loader.ts
// transforms moved to data/transforms.ts

// Re-export types
export * from "./types";
