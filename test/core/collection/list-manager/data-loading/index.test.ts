// test/core/collection/list-manager/data-loading/index.test.ts
import {
  describe,
  test,
  expect,
  mock,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { JSDOM } from "jsdom";

// Setup for DOM testing environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="test-container" style="height: 300px; overflow: auto;">
          <div id="test-spacer"></div>
        </div>
      </body>
    </html>
  `);
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
import { createDataLoadingManager } from "../../../../../src/core/collection/list-manager/data/loading";
import { createInitialState } from "../../../../../src/core/collection/list-manager/state";
import {
  ListManagerConfig,
  ListManagerState,
} from "../../../../../src/core/collection/list-manager/types";

describe("Data Loading Manager", () => {
  let mockConfig: ListManagerConfig;
  let mockState: ListManagerState;
  let mockElements: any;
  let mockCollection: any;
  let mockAdapter: any;
  let mockGetPaginationFlags: any;
  let mockSetPaginationFlags: any;
  let mockReplacePlaceholdersWithReal: any;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="test-container" style="height: 300px; overflow: auto;">
        <div id="test-spacer"></div>
      </div>
    `;

    mockConfig = {
      renderItem: mock(() => document.createElement("div")),
      itemHeight: 84,
      pageSize: 20,
      pagination: { strategy: "page" },
      transform: mock((item: any) => ({ ...item, transformed: true })),
      dedupeItems: true,
      afterLoad: mock(() => {}),
    };

    mockState = {
      ...createInitialState(mockConfig),
      paginationStrategy: "page",
      page: 1,
      items: [],
      itemCount: 1000,
      totalHeight: 84000,
      hasNext: true,
      useStatic: false,
    } as ListManagerState;

    mockElements = {
      spacer: document.getElementById("test-spacer"),
    };

    mockCollection = {
      clear: mock(async () => {}),
      add: mock(async (items: any[]) => {}),
      getItems: mock(() => []),
    };

    mockAdapter = {
      read: mock(async (params: any) => ({
        items: Array.from({ length: 20 }, (_, i) => ({
          id: String((params.page - 1) * 20 + i + 1),
          name: `Item ${(params.page - 1) * 20 + i + 1}`,
        })),
        meta: {
          total: 1000,
          hasNext: params.page < 50,
          page: params.page,
          cursor: `cursor-${params.page}`,
        },
      })),
    };

    mockGetPaginationFlags = mock(() => ({ isPageJumpLoad: false }));
    mockSetPaginationFlags = mock(() => {});
    mockReplacePlaceholdersWithReal = mock(() => {});
  });

  describe("createDataLoadingManager", () => {
    test("creates data loading manager with required methods", () => {
      const manager = createDataLoadingManager({
        state: mockState,
        config: mockConfig,
        elements: mockElements,
        collection: "test-collection",
        adapter: mockAdapter,
        itemsCollection: mockCollection,
        getPaginationFlags: mockGetPaginationFlags,
        setPaginationFlags: mockSetPaginationFlags,
      });

      expect(typeof manager.loadItems).toBe("function");
      expect(typeof manager.refresh).toBe("function");
    });
  });

  describe("loadItems", () => {
    let manager: any;

    beforeEach(() => {
      manager = createDataLoadingManager({
        state: mockState,
        config: mockConfig,
        elements: mockElements,
        collection: "test-collection",
        adapter: mockAdapter,
        itemsCollection: mockCollection,
        getPaginationFlags: mockGetPaginationFlags,
        setPaginationFlags: mockSetPaginationFlags,
      });
    });

    test("loads items successfully with page parameters", async () => {
      const result = await manager.loadItems({ page: 1 });

      expect(result.items).toHaveLength(20);
      expect(result.items[0].id).toBe("1");
      expect(result.items[0].transformed).toBe(true); // Should be transformed
      expect(result.meta.total).toBe(1000);
      expect(result.meta.hasNext).toBe(true);
      expect(mockAdapter.read).toHaveBeenCalledWith({ page: 1 });
    });

    test("handles static data mode", async () => {
      mockState.useStatic = true;
      mockState.items = [{ id: "1", name: "Static Item" }];

      const result = await manager.loadItems();

      expect(result.items).toEqual([{ id: "1", name: "Static Item" }]);
      expect(result.meta.hasNext).toBe(false);
      expect(mockAdapter.read).not.toHaveBeenCalled();
    });

    test("blocks unwanted page loads for page protection", async () => {
      mockState.page = 1;
      mockGetPaginationFlags.mockReturnValue({ isPageJumpLoad: false });

      const result = await manager.loadItems({ page: 10 }); // Far page without page jump

      expect(result.items).toEqual(mockState.items);
      expect(mockAdapter.read).not.toHaveBeenCalled();
    });

    test("allows adjacent page loads for boundary detection", async () => {
      mockState.page = 2;
      mockGetPaginationFlags.mockReturnValue({ isPageJumpLoad: false });

      const result = await manager.loadItems({ page: 3 }); // Adjacent page

      expect(result.items).toHaveLength(20);
      expect(mockAdapter.read).toHaveBeenCalledWith({ page: 3 });
    });

    test("allows page jump loads", async () => {
      mockState.page = 1;
      mockGetPaginationFlags.mockReturnValue({ isPageJumpLoad: true });

      const result = await manager.loadItems({ page: 100 }); // Far page with page jump

      expect(result.items).toHaveLength(20);
      expect(mockAdapter.read).toHaveBeenCalledWith({ page: 100 });
    });

    test("handles page jump loads by clearing collection", async () => {
      mockGetPaginationFlags.mockReturnValue({ isPageJumpLoad: true });
      mockState.paginationStrategy = "page";

      await manager.loadItems({ page: 5 });

      expect(mockCollection.clear).toHaveBeenCalled();
      expect(mockCollection.add).toHaveBeenCalled();
    });

    test("handles boundary loads by appending to collection", async () => {
      mockState.page = 2;
      mockGetPaginationFlags.mockReturnValue({ isPageJumpLoad: false });
      mockState.paginationStrategy = "page";

      await manager.loadItems({ page: 3 });

      expect(mockCollection.clear).not.toHaveBeenCalled();
      expect(mockCollection.add).toHaveBeenCalled();
    });

    test("deduplicates items when configured", async () => {
      mockConfig.dedupeItems = true;
      mockState.paginationStrategy = "cursor";
      mockState.items = [{ id: "1", name: "Existing" }];

      // Mock collection to return existing items
      mockCollection.getItems.mockReturnValue([{ id: "1", name: "Existing" }]);

      await manager.loadItems();

      // Should filter out duplicates before adding
      expect(mockCollection.add).toHaveBeenCalled();
    });

    test("updates total height from API response", async () => {
      await manager.loadItems({ page: 1 });

      expect(mockState.totalHeight).toBe(84000); // 1000 * 84
      expect(mockState.totalHeightDirty).toBe(false);
    });

    test("calls afterLoad callback when provided", async () => {
      await manager.loadItems({ page: 1 });

      expect(mockConfig.afterLoad).toHaveBeenCalledWith({
        loading: false,
        hasNext: true,
        hasPrev: false,
        items: expect.any(Array),
        allItems: expect.any(Array),
      });
    });

    test("handles API errors gracefully", async () => {
      mockAdapter.read.mockRejectedValue(new Error("API Error"));

      const result = await manager.loadItems({ page: 1 });

      expect(result.items).toEqual([]);
      expect(result.meta.hasNext).toBe(false);
      expect(mockState.loading).toBe(false); // Should reset loading state
    });

    test("updates loading state during operation", async () => {
      let loadingDuringCall = false;

      mockAdapter.read.mockImplementation(async () => {
        loadingDuringCall = mockState.loading;
        return {
          items: [],
          meta: { total: 0, hasNext: false },
        };
      });

      await manager.loadItems({ page: 1 });

      expect(loadingDuringCall).toBe(true); // Was loading during API call
      expect(mockState.loading).toBe(false); // Reset after completion
    });

    test("handles cursor pagination strategy", async () => {
      mockState.paginationStrategy = "cursor";
      mockAdapter.read.mockResolvedValue({
        items: [{ id: "1", name: "Item 1" }],
        meta: { cursor: "next-cursor", hasNext: true },
      });

      await manager.loadItems({ cursor: "current-cursor" });

      expect(mockState.cursor).toBe("next-cursor");
      expect(mockAdapter.read).toHaveBeenCalledWith({
        cursor: "current-cursor",
      });
    });

    test("throws error when adapter is not provided", async () => {
      const managerWithoutAdapter = createDataLoadingManager({
        state: mockState,
        config: mockConfig,
        elements: mockElements,
        collection: "test-collection",
        adapter: null, // No adapter
        itemsCollection: mockCollection,
        getPaginationFlags: mockGetPaginationFlags,
        setPaginationFlags: mockSetPaginationFlags,
      });

      const result = await managerWithoutAdapter.loadItems();

      expect(result.items).toEqual([]);
      expect(result.meta.hasNext).toBe(false);
    });

    test("resets page jump flag after load", async () => {
      mockGetPaginationFlags.mockReturnValue({ isPageJumpLoad: true });

      await manager.loadItems({ page: 5 });

      expect(mockSetPaginationFlags).toHaveBeenCalledWith({
        isPageJumpLoad: false,
      });
    });

    test("handles empty API response", async () => {
      // Reset totalHeight to test the update
      mockState.totalHeight = 0;
      mockState.itemCount = 0;

      mockAdapter.read.mockResolvedValue({
        items: [],
        meta: { total: 0, hasNext: false },
      });

      const result = await manager.loadItems({ page: 1 });

      expect(result.items).toEqual([]);
      expect(result.meta.hasNext).toBe(false);
      // Total height should remain 0 when API returns total: 0
      expect(mockState.totalHeight).toBe(0);
    });
  });

  describe("refresh", () => {
    let manager: any;

    beforeEach(() => {
      manager = createDataLoadingManager({
        state: mockState,
        config: mockConfig,
        elements: mockElements,
        collection: "test-collection",
        adapter: mockAdapter,
        itemsCollection: mockCollection,
        getPaginationFlags: mockGetPaginationFlags,
        setPaginationFlags: mockSetPaginationFlags,
      });
    });

    test("clears collection and resets state", async () => {
      // Set up some existing state
      mockState.items = [{ id: "1", name: "Existing" }];
      mockState.visibleItems = [{ id: "1", name: "Existing" }];
      mockState.cursor = "some-cursor";
      mockState.page = 5;
      mockState.hasNext = true;

      await manager.refresh();

      expect(mockCollection.clear).toHaveBeenCalled();
      expect(mockState.items).toEqual([]);
      expect(mockState.visibleItems).toEqual([]);
      expect(mockState.visibleRange).toEqual({ start: 0, end: 0 });
      expect(mockState.cursor).toBeNull();
      expect(mockState.page).toBe(1); // Reset to page 1 for page pagination
      expect(mockState.hasNext).toBe(true); // For API mode
      expect(mockState.totalHeightDirty).toBe(true);
      expect(mockState.itemCount).toBe(0);
    });

    test("handles static data refresh", async () => {
      const staticItems = [
        { id: "1", name: "Static 1" },
        { id: "2", name: "Static 2" },
      ];

      mockState.useStatic = true;
      mockConfig.staticItems = staticItems;

      await manager.refresh();

      expect(mockState.items).toEqual(staticItems);
      expect(mockState.hasNext).toBe(false); // For static mode
      expect(mockState.itemCount).toBe(2);
      expect(mockCollection.add).toHaveBeenCalledWith([
        { id: "1", name: "Static 1", transformed: true },
        { id: "2", name: "Static 2", transformed: true },
      ]);
    });

    test("handles cursor pagination refresh", async () => {
      mockState.paginationStrategy = "cursor";
      mockConfig.pagination = { strategy: "cursor" };

      await manager.refresh();

      expect(mockState.page).toBeUndefined(); // No page for cursor pagination
    });

    test("transforms static items before adding to collection", async () => {
      const staticItems = [{ id: "1", name: "Static Item" }];

      mockState.useStatic = true;
      mockConfig.staticItems = staticItems;

      // Clear any previous calls to transform
      (mockConfig.transform as any).mockClear();

      await manager.refresh();

      // Check that transform was called exactly once
      expect(mockConfig.transform).toHaveBeenCalledTimes(1);
      // Check that it was called with static item (might have additional properties)
      expect((mockConfig.transform as any).mock.calls[0][0]).toEqual(
        expect.objectContaining({
          id: "1",
          name: "Static Item",
        })
      );
      expect(mockCollection.add).toHaveBeenCalledWith([
        { id: "1", name: "Static Item", transformed: true },
      ]);
    });

    test("handles refresh without static items", async () => {
      mockState.useStatic = true;
      mockConfig.staticItems = undefined;

      await manager.refresh();

      expect(mockState.items).toEqual([]);
      expect(mockCollection.add).not.toHaveBeenCalled();
    });
  });

  describe("Integration Tests", () => {
    test("complete data loading workflow", async () => {
      const manager = createDataLoadingManager({
        state: mockState,
        config: mockConfig,
        elements: mockElements,
        collection: "test-collection",
        adapter: mockAdapter,
        itemsCollection: mockCollection,
        getPaginationFlags: mockGetPaginationFlags,
        setPaginationFlags: mockSetPaginationFlags,
      });

      // 1. Load first page
      let result = await manager.loadItems({ page: 1 });
      expect(result.items).toHaveLength(20);
      expect(mockState.loading).toBe(false);

      // 2. Simulate page jump
      mockGetPaginationFlags.mockReturnValue({ isPageJumpLoad: true });
      result = await manager.loadItems({ page: 100 });
      expect(result.items).toHaveLength(20);
      expect(mockCollection.clear).toHaveBeenCalled();

      // 3. Load adjacent page
      mockGetPaginationFlags.mockReturnValue({ isPageJumpLoad: false });
      mockState.page = 100;
      result = await manager.loadItems({ page: 101 });
      expect(result.items).toHaveLength(20);

      // 4. Refresh everything
      await manager.refresh();
      expect(mockState.items).toEqual([]);
      expect(mockState.page).toBe(1);

      // Verify all operations worked
      expect(mockAdapter.read).toHaveBeenCalled();
      expect(mockCollection.add).toHaveBeenCalled();
      expect(mockSetPaginationFlags).toHaveBeenCalled();
    });

    test("error handling throughout workflow", async () => {
      const manager = createDataLoadingManager({
        state: mockState,
        config: mockConfig,
        elements: mockElements,
        collection: "test-collection",
        adapter: mockAdapter,
        itemsCollection: mockCollection,
        getPaginationFlags: mockGetPaginationFlags,
        setPaginationFlags: mockSetPaginationFlags,
      });

      // Test API error handling
      mockAdapter.read.mockRejectedValueOnce(new Error("Network Error"));
      let result = await manager.loadItems({ page: 1 });
      expect(result.items).toEqual([]);
      expect(mockState.loading).toBe(false);

      // Test collection error handling
      mockCollection.add.mockRejectedValueOnce(new Error("Collection Error"));
      result = await manager.loadItems({ page: 2 });
      expect(mockState.loading).toBe(false);

      // Refresh should still work
      await manager.refresh();
      expect(mockCollection.clear).toHaveBeenCalled();
    });
  });
});
