// test/benchmarks/core/dom/create-optimization.bench.test.ts - createElement Optimization Benchmarks
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { JSDOM } from "jsdom";

// Import the actual optimized createElement from mtrl local source
import { createElement as createElementOptimized } from "../../../../src/core/dom/create";

// Set up DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.SVGElement = dom.window.SVGElement;

describe("createElement Optimization Benchmarks", () => {
  // Mock the original createElement implementation for comparison
  const createElementOriginal = (options: any = {}) => {
    // Simulate the original heavy destructuring
    const {
      tag = "div",
      container = null,
      html = "",
      text = "",
      id = "",
      data = {},
      class: classOption,
      className,
      rawClass,
      attributes = {},
      forwardEvents = {},
      onCreate,
      context,
      ...rest
    } = options;

    // Create element
    const element = document.createElement(tag);

    // Simulate original helper function calls
    if (html) element.innerHTML = html;
    if (text) element.textContent = text;
    if (id) element.id = id;

    // Simulate class processing overhead
    const cls = classOption || className;
    if (cls) {
      if (typeof cls === "string") {
        element.classList.add(`mtrl-${cls}`);
      } else if (Array.isArray(cls)) {
        cls.forEach((c) => element.classList.add(`mtrl-${c}`));
      }
    }

    if (rawClass) {
      if (typeof rawClass === "string") {
        element.classList.add(rawClass);
      } else if (Array.isArray(rawClass)) {
        rawClass.forEach((c) => element.classList.add(c));
      }
    }

    // Simulate data attribute processing
    for (const key in data) {
      element.dataset[key] = data[key];
    }

    // Simulate attribute processing with object spread overhead
    const allAttributes = { ...attributes, ...rest };
    for (const key in allAttributes) {
      const value = allAttributes[key];
      if (value != null) {
        element.setAttribute(key, String(value));
      }
    }

    // Simulate container and onCreate
    if (container) container.appendChild(element);
    if (onCreate) onCreate(element, context);

    return element;
  };

  describe("Fast Path Performance", () => {
    test("empty options fast path", () => {
      const iterations = 50000;

      console.log(
        `\n🚀 createElement Fast Path: Empty Options (${iterations} iterations):`
      );
      console.log(`   Testing optimized fast path vs original implementation`);

      // Test original implementation
      const originalStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementOriginal({});
      }
      const originalTime = performance.now() - originalStart;

      // Test optimized implementation
      const optimizedStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementOptimized({});
      }
      const optimizedTime = performance.now() - optimizedStart;

      const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
      const speedup = originalTime / optimizedTime;

      console.log(`   Original:  ${originalTime.toFixed(2)}ms`);
      console.log(`   Optimized: ${optimizedTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${improvement.toFixed(1)}% faster`);
      console.log(`   Speedup: ${speedup.toFixed(1)}x`);
      console.log(
        `   Per operation: ${((optimizedTime / iterations) * 1000).toFixed(
          3
        )}μs`
      );

      expect(optimizedTime).toBeLessThan(originalTime);
      expect(improvement).toBeGreaterThan(10); // Expect at least 10% improvement for simple cases
    });

    test("tag-only fast path", () => {
      const iterations = 30000;

      console.log(
        `\n🎯 createElement Fast Path: Tag Only (${iterations} iterations):`
      );
      console.log(`   Testing { tag: 'span' } optimization`);

      // Test original implementation
      const originalStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementOriginal({ tag: "span" });
      }
      const originalTime = performance.now() - originalStart;

      // Test optimized implementation
      const optimizedStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementOptimized({ tag: "span" });
      }
      const optimizedTime = performance.now() - optimizedStart;

      const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
      const speedup = originalTime / optimizedTime;

      console.log(`   Original:  ${originalTime.toFixed(2)}ms`);
      console.log(`   Optimized: ${optimizedTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${improvement.toFixed(1)}% faster`);
      console.log(`   Speedup: ${speedup.toFixed(1)}x`);

      expect(optimizedTime).toBeLessThan(originalTime);
      expect(improvement).toBeGreaterThan(8); // Expect at least 8% improvement for tag-only cases
    });

    test("simple content fast path", () => {
      const iterations = 20000;

      console.log(
        `\n📝 createElement Fast Path: Simple Content (${iterations} iterations):`
      );
      console.log(`   Testing { tag: 'div', text: 'Hello', class: 'button' }`);

      const options = { tag: "div", text: "Hello", class: "button" };

      // Test original implementation
      const originalStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementOriginal(options);
      }
      const originalTime = performance.now() - originalStart;

      // Test optimized implementation
      const optimizedStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementOptimized(options);
      }
      const optimizedTime = performance.now() - optimizedStart;

      const improvement = ((originalTime - optimizedTime) / originalTime) * 100;

      console.log(`   Original:  ${originalTime.toFixed(2)}ms`);
      console.log(`   Optimized: ${optimizedTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${improvement.toFixed(1)}% faster`);

      expect(optimizedTime).toBeLessThan(originalTime);
    });
  });

  describe("Complex Element Performance", () => {
    test("complex element creation", () => {
      const iterations = 5000;

      console.log(`\n🔧 Complex createElement (${iterations} iterations):`);
      console.log(`   Testing elements with attributes, classes, data, etc.`);

      const complexOptions = {
        tag: "button",
        text: "Click Me",
        id: "test-button",
        class: ["button", "primary"],
        rawClass: "custom-style",
        data: { action: "submit", value: "123" },
        attributes: {
          type: "button",
          disabled: false,
          "aria-label": "Submit button",
        },
      };

      // Test original implementation
      const originalStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementOriginal({
          ...complexOptions,
          id: `test-${i}`,
        });
      }
      const originalTime = performance.now() - originalStart;

      // Test optimized implementation
      const optimizedStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementOptimized({
          ...complexOptions,
          id: `test-${i}`,
        });
      }
      const optimizedTime = performance.now() - optimizedStart;

      const improvement = ((originalTime - optimizedTime) / originalTime) * 100;

      console.log(`   Original:  ${originalTime.toFixed(2)}ms`);
      console.log(`   Optimized: ${optimizedTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${improvement.toFixed(1)}% faster`);
      console.log(
        `   Per element: ${(optimizedTime / iterations).toFixed(3)}ms`
      );

      expect(optimizedTime).toBeLessThan(originalTime);
    });
  });

  describe("Real-World Component Creation", () => {
    test("component creation patterns", () => {
      const iterations = 1000;

      console.log(
        `\n🏗️  Component Creation Patterns (${iterations} components):`
      );
      console.log(`   Testing realistic mtrl component creation scenarios`);

      // Simulate creating various mtrl components
      const componentTypes = [
        { tag: "button", text: "Submit", class: "button" },
        {
          tag: "input",
          attributes: { type: "text", placeholder: "Enter text" },
          class: "textfield",
        },
        {
          tag: "div",
          class: ["card", "elevated"],
          html: "<p>Card content</p>",
        },
        { tag: "span", class: "chip", text: "Tag", data: { value: "tag1" } },
        { tag: "div", class: "progress", attributes: { role: "progressbar" } },
      ];

      // Test original implementation
      const originalStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const componentType = componentTypes[i % componentTypes.length];
        const element = createElementOriginal({
          ...componentType,
          id: `comp-${i}`,
        });
      }
      const originalTime = performance.now() - originalStart;

      // Test optimized implementation
      const optimizedStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const componentType = componentTypes[i % componentTypes.length];
        const element = createElementOptimized({
          ...componentType,
          id: `comp-${i}`,
        });
      }
      const optimizedTime = performance.now() - optimizedStart;

      const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
      const avgTimePerComponent = optimizedTime / iterations;

      console.log(`   Original:  ${originalTime.toFixed(2)}ms`);
      console.log(`   Optimized: ${optimizedTime.toFixed(2)}ms`);
      console.log(`   Improvement: ${improvement.toFixed(1)}% faster`);
      console.log(`   Per component: ${avgTimePerComponent.toFixed(3)}ms`);
      console.log(
        `   Throughput: ${Math.round(
          iterations / (optimizedTime / 1000)
        ).toLocaleString()} components/sec`
      );

      expect(optimizedTime).toBeLessThan(originalTime);
      expect(avgTimePerComponent).toBeLessThan(1); // Should be under 1ms per component
    });
  });
});
