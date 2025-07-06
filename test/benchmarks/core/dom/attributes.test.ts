import { expect, describe, it } from "bun:test";
import { JSDOM } from "jsdom";

// Set up DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Import DOM attributes utilities
import {
  setAttributes,
  removeAttributes,
  batchAttributes,
  hasAttribute,
  getAttribute,
} from "../../../../src/core/dom/attributes";

describe("DOM Attributes Performance Benchmarks", () => {
  describe("setAttributes Performance", () => {
    it("should set single attributes efficiently", () => {
      const iterations = 75000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        setAttributes(element, { "data-id": `item-${i}` });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n🏷️  setAttributes - Single Attribute (${iterations} ops):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should set multiple attributes efficiently", () => {
      const iterations = 50000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const attributes = {
        "data-id": "test-id",
        "aria-label": "Test Label",
        role: "button",
        tabindex: "0",
      };

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        setAttributes(element, attributes);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n🏷️  setAttributes - Multiple Attributes (${iterations} ops):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should set many attributes efficiently", () => {
      const iterations = 10000;
      const elements = Array.from({ length: 50 }, () =>
        document.createElement("div")
      );

      const manyAttributes = Object.fromEntries(
        Array.from({ length: 15 }, (_, i) => [`data-attr-${i}`, `value-${i}`])
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        setAttributes(element, manyAttributes);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n🏷️  setAttributes - Many Attributes (${iterations} ops × 15 attrs):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Per attribute: ${((totalTime / (iterations * 15)) * 1000).toFixed(
          3
        )}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });

    it("should handle empty attributes gracefully", () => {
      const iterations = 100000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        setAttributes(element, {});
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔄 setAttributes - Empty Attributes (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );

      expect(totalTime).toBeLessThan(500);
    });

    it("should handle null/undefined values correctly", () => {
      const iterations = 50000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const attributesWithNulls = {
        "data-valid": "value",
        "data-null": null,
        "data-undefined": undefined,
        "data-empty": "",
        "data-zero": 0,
      };

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        setAttributes(element, attributesWithNulls);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n🔍 setAttributes - Null/Undefined Handling (${iterations} ops):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe("removeAttributes Performance", () => {
    it("should remove single attributes efficiently", () => {
      const iterations = 75000;
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement("div");
        el.setAttribute("data-test", "value");
        return el;
      });

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        removeAttributes(element, ["data-test"]);
        // Re-add for next iteration
        element.setAttribute("data-test", "value");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n🗑️  removeAttributes - Single Attribute (${iterations} ops):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(3000);
    });

    it("should remove multiple attributes efficiently", () => {
      const iterations = 50000;
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement("div");
        el.setAttribute("data-id", "test");
        el.setAttribute("aria-label", "Test");
        el.setAttribute("role", "button");
        return el;
      });

      const attributesToRemove = ["data-id", "aria-label", "role"];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        removeAttributes(element, attributesToRemove);
        // Re-add for next iteration
        setAttributes(element, {
          "data-id": "test",
          "aria-label": "Test",
          role: "button",
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n🗑️  removeAttributes - Multiple Attributes (${iterations} ops):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });

    it("should handle empty attribute lists gracefully", () => {
      const iterations = 100000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        removeAttributes(element, []);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔄 removeAttributes - Empty List (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );

      expect(totalTime).toBeLessThan(500);
    });

    it("should remove many attributes efficiently", () => {
      const iterations = 5000;
      const manyAttributes = Array.from(
        { length: 20 },
        (_, i) => `data-attr-${i}`
      );

      const elements = Array.from({ length: 20 }, () => {
        const el = document.createElement("div");
        manyAttributes.forEach((attr) => el.setAttribute(attr, "value"));
        return el;
      });

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        removeAttributes(element, manyAttributes);
        // Re-add for next iteration
        manyAttributes.forEach((attr) => element.setAttribute(attr, "value"));
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n🗑️  removeAttributes - Many Attributes (${iterations} ops × 20 attrs):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Per attribute: ${((totalTime / (iterations * 20)) * 1000).toFixed(
          3
        )}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe("New Utility Functions Performance", () => {
    it("should perform batchAttributes efficiently", () => {
      const iterations = 25000;
      const elements = Array.from({ length: 50 }, () =>
        document.createElement("div")
      );

      const operations = [
        { action: "set" as const, key: "data-id", value: "test" },
        { action: "set" as const, key: "aria-label", value: "Test Label" },
        { action: "set" as const, key: "role", value: "button" },
        { action: "remove" as const, key: "data-old" },
        { action: "set" as const, key: "tabindex", value: "0" },
      ];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        batchAttributes(element, operations);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n⚡ batchAttributes Performance (${iterations} ops × 5 operations):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Per sub-operation: ${(
          (totalTime / (iterations * 5)) *
          1000
        ).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });

    it("should perform hasAttribute efficiently", () => {
      const iterations = 200000;
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement("div");
        el.setAttribute("data-test", "value");
        el.setAttribute("aria-label", "Test");
        return el;
      });

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        hasAttribute(element, i % 2 === 0 ? "data-test" : "nonexistent");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔍 hasAttribute Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(1000);
    });

    it("should perform getAttribute efficiently", () => {
      const iterations = 150000;
      const elements = Array.from({ length: 100 }, () => {
        const el = document.createElement("div");
        el.setAttribute("data-value", "test-value");
        el.setAttribute("aria-label", "Test Label");
        return el;
      });

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        getAttribute(element, "data-value", "default");
        getAttribute(element, "nonexistent", "fallback");
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n📄 getAttribute Performance (${iterations} ops):`);
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
    it("should handle component initialization efficiently", () => {
      const iterations = 10000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = document.createElement("div");

        // Typical component initialization
        setAttributes(element, {
          role: "button",
          tabindex: "0",
          "aria-label": `Button ${i}`,
          "data-id": `btn-${i}`,
          "data-component": "button",
          "data-initialized": "true",
        });

        // Some validation
        if (i % 100 === 0) {
          const hasRole = hasAttribute(element, "role");
          const id = getAttribute(element, "data-id", "");
          expect(hasRole).toBe(true);
          expect(id).toBe(`btn-${i}`);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🏗️  Component Initialization (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(10000);
    });

    it("should handle form validation efficiently", () => {
      const iterations = 15000;
      const forms = Array.from({ length: 20 }, () => {
        const form = document.createElement("form");
        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("name", "test");
        form.appendChild(input);
        return { form, input };
      });

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const { form, input } = forms[i % forms.length];

        // Validation pattern
        const isValid = i % 3 !== 0;

        if (isValid) {
          removeAttributes(input, ["aria-invalid", "aria-describedby"]);
          setAttributes(input, { "aria-valid": "true" });
        } else {
          setAttributes(input, {
            "aria-invalid": "true",
            "aria-describedby": "error-message",
          });
          removeAttributes(input, ["aria-valid"]);
        }

        // Check state
        if (i % 200 === 0) {
          const isInvalid = hasAttribute(input, "aria-invalid");
          const errorId = getAttribute(input, "aria-describedby", "");
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n✅ Form Validation Pattern (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(10000);
    });

    it("should handle batch attribute updates efficiently", () => {
      const iterations = 5000;
      const elements = Array.from({ length: 50 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Batch operations on multiple elements
        elements.forEach((element, index) => {
          setAttributes(element, {
            "data-index": index.toString(),
            "data-batch": i.toString(),
            "data-processed": "true",
          });

          if (index % 2 === 0) {
            setAttributes(element, { "data-even": "true" });
          } else {
            removeAttributes(element, ["data-even"]);
          }
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n📦 Batch Attribute Updates (${iterations} batches × 50 elements):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Per batch: ${(totalTime / iterations).toFixed(3)}ms`);
      console.log(
        `   Per element: ${((totalTime / (iterations * 50)) * 1000).toFixed(
          3
        )}μs`
      );
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} batches/sec`
      );

      expect(totalTime).toBeLessThan(15000);
    });
  });
});
