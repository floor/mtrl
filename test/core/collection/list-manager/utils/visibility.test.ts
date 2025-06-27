import {
  describe,
  test,
  expect,
  mock,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "bun:test";
import { JSDOM } from "jsdom";

// Setup for DOM testing environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  window = dom.window as any;
  document = window.document;
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;
  global.document = document;
  global.window = window as any;
});

afterAll(() => {
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  window.close();
});

// Import modules after DOM setup
import {
  calculateVisibleRangeOptimized,
  calculateVisibleRange,
  calculateItemPositions,
  isLoadThresholdReached,
} from "../../../../../src/core/collection/list-manager/utils/visibility";
import { createItemMeasurement } from "../../../../../src/core/collection/list-manager/item-measurement";
import { ListManagerConfig } from "../../../../../src/core/collection/list-manager/types";

describe("Visibility Utils", () => {
  let mockConfig: ListManagerConfig;
  let mockItemMeasurement: any;

  beforeEach(() => {
    // Create basic config
    mockConfig = {
      itemHeight: 60,
      renderBufferSize: 3,
      overscanCount: 2,
      renderItem: mock(() => document.createElement("div")),
    };

    // Create real item measurement instance
    mockItemMeasurement = createItemMeasurement(60);
  });

  describe("calculateVisibleRangeOptimized", () => {
    test("calculates visible range for simple case", () => {
      const result = calculateVisibleRangeOptimized(
        120, // scrollTop (showing items starting at index 2)
        60, // itemHeight
        300, // containerHeight (5 items visible)
        100, // totalItems
        mockConfig
      );

      // With scrollTop=120, itemHeight=60: startIndex = floor(120/60) = 2
      // With containerHeight=300: visibleCount = ceil(300/60) = 5
      // endIndex = 2 + 5 = 7
      // With buffer=3, overscan=2: start = max(0, 2-3-2) = 0, end = min(100, 7+3+2) = 12
      expect(result.start).toBe(0);
      expect(result.end).toBe(12);
    });

    test("handles start of list", () => {
      const result = calculateVisibleRangeOptimized(
        0, // scrollTop (at top)
        60, // itemHeight
        300, // containerHeight
        100, // totalItems
        mockConfig
      );

      // startIndex = 0, endIndex = 5, with buffers: start = 0, end = 10
      expect(result.start).toBe(0);
      expect(result.end).toBe(10);
    });

    test("handles near end of list", () => {
      const result = calculateVisibleRangeOptimized(
        5640, // scrollTop (near end, item 94)
        60, // itemHeight
        300, // containerHeight
        100, // totalItems
        mockConfig
      );

      // startIndex = floor(5640/60) = 94
      // endIndex = 94 + 5 = 99
      // With buffers: start = max(0, 94-5) = 89, end = min(100, 99+5) = 100
      expect(result.start).toBe(89);
      expect(result.end).toBe(100);
    });

    test("handles overscan config", () => {
      const configWithOverscan = {
        ...mockConfig,
        overscan: 5, // Should override overscanCount
      };

      const result = calculateVisibleRangeOptimized(
        120, // scrollTop
        60, // itemHeight
        300, // containerHeight
        100, // totalItems
        configWithOverscan
      );

      // With overscan=5 instead of overscanCount=2
      // start = max(0, 2-3-5) = 0, end = min(100, 7+3+5) = 15
      expect(result.start).toBe(0);
      expect(result.end).toBe(15);
    });

    test("handles empty config", () => {
      const result = calculateVisibleRangeOptimized(
        120, // scrollTop
        60, // itemHeight
        300, // containerHeight
        100, // totalItems
        {} as ListManagerConfig
      );

      // Should use default values
      expect(result.start).toBeGreaterThanOrEqual(0);
      expect(result.end).toBeLessThanOrEqual(100);
      expect(result.end).toBeGreaterThan(result.start);
    });
  });

  describe("calculateVisibleRange", () => {
    const createMockItems = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
      }));
    };

    test("handles empty array", () => {
      const result = calculateVisibleRange(
        0,
        [],
        300,
        mockItemMeasurement,
        mockConfig
      );

      expect(result.start).toBe(0);
      expect(result.end).toBe(0);
    });

    test("handles small lists (below threshold)", () => {
      const items = createMockItems(5);
      const result = calculateVisibleRange(
        60,
        items,
        300,
        mockItemMeasurement,
        mockConfig
      );

      // Small lists should show all items
      expect(result.start).toBe(0);
      expect(result.end).toBe(5);
    });

    test("uses optimized calculation for medium lists", () => {
      const items = createMockItems(50);
      const result = calculateVisibleRange(
        300, // scrollTop
        items,
        300, // containerHeight
        mockItemMeasurement,
        mockConfig
      );

      // Should use optimized path and constrain to actual array length
      expect(result.start).toBeGreaterThanOrEqual(0);
      expect(result.end).toBeLessThanOrEqual(items.length);
      expect(result.end).toBeGreaterThan(result.start);
    });

    test("handles sparse arrays correctly", () => {
      const items = createMockItems(20);
      // Make array sparse by deleting some elements
      delete items[5];
      delete items[10];
      delete items[15];

      const result = calculateVisibleRange(
        120,
        items,
        300,
        mockItemMeasurement,
        mockConfig
      );

      expect(result.start).toBeGreaterThanOrEqual(0);
      expect(result.end).toBeLessThanOrEqual(items.length);
    });

    test("handles very large lists with binary search", () => {
      // Create a large enough list to trigger binary search
      const items = createMockItems(1500); // Above BINARY_SEARCH_THRESHOLD
      const result = calculateVisibleRange(
        1800, // scrollTop
        items,
        300, // containerHeight
        mockItemMeasurement,
        mockConfig
      );

      expect(result.start).toBeGreaterThanOrEqual(0);
      expect(result.end).toBeLessThanOrEqual(items.length);
      expect(result.end).toBeGreaterThan(result.start);
    });

    test("handles custom item heights", () => {
      const items = createMockItems(20);
      const customMeasurement = createItemMeasurement(80); // Different height

      const result = calculateVisibleRange(
        160, // scrollTop
        items,
        320, // containerHeight
        customMeasurement,
        { ...mockConfig, itemHeight: 80 }
      );

      expect(result.start).toBeGreaterThanOrEqual(0);
      expect(result.end).toBeLessThanOrEqual(items.length);
    });
  });

  describe("calculateItemPositions", () => {
    const createMockItems = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
      }));
    };

    test("calculates positions for visible range", () => {
      const items = createMockItems(20);
      const visibleRange = { start: 5, end: 10 };

      const positions = calculateItemPositions(
        items,
        visibleRange,
        mockItemMeasurement
      );

      expect(positions).toHaveLength(5); // 10 - 5 = 5 items
      expect(positions[0].index).toBe(5);
      expect(positions[0].item).toEqual(items[5]);
      expect(positions[0].offset).toBe(300); // 5 * 60 = 300

      expect(positions[4].index).toBe(9);
      expect(positions[4].item).toEqual(items[9]);
      expect(positions[4].offset).toBe(540); // 9 * 60 = 540
    });

    test("handles sparse arrays in visible range", () => {
      const items = createMockItems(20);
      delete items[7]; // Create gap
      const visibleRange = { start: 5, end: 10 };

      const positions = calculateItemPositions(
        items,
        visibleRange,
        mockItemMeasurement
      );

      // Should skip undefined items
      expect(positions).toHaveLength(4); // 5 items minus 1 undefined
      expect(positions.map((p) => p.index)).toEqual([5, 6, 8, 9]);
    });

    test("calculates correct offsets", () => {
      const items = createMockItems(10);
      const visibleRange = { start: 3, end: 6 };

      const positions = calculateItemPositions(
        items,
        visibleRange,
        mockItemMeasurement
      );

      expect(positions[0].offset).toBe(180); // 3 * 60
      expect(positions[1].offset).toBe(240); // 4 * 60
      expect(positions[2].offset).toBe(300); // 5 * 60
    });

    test("handles empty visible range", () => {
      const items = createMockItems(10);
      const visibleRange = { start: 5, end: 5 };

      const positions = calculateItemPositions(
        items,
        visibleRange,
        mockItemMeasurement
      );

      expect(positions).toHaveLength(0);
    });

    test("uses cached offsets when available", () => {
      const items = createMockItems(10);
      const visibleRange = { start: 2, end: 5 };

      // Mock item measurement with cached offsets
      const cachedMeasurement = {
        ...mockItemMeasurement,
        hasCachedOffsets: mock(() => true),
        getOffsetAtIndex: mock((index: number) => index * 60),
        getItemHeight: mock(() => 60),
      };

      const positions = calculateItemPositions(
        items,
        visibleRange,
        cachedMeasurement
      );

      expect(cachedMeasurement.hasCachedOffsets).toHaveBeenCalled();
      expect(cachedMeasurement.getOffsetAtIndex).toHaveBeenCalledWith(2);
      expect(cachedMeasurement.getOffsetAtIndex).toHaveBeenCalledWith(3);
      expect(cachedMeasurement.getOffsetAtIndex).toHaveBeenCalledWith(4);
      expect(positions[0].offset).toBe(120); // 2 * 60
    });
  });

  describe("isLoadThresholdReached", () => {
    test("detects when threshold is reached", () => {
      const result = isLoadThresholdReached(
        800, // scrollTop
        300, // containerHeight
        1200, // totalHeight
        0.8 // loadThreshold (80%)
      );

      // (800 + 300) / 1200 = 1100 / 1200 = 0.916 > 0.8
      expect(result).toBe(true);
    });

    test("detects when threshold is not reached", () => {
      const result = isLoadThresholdReached(
        400, // scrollTop
        300, // containerHeight
        1200, // totalHeight
        0.8 // loadThreshold (80%)
      );

      // (400 + 300) / 1200 = 700 / 1200 = 0.583 < 0.8
      expect(result).toBe(false);
    });

    test("handles edge case at exact threshold", () => {
      const result = isLoadThresholdReached(
        660, // scrollTop
        300, // containerHeight
        1200, // totalHeight
        0.8 // loadThreshold (80%)
      );

      // (660 + 300) / 1200 = 960 / 1200 = 0.8 = 0.8 (not greater)
      expect(result).toBe(false);
    });

    test("handles invalid inputs safely", () => {
      expect(isLoadThresholdReached(100, 300, 0, 0.8)).toBe(false);
      expect(isLoadThresholdReached(100, 300, -100, 0.8)).toBe(false);
      expect(isLoadThresholdReached(100, 0, 1000, 0.8)).toBe(false);
      expect(isLoadThresholdReached(100, -300, 1000, 0.8)).toBe(false);
    });

    test("handles scroll at beginning", () => {
      const result = isLoadThresholdReached(
        0, // scrollTop (at top)
        300, // containerHeight
        1200, // totalHeight
        0.8 // loadThreshold
      );

      // (0 + 300) / 1200 = 0.25 < 0.8
      expect(result).toBe(false);
    });

    test("handles scroll at end", () => {
      const result = isLoadThresholdReached(
        900, // scrollTop (at bottom)
        300, // containerHeight
        1200, // totalHeight
        0.8 // loadThreshold
      );

      // (900 + 300) / 1200 = 1.0 > 0.8
      expect(result).toBe(true);
    });

    test("handles different thresholds", () => {
      const scrollTop = 500;
      const containerHeight = 300;
      const totalHeight = 1200;
      // scroll fraction = (500 + 300) / 1200 = 0.667

      expect(
        isLoadThresholdReached(scrollTop, containerHeight, totalHeight, 0.5)
      ).toBe(true); // 0.667 > 0.5
      expect(
        isLoadThresholdReached(scrollTop, containerHeight, totalHeight, 0.7)
      ).toBe(false); // 0.667 < 0.7
      expect(
        isLoadThresholdReached(scrollTop, containerHeight, totalHeight, 0.667)
      ).toBe(false); // 0.667 = 0.667
    });
  });

  describe("Integration Tests", () => {
    test("visibility calculation works end-to-end", () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
      }));

      // Calculate visible range
      const visibleRange = calculateVisibleRange(
        600, // scrollTop
        items,
        300, // containerHeight
        mockItemMeasurement,
        mockConfig
      );

      // Calculate positions for visible items
      const positions = calculateItemPositions(
        items,
        visibleRange,
        mockItemMeasurement
      );

      // Verify everything is consistent
      expect(visibleRange.start).toBeGreaterThanOrEqual(0);
      expect(visibleRange.end).toBeLessThanOrEqual(items.length);
      expect(positions.length).toBe(visibleRange.end - visibleRange.start);

      // Check positions are monotonically increasing
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].offset).toBeGreaterThan(positions[i - 1].offset);
        expect(positions[i].index).toBe(positions[i - 1].index + 1);
      }
    });

    test("handles complex scrolling scenarios", () => {
      const items = Array.from({ length: 200 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
      }));

      // Test various scroll positions
      const scrollPositions = [0, 100, 500, 1000, 2000, 10000];

      for (const scrollTop of scrollPositions) {
        const visibleRange = calculateVisibleRange(
          scrollTop,
          items,
          300,
          mockItemMeasurement,
          mockConfig
        );

        const positions = calculateItemPositions(
          items,
          visibleRange,
          mockItemMeasurement
        );

        // Basic sanity checks
        expect(visibleRange.start).toBeGreaterThanOrEqual(0);
        expect(visibleRange.end).toBeLessThanOrEqual(items.length);
        expect(visibleRange.end).toBeGreaterThanOrEqual(visibleRange.start);
        expect(positions.length).toBe(visibleRange.end - visibleRange.start);
      }
    });
  });
});
