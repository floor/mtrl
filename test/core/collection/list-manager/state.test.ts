// test/core/collection/list-manager/state.test.ts
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
  createInitialState,
  updateStateAfterLoad,
  updateVisibleItems,
  updateTotalHeight,
  updateLoadingState,
  resetState,
  createLoadParams,
} from "../../../../src/core/collection/list-manager/utils/state";
import {
  ListManagerConfig,
  ListManagerState,
} from "../../../../src/core/collection/list-manager/types";

describe("State Management", () => {
  let mockConfig: ListManagerConfig;

  beforeEach(() => {
    mockConfig = {
      renderItem: mock(() => document.createElement("div")),
      itemHeight: 60,
      pageSize: 20,
    };
  });

  describe("createInitialState", () => {
    test("creates initial state for API mode", () => {
      const configWithApi = {
        ...mockConfig,
        baseUrl: "https://api.example.com",
        pagination: { strategy: "page" as const },
      };

      const state = createInitialState(configWithApi);

      expect(state.items).toEqual([]);
      expect(state.visibleItems).toEqual([]);
      expect(state.visibleRange).toEqual({ start: 0, end: 0 });
      expect(state.loading).toBe(false);
      expect(state.cursor).toBeNull();
      expect(state.page).toBe(1);
      expect(state.paginationStrategy).toBe("page");
      expect(state.hasNext).toBe(true);
      expect(state.useStatic).toBe(false);
      expect(state.mounted).toBe(false);
      expect(state.itemCount).toBe(0);
      expect(state.totalHeightDirty).toBe(true);
    });

    test("creates initial state for static mode", () => {
      const staticItems = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];

      const configWithStatic = {
        ...mockConfig,
        staticItems,
      };

      const state = createInitialState(configWithStatic);

      expect(state.items).toEqual(staticItems);
      expect(state.hasNext).toBe(false);
      expect(state.useStatic).toBe(true);
      expect(state.itemCount).toBe(2);
      expect(state.paginationStrategy).toBe("cursor");
    });
  });

  describe("updateStateAfterLoad", () => {
    let baseState: ListManagerState;

    beforeEach(() => {
      baseState = createInitialState(mockConfig);
    });

    test("updates state with new items for cursor pagination", () => {
      const newItems = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];
      const meta = {
        cursor: "next-cursor",
        hasNext: true,
        total: 100,
      };

      const updates = updateStateAfterLoad(baseState, newItems, meta);

      expect(updates.items).toEqual(newItems);
      expect(updates.cursor).toBe("next-cursor");
      expect(updates.hasNext).toBe(true);
      expect(updates.itemCount).toBe(100);
      expect(updates.totalHeightDirty).toBe(true);
    });

    test("maintains sorted order when inserting items", () => {
      const existingItems = [
        { id: "1", name: "Item 1" },
        { id: "3", name: "Item 3" },
      ];
      const stateWithItems = { ...baseState, items: existingItems };

      const newItems = [{ id: "2", name: "Item 2" }];
      const meta = { hasNext: false };

      const updates = updateStateAfterLoad(
        stateWithItems,
        newItems,
        meta,
        false
      );

      expect(updates.items).toEqual([
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
        { id: "3", name: "Item 3" },
      ]);
    });

    test("deduplicates items by default", () => {
      const existingItems = [{ id: "1", name: "Item 1" }];
      const stateWithItems = { ...baseState, items: existingItems };

      const newItems = [
        { id: "1", name: "Item 1 Updated" },
        { id: "2", name: "Item 2" },
      ];
      const meta = { hasNext: false };

      const updates = updateStateAfterLoad(
        stateWithItems,
        newItems,
        meta,
        true
      );

      // Should filter out duplicate id="1"
      expect(updates.items).toHaveLength(2);
      expect(updates.items?.find((item) => item.id === "1")?.name).toBe(
        "Item 1"
      ); // Original kept
      expect(updates.items?.find((item) => item.id === "2")).toBeDefined();
    });
  });

  describe("createLoadParams", () => {
    test("creates params for page-based pagination", () => {
      const state = {
        ...createInitialState(mockConfig),
        paginationStrategy: "page" as const,
        page: 3,
      };

      const params = createLoadParams(state);

      expect(params.page).toBe(3);
    });

    test("creates params for cursor-based pagination", () => {
      const state = {
        ...createInitialState(mockConfig),
        paginationStrategy: "cursor" as const,
        cursor: "abc123",
      };

      const params = createLoadParams(state);

      expect(params.cursor).toBe("abc123");
    });

    test("creates params for offset-based pagination", () => {
      const state = {
        ...createInitialState(mockConfig),
        paginationStrategy: "offset" as const,
        cursor: "100",
      };

      const params = createLoadParams(state);

      expect(params.offset).toBe(100);
    });
  });
});
