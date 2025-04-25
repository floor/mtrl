// src/core/collection/list-manager/utils/visibility.ts
import { ItemMeasurement } from '../item-measurement';
import { VisibleRange, ListManagerConfig } from '../types';

/**
 * Optimized visible range calculation for fixed height items
 * Used as a fast path when all items have the same height
 * 
 * @param scrollTop Current scroll position
 * @param itemHeight Fixed item height
 * @param containerHeight Container height
 * @param totalItems Total number of items
 * @param config List manager configuration
 * @returns Visible range with start and end indices
 */
export function calculateVisibleRangeOptimized(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  config: ListManagerConfig
): VisibleRange {
  const { renderBufferSize = 5, overscanCount = 3 } = config;
  
  // Calculate visible range with simple math
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = startIndex + visibleCount;
  
  // Add buffer and overscan
  const adjustedStart = Math.max(0, startIndex - renderBufferSize - overscanCount);
  const adjustedEnd = Math.min(totalItems, endIndex + renderBufferSize + overscanCount);
  
  return { start: adjustedStart, end: adjustedEnd };
}

/**
 * Implements binary search to quickly find the start index for large lists
 * @param scrollTop Current scroll position
 * @param items Array of items
 * @param containerHeight Container height
 * @param itemMeasurement Item measurement instance
 * @param renderBufferSize Size of render buffer
 * @param overscanCount Number of extra items to render
 * @param itemHeight Default item height
 * @returns Visible range with start and end indices
 */
