import { expect, describe, it } from "bun:test";
import { JSDOM } from "jsdom";

// Set up DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Import DOM classes utilities
import {
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  normalizeClasses,
} from "../../../../src/core/dom/classes";

describe("DOM Classes Performance Benchmarks", () => {
  describe("normalizeClasses Performance", () => {
    it("should handle simple string classes efficiently", () => {
      const iterations = 100000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        normalizeClasses("button primary");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n🔧 normalizeClasses - Simple Strings (${iterations} ops):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(1000); // Should be under 1 second
    });

    it("should handle array classes efficiently", () => {
      const iterations = 50000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        normalizeClasses(["button", "primary", "large"]);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔧 normalizeClasses - Arrays (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(1000);
    });

    it("should handle mixed complex classes efficiently", () => {
      const iterations = 25000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        normalizeClasses(
          "button primary",
          ["large", "elevated"],
          "custom-class"
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔧 normalizeClasses - Mixed Complex (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(1000);
    });

    it("should handle duplicate classes efficiently", () => {
      const iterations = 25000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        normalizeClasses("button primary button", "primary large primary");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔧 normalizeClasses - Duplicates (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(1000);
    });

    it("should handle empty inputs gracefully", () => {
      const iterations = 100000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        normalizeClasses("", [], null as any, undefined as any);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔄 Empty Input Handling (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );

      expect(totalTime).toBeLessThan(500);
    });

    it("should handle large class lists efficiently", () => {
      const iterations = 1000;
      const largeClassList = Array.from(
        { length: 100 },
        (_, i) => `class-${i}`
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        normalizeClasses(...largeClassList);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n📊 Large Class Lists (${iterations} ops × 100 classes):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Per operation: ${(totalTime / iterations).toFixed(3)}ms`);
      console.log(
        `   Per class: ${((totalTime / (iterations * 100)) * 1000).toFixed(
          3
        )}μs`
      );

      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe("Class Manipulation Performance", () => {
    it("should add classes efficiently", () => {
      const iterations = 50000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        addClass(element, "button primary");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n➕ addClass Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should add single classes efficiently", () => {
      const iterations = 75000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        addClass(element, "active");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n⚡ addClass Single Class (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should remove classes efficiently", () => {
      const iterations = 50000;
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement("div");
        el.className = "mtrl-button mtrl-primary mtrl-large";
        return el;
      });

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        removeClass(element, "primary");
        // Re-add for next iteration
        addClass(element, "primary");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n➖ removeClass Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(3000);
    });

    it("should toggle classes efficiently", () => {
      const iterations = 50000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        toggleClass(element, "active");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔄 toggleClass Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should check classes efficiently", () => {
      const iterations = 100000;
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement("div");
        el.className = "mtrl-button mtrl-primary mtrl-large";
        return el;
      });

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        hasClass(element, "primary");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔍 hasClass Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe("Real-World Usage Patterns", () => {
    it("should handle component state changes efficiently", () => {
      const iterations = 10000;
      const elements = Array.from({ length: 50 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];

        // Typical component state change pattern
        addClass(element, "button primary");

        if (i % 3 === 0) {
          addClass(element, "disabled");
        }

        if (i % 5 === 0) {
          toggleClass(element, "active");
        }

        if (i % 7 === 0) {
          removeClass(element, "primary");
          addClass(element, "secondary");
        }

        // Check state
        const isActive = hasClass(element, "active");
        if (isActive && i % 10 === 0) {
          removeClass(element, "active");
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎯 Component State Changes (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });

    it("should handle batch class operations efficiently", () => {
      const iterations = 5000;
      const elements = Array.from({ length: 20 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Batch operations on multiple elements
        elements.forEach((element, index) => {
          addClass(element, `item-${index % 5}`, "batch-processed");
          if (index % 2 === 0) {
            toggleClass(element, "even");
          }
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n📦 Batch Class Operations (${iterations} batches × 20 elements):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Per batch: ${(totalTime / iterations).toFixed(3)}ms`);
      console.log(
        `   Per element: ${((totalTime / (iterations * 20)) * 1000).toFixed(
          3
        )}μs`
      );
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} batches/sec`
      );

      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe("Edge Cases and Stress Tests", () => {
    it("should handle rapid class changes efficiently", () => {
      const iterations = 25000;
      const element = document.createElement("div");

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        addClass(element, `dynamic-${i % 10}`);
        if (i % 100 === 0) {
          // Clear some classes periodically
          removeClass(element, "dynamic-0", "dynamic-1", "dynamic-2");
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🚀 Rapid Class Changes (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Final classes: ${element.classList.length}`);

      expect(totalTime).toBeLessThan(5000);
    });

    it("should handle complex class combinations efficiently", () => {
      const iterations = 5000;
      const elements = Array.from({ length: 10 }, () =>
        document.createElement("div")
      );

      const complexClasses = [
        "btn btn-primary btn-lg",
        ["card", "card-elevated", "card-interactive"],
        "form form-group form-control",
        ["nav", "nav-item", "nav-link", "active"],
        "table table-striped table-hover",
      ];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        const classSet = complexClasses[i % complexClasses.length];

        if (Array.isArray(classSet)) {
          addClass(element, ...classSet);
        } else {
          addClass(element, classSet);
        }

        // Some validation
        if (i % 100 === 0) {
          hasClass(element, "primary");
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🧩 Complex Class Combinations (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(10000);
    });
  });
});
