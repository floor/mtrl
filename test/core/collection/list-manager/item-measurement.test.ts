// test/core/collection/list-manager/item-measurement.test.ts
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
  dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="test-container" style="height: 300px; overflow: auto;">
          <div class="mtrl-list-item" data-id="1" style="height: 60px;">Item 1</div>
          <div class="mtrl-list-item" data-id="2" style="height: 80px;">Item 2</div>
          <div class="mtrl-list-item" data-id="3" style="height: 40px;">Item 3</div>
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
import { createItemMeasurement } from "../../../../src/core/collection/list-manager/dom/measurement";
import { ListManagerConfig } from "../../../../src/core/collection/list-manager/types";

describe("ItemMeasurement", () => {
  let measurement: ReturnType<typeof createItemMeasurement>;

  const mockConfig: ListManagerConfig = {
    renderItem: () => document.createElement("div"),
    itemHeight: 60,
    collection: "test",
  };

  // Create test DOM elements
  const setupTestDOM = () => {
    const container = document.createElement("div");
    container.id = "test-container";
    container.innerHTML = `
      <div class="mtrl-list-item" data-id="1" style="height: 60px;">Item 1</div>
      <div class="mtrl-list-item" data-id="2" style="height: 80px;">Item 2</div>
      <div class="mtrl-list-item" data-id="3" style="height: 40px;">Item 3</div>
    `;
    document.body.appendChild(container);
  };

  const cleanupTestDOM = () => {
    const container = document.getElementById("test-container");
    if (container) {
      container.remove();
    }
  };

  beforeEach(() => {
    measurement = createItemMeasurement(60);
    setupTestDOM();
  });

  afterEach(() => {
    cleanupTestDOM();
  });

  describe("Initialization", () => {
    test("creates measurement instance with default height", () => {
      expect(measurement.getDefaultHeight()).toBe(60);
      expect(measurement.isUsingUniformHeight()).toBe(true);
    });

    test("creates measurement instance with custom default height", () => {
      const customMeasurement = createItemMeasurement(100);
      expect(customMeasurement.getDefaultHeight()).toBe(100);
    });
  });

  describe("setup", () => {
    test("configures uniform height mode", () => {
      measurement.setup({
        ...mockConfig,
        itemHeight: 80,
      });

      expect(measurement.getDefaultHeight()).toBe(80);
      expect(measurement.isUsingUniformHeight()).toBe(true);
    });

    test("handles setup without config", () => {
      expect(() => measurement.setup()).not.toThrow();
      expect(measurement.isUsingUniformHeight()).toBe(true);
    });
  });

  describe("measureItemHeight", () => {
    test("measures DOM element height", () => {
      const item = { id: "1", name: "Item 1" };
      const element = document.querySelector('[data-id="1"]') as HTMLElement;

      const height = measurement.measureItemHeight(item, element);

      expect(height).toBe(60);
    });

    test("returns default height for invalid inputs", () => {
      expect(measurement.measureItemHeight(null, null as any)).toBe(60);
      expect(measurement.measureItemHeight({ id: "1" }, null as any)).toBe(60);
      expect(
        measurement.measureItemHeight(null, document.createElement("div"))
      ).toBe(60);
    });

    test("handles items without ID", () => {
      const item = { name: "No ID Item" };
      const element = document.createElement("div");
      element.style.height = "100px";

      const height = measurement.measureItemHeight(item, element);

      expect(height).toBe(60); // Should return default
    });

    test("stores height for first item in auto-detection mode", () => {
      const item = { id: "1", name: "Item 1" };
      const element = document.querySelector('[data-id="1"]') as HTMLElement;

      measurement.measureItemHeight(item, element);

      expect(measurement.getDefaultHeight()).toBe(60); // Updated from measured height
    });
  });

  describe("getItemHeight", () => {
    test("returns default height for any item", () => {
      const item = { id: "1", name: "Item 1" };

      expect(measurement.getItemHeight(item)).toBe(60);
    });

    test("handles null/undefined items", () => {
      expect(measurement.getItemHeight(null)).toBe(60);
      expect(measurement.getItemHeight(undefined)).toBe(60);
    });

    test("handles items without ID", () => {
      const item = { name: "No ID" };

      expect(measurement.getItemHeight(item)).toBe(60);
    });
  });

  describe("calculateTotalHeight", () => {
    test("calculates total height using uniform height", () => {
      const items = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
        { id: "3", name: "Item 3" },
      ];

      const totalHeight = measurement.calculateTotalHeight(items);

      expect(totalHeight).toBe(180); // 3 * 60
    });

    test("handles empty array", () => {
      expect(measurement.calculateTotalHeight([])).toBe(0);
      expect(measurement.calculateTotalHeight(null as any)).toBe(0);
    });

    test("handles sparse arrays", () => {
      const items = [
        { id: "1", name: "Item 1" },
        undefined,
        { id: "3", name: "Item 3" },
      ];

      const totalHeight = measurement.calculateTotalHeight(items);

      expect(totalHeight).toBe(180); // 3 array slots * 60
    });
  });

  describe("clear", () => {
    test("clears all cached data", () => {
      measurement.clear();

      expect(measurement.getAllHeights().size).toBe(0);
      expect(measurement.getItemHeight({ id: "1" })).toBe(60); // Still default
    });
  });

  describe("getAllHeights", () => {
    test("returns cached heights map", () => {
      const heights = measurement.getAllHeights();

      expect(heights.size).toBe(0); // No dynamic heights stored
    });
  });

  describe("isUsingUniformHeight", () => {
    test("always returns true for uniform height mode", () => {
      expect(measurement.isUsingUniformHeight()).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    test("complete uniform height workflow", () => {
      // 1. Setup measurement
      measurement.setup({ ...mockConfig, itemHeight: 50 });

      // 2. Test total height calculation
      const items = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
        { id: "3", name: "Item 3" },
      ];

      const totalHeight = measurement.calculateTotalHeight(items);

      expect(totalHeight).toBe(150); // 3 * 50
      expect(measurement.getDefaultHeight()).toBe(50);
      expect(measurement.isUsingUniformHeight()).toBe(true);

      // 3. Clear and verify
      measurement.clear();
      expect(measurement.getAllHeights().size).toBe(0);
    });
  });
});