function binarySearchVisibleRange(
  scrollTop: number,
  items: any[],
  containerHeight: number,
  itemMeasurement: ItemMeasurement,
  renderBufferSize: number,
  overscanCount: number,
  itemHeight: number
): VisibleRange {
  // Binary search to find approximate start position
  let low = 0;
  let high = items.length - 1;
  let bestStartIndex = 0;
  
  // Check if itemMeasurement has cached offsets
  if (typeof itemMeasurement.hasCachedOffsets === 'function' && 
      itemMeasurement.hasCachedOffsets()) {
    // Use cached offsets for more efficient lookup
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (!items[mid]) {
        low = mid + 1;
        continue;
      }
      
      const offset = itemMeasurement.getItemOffset(items, items[mid].id);
      
      if (offset < scrollTop) {
        bestStartIndex = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
  } else {
    // Fall back to estimation using average height
    const avgHeight = itemMeasurement.getAllHeights().size > 0 
      ? [...itemMeasurement.getAllHeights().values()].reduce((a, b) => a + b, 0) / 
        itemMeasurement.getAllHeights().size
      : itemHeight;
      
    // Estimate start index based on average height
    bestStartIndex = Math.floor(scrollTop / avgHeight);
    
    // Refine estimate with linear search in both directions
    let currentOffset = bestStartIndex * avgHeight;
    
    // Search forward if we're underestimating
    while (bestStartIndex < items.length && currentOffset < scrollTop) {
      if (items[bestStartIndex]) {
        currentOffset += itemMeasurement.getItemHeight(items[bestStartIndex]);
      }
      bestStartIndex++;
    }
    
    // Search backward if we're overestimating
    while (bestStartIndex > 0 && currentOffset > scrollTop) {
      bestStartIndex--;
      if (items[bestStartIndex]) {
        currentOffset -= itemMeasurement.getItemHeight(items[bestStartIndex]);
      }
    }
  }
  
  // Ensure bestStartIndex is valid
  bestStartIndex = Math.max(0, Math.min(bestStartIndex, items.length - 1));
  
  // Add buffer and overscan
  const startIndex = Math.max(0, bestStartIndex - renderBufferSize - overscanCount);
  
  // Calculate currentOffset at startIndex
  let currentOffset = 0;
  for (let i = 0; i < startIndex; i++) {
    if (items[i]) {
      currentOffset += itemMeasurement.getItemHeight(items[i]);
    }
  }
  
  // Find end index
  let endIndex = startIndex;
  const endThreshold = scrollTop + containerHeight + (renderBufferSize * itemHeight);
  
  while (endIndex < items.length && currentOffset < endThreshold) {
    if (items[endIndex]) {
      currentOffset += itemMeasurement.getItemHeight(items[endIndex]);
    }
    endIndex++;
  }
  
  // Add overscan to end index
  endIndex = Math.min(items.length, endIndex + overscanCount);
  
  return { start: startIndex, end: endIndex };
}

/**
 * Determines which items are visible within the viewport
 * @param scrollTop Current scroll position
 * @param items Array of items
 * @param containerHeight Container height
 * @param itemMeasurement Item measurement instance
 * @param config List manager configuration
 * @returns Visible range with start and end indices
 */
export function calculateVisibleRange(
  scrollTop: number,
  items: any[],
  containerHeight: number,
  itemMeasurement: ItemMeasurement,
  config: ListManagerConfig
): VisibleRange {
  const { renderBufferSize = 5, overscanCount = 3, itemHeight = 48 } = config;
  
  // Fast path for empty or very small lists
  if (items.length === 0) {
    return { start: 0, end: 0 };
  }
  
  if (items.length < 10) {
    return { start: 0, end: items.length };
  }
  
  // Fast path for fixed height items
  const allHeights = itemMeasurement.getAllHeights();
  const uniqueHeights = new Set(allHeights.values());
  if (uniqueHeights.size <= 1 && items.length > 20) {
    return calculateVisibleRangeOptimized(
      scrollTop,
      itemHeight,
      containerHeight,
      items.length,
      config
    );
  }
  
  // For large variable height lists, use binary search approach
  if (items.length > 100) {
    return binarySearchVisibleRange(
      scrollTop,
      items,
      containerHeight,
      itemMeasurement,
      renderBufferSize,
      overscanCount,
      itemHeight
    );
  }
  
  // Original implementation for moderate-sized lists
  let currentOffset = 0;
  let startIndex = 0;
  let endIndex = 0;
  
  // Find the first visible item
  for (let i = 0; i < items.length; i++) {
    // Skip undefined items
    if (!items[i]) {
      continue;
    }
    
    const itemHeight = itemMeasurement.getItemHeight(items[i]);
    
    if (currentOffset + itemHeight > scrollTop - (renderBufferSize * config.itemHeight)) {
      startIndex = Math.max(0, i - overscanCount);
      break;
    }
    
    currentOffset += itemHeight;
  }
  
  // Find the last visible item
  currentOffset = 0;
  for (let i = 0; i < items.length; i++) {
    if (!items[i]) continue;
    
    const itemHeight = itemMeasurement.getItemHeight(items[i]);
    currentOffset += itemHeight;
    
    if (currentOffset > scrollTop + containerHeight + (renderBufferSize * config.itemHeight)) {
      endIndex = Math.min(items.length, i + overscanCount);
      break;
    }
  }
  
  // If we reached the end of the list
  if (endIndex === 0) {
    endIndex = items.length;
  }
  
  return { start: startIndex, end: endIndex };
}

/**
 * Calculate the position for each visible item
 * @param items All items
 * @param visibleRange Visible range with start and end indices
 * @param itemMeasurement Item measurement instance
 * @returns Array of positions with index, item, and offset
 */
export function calculateItemPositions(
  items: any[],
  visibleRange: VisibleRange,
  itemMeasurement: ItemMeasurement
): Array<{ index: number; item: any; offset: number }> {
  // Check if we can use cached offsets
  if (typeof itemMeasurement.hasCachedOffsets === 'function' && 
      itemMeasurement.hasCachedOffsets() &&
      typeof itemMeasurement.getOffsetAtIndex === 'function') {
    
    const positions: Array<{ index: number; item: any; offset: number }> = [];
    
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      if (items[i]) {
        positions.push({
          index: i,
          item: items[i],
          offset: itemMeasurement.getOffsetAtIndex(i)
        });
      }
    }
    
    return positions;
  }
  
  // Fall back to calculating offsets on the fly
  let currentOffset = 0;
  
  // Calculate offsets for items before visible range
  for (let i = 0; i < visibleRange.start; i++) {
    if (items[i]) {
      currentOffset += itemMeasurement.getItemHeight(items[i]);
    }
  }
  
  // Calculate positions for visible items
  const positions: Array<{ index: number; item: any; offset: number }> = [];
  
  for (let i = visibleRange.start; i < visibleRange.end; i++) {
    if (items[i]) {
      positions.push({
        index: i,
        item: items[i],
        offset: currentOffset
      });
      
      currentOffset += itemMeasurement.getItemHeight(items[i]);
    }
  }
  
  return positions;
}

/**
 * Checks if load threshold has been reached
 * @param scrollTop Current scroll top position
 * @param containerHeight Container height
 * @param totalHeight Total content height
 * @param loadThreshold Load threshold as fraction (0-1)
 * @returns Whether load threshold has been reached
 */
export function isLoadThresholdReached(
  scrollTop: number,
  containerHeight: number,
  totalHeight: number,
  loadThreshold: number
): boolean {
  // Safety check for invalid inputs
  if (totalHeight <= 0 || containerHeight <= 0) return false;
  
  // Calculate the scroll position as a fraction of total height
  const scrollFraction = (scrollTop + containerHeight) / totalHeight;
  
  return scrollFraction > loadThreshold;
}