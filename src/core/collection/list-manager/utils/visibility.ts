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
  const { renderBufferSize, overscanCount } = config;
  
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
  const { renderBufferSize, overscanCount } = config;
  
  // Check if we can use the optimized path for fixed height items
  const allHeights = itemMeasurement.getAllHeights();
  const uniqueHeights = new Set(allHeights.values());
  if (uniqueHeights.size <= 1 && items.length > 20) {
    return calculateVisibleRangeOptimized(
      scrollTop,
      config.itemHeight,
      containerHeight,
      items.length,
      config
    );
  }
  
  let currentOffset = 0;
  let startIndex = 0;
  let endIndex = 0;
  
  // Find the first visible item
  for (let i = 0; i < items.length; i++) {
    // Add null/undefined check
    if (!items[i]) {
      console.warn(`Item at index ${i} is undefined`);
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
  if (totalHeight === 0) return false;
  
  // Calculate the scroll position as a fraction of total height
  const scrollFraction = (scrollTop + containerHeight) / totalHeight;
  
  return scrollFraction > loadThreshold;
}