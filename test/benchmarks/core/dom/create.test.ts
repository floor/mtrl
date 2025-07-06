import { expect, describe, it } from "bun:test";
import { JSDOM } from "jsdom";

// Set up DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.SVGElement = dom.window.SVGElement;

// Import DOM create utilities
import {
  createElement,
  createSVGElement,
  createElementPooled,
  releaseElement,
  removeEventHandlers,
} from "../../../../src/core/dom/create";

describe("DOM Create Performance Benchmarks", () => {
  describe("createElement Fast Path Performance", () => {
    it("should handle empty options efficiently", () => {
      const iterations = 100000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        createElement();
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🚀 createElement - Empty Options (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should handle tag-only options efficiently", () => {
      const iterations = 75000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        createElement({ tag: "span" });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎯 createElement - Tag Only (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should handle simple content efficiently", () => {
      const iterations = 50000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        createElement({
          tag: "div",
          text: "Hello",
          className: "message",
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n📝 createElement - Simple Content (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should handle complex elements efficiently", () => {
      const iterations = 25000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        createElement({
          tag: "button",
          className: "button primary large",
          text: `Button ${i}`,
          attributes: {
            role: "button",
            tabindex: "0",
            "data-id": `btn-${i}`,
          },
          data: {
            component: "button",
            index: i.toString(),
          },
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔧 createElement - Complex Elements (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe("Element Pool Performance", () => {
    it("should handle pooled element creation efficiently", () => {
      const iterations = 50000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = createElementPooled({
          tag: "div",
          className: "pooled-item",
          text: `Item ${i}`,
        });

        // Release every 10th element to test pool reuse
        if (i % 10 === 0) {
          releaseElement(element);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n♻️  createElementPooled Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );
      console.log(`   Pool reuse: 10% of elements`);

      expect(totalTime).toBeLessThan(3000);
    });

    it("should demonstrate pool reuse efficiency", () => {
      const iterations = 10000;
      const elements: HTMLElement[] = [];

      // Create elements
      const createStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElementPooled({
          tag: "div",
          className: "test-item",
        });
        elements.push(element);
      }
      const createTime = performance.now() - createStart;

      // Release all elements
      const releaseStart = performance.now();
      elements.forEach(releaseElement);
      const releaseTime = performance.now() - releaseStart;

      // Recreate from pool
      const reuseStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        createElementPooled({
          tag: "div",
          className: "reused-item",
        });
      }
      const reuseTime = performance.now() - reuseStart;

      console.log(`\n🔄 Pool Reuse Efficiency (${iterations} ops):`);
      console.log(`   Initial creation: ${createTime.toFixed(2)}ms`);
      console.log(`   Release time: ${releaseTime.toFixed(2)}ms`);
      console.log(`   Reuse time: ${reuseTime.toFixed(2)}ms`);
      console.log(
        `   Reuse improvement: ${(
          ((createTime - reuseTime) / createTime) *
          100
        ).toFixed(1)}%`
      );

      // Note: Pooling may have slight overhead for simple cases due to pool management
      // But should be within 20% of direct creation time
      expect(reuseTime).toBeLessThan(createTime * 1.2);
    });
  });

  describe("SVG Element Performance", () => {
    it("should create SVG elements efficiently", () => {
      const iterations = 25000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        createSVGElement({
          tag: "circle",
          attributes: {
            cx: "50",
            cy: "50",
            r: "25",
            fill: "blue",
          },
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎨 createSVGElement Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });

    it("should create complex SVG structures efficiently", () => {
      const iterations = 5000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Create an SVG container
        const svg = createSVGElement({
          tag: "svg",
          attributes: {
            width: "100",
            height: "100",
            viewBox: "0 0 100 100",
          },
        });

        // Add multiple child elements
        const circle = createSVGElement({
          tag: "circle",
          attributes: {
            cx: "50",
            cy: "50",
            r: "20",
          },
          container: svg,
        });

        const text = createSVGElement({
          tag: "text",
          attributes: {
            x: "50",
            y: "55",
            "text-anchor": "middle",
          },
          text: `Item ${i}`,
          container: svg,
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🖼️  Complex SVG Structures (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Per structure: ${(totalTime / iterations).toFixed(3)}ms`);
      console.log(`   Elements per structure: 3`);
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} structures/sec`
      );

      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe("Real-World Component Creation", () => {
    it("should create button components efficiently", () => {
      const iterations = 15000;
      const container = document.createElement("div");

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        createElement({
          tag: "button",
          className: "button primary",
          text: `Button ${i}`,
          attributes: {
            type: "button",
            role: "button",
            tabindex: "0",
            "aria-label": `Action button ${i}`,
          },
          data: {
            component: "button",
            id: i.toString(),
            initialized: "true",
          },
          container: i % 100 === 0 ? container : undefined, // Occasionally append
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔘 Button Component Creation (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per component: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} components/sec`
      );
      console.log(`   Container appends: ${Math.floor(iterations / 100)}`);

      expect(totalTime).toBeLessThan(10000);
    });

    it("should create card components efficiently", () => {
      const iterations = 8000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const card = createElement({
          tag: "div",
          className: "card elevated",
          attributes: {
            role: "article",
            "aria-labelledby": `card-title-${i}`,
          },
        });

        const header = createElement({
          tag: "div",
          className: "card-header",
          container: card,
        });

        const title = createElement({
          tag: "h3",
          className: "card-title",
          text: `Card Title ${i}`,
          attributes: {
            id: `card-title-${i}`,
          },
          container: header,
        });

        const content = createElement({
          tag: "div",
          className: "card-content",
          html: `<p>This is card content for item ${i}. It contains some <strong>HTML</strong> content.</p>`,
          container: card,
        });

        const actions = createElement({
          tag: "div",
          className: "card-actions",
          container: card,
        });

        const actionButton = createElement({
          tag: "button",
          className: "button text",
          text: "Action",
          attributes: {
            type: "button",
          },
          container: actions,
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🃏 Card Component Creation (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Per card: ${(totalTime / iterations).toFixed(3)}ms`);
      console.log(`   Elements per card: 6`);
      console.log(`   Total elements: ${iterations * 6}`);
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} cards/sec`
      );

      expect(totalTime).toBeLessThan(15000);
    });

    it("should create form components efficiently", () => {
      const iterations = 5000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const form = createElement({
          tag: "form",
          className: "form",
          attributes: {
            novalidate: "true",
            "data-form-id": i.toString(),
          },
        });

        // Text field
        const textField = createElement({
          tag: "div",
          className: "textfield",
          container: form,
        });

        const textInput = createElement({
          tag: "input",
          attributes: {
            type: "text",
            name: `field-${i}`,
            id: `field-${i}`,
            placeholder: "Enter text",
            "aria-label": "Text input",
          },
          container: textField,
        });

        const textLabel = createElement({
          tag: "label",
          text: "Text Field",
          attributes: {
            for: `field-${i}`,
          },
          container: textField,
        });

        // Select field
        const selectField = createElement({
          tag: "div",
          className: "select",
          container: form,
        });

        const select = createElement({
          tag: "select",
          attributes: {
            name: `select-${i}`,
            id: `select-${i}`,
          },
          container: selectField,
        });

        // Add options
        for (let j = 0; j < 3; j++) {
          createElement({
            tag: "option",
            text: `Option ${j + 1}`,
            attributes: {
              value: `option-${j + 1}`,
            },
            container: select,
          });
        }

        // Submit button
        const submitButton = createElement({
          tag: "button",
          className: "button primary",
          text: "Submit",
          attributes: {
            type: "submit",
          },
          container: form,
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n📝 Form Component Creation (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Per form: ${(totalTime / iterations).toFixed(3)}ms`);
      console.log(`   Elements per form: 9 (including 3 options)`);
      console.log(`   Total elements: ${iterations * 9}`);
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} forms/sec`
      );

      expect(totalTime).toBeLessThan(20000);
    });
  });

  describe("Event Handling Performance", () => {
    it("should handle event forwarding efficiently", () => {
      const iterations = 25000;
      let eventCount = 0;

      const mockContext = {
        emit: (event: string, data: any) => {
          eventCount++;
        },
      };

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        createElement({
          tag: "button",
          text: `Button ${i}`,
          forwardEvents: {
            click: true,
            mouseenter: (context, event) => i % 2 === 0,
            focus: true,
          },
          context: mockContext,
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎪 Event Forwarding Setup (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per element: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Events per element: 3`);
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} elements/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });

    it("should handle event cleanup efficiently", () => {
      const iterations = 50000;
      const elements: HTMLElement[] = [];

      // Create elements with event handlers
      const createStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        const element = createElement({
          tag: "div",
          forwardEvents: {
            click: true,
            mouseenter: true,
          },
          context: { emit: () => {} },
        });
        elements.push(element);
      }
      const createTime = performance.now() - createStart;

      // Clean up event handlers
      const cleanupStart = performance.now();
      elements.forEach(removeEventHandlers);
      const cleanupTime = performance.now() - cleanupStart;

      console.log(`\n🧹 Event Handler Cleanup (${iterations} ops):`);
      console.log(`   Creation time: ${createTime.toFixed(2)}ms`);
      console.log(`   Cleanup time: ${cleanupTime.toFixed(2)}ms`);
      console.log(
        `   Cleanup per element: ${((cleanupTime / iterations) * 1000).toFixed(
          3
        )}μs`
      );
      console.log(
        `   Cleanup throughput: ${Math.round(
          iterations / (cleanupTime / 1000)
        )} elements/sec`
      );

      expect(cleanupTime).toBeLessThan(2000);
    });
  });

  describe("Stress Tests", () => {
    it("should handle rapid element creation", () => {
      const iterations = 100000;
      const elements: HTMLElement[] = [];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = createElement({
          tag: i % 2 === 0 ? "div" : "span",
          className: `item-${i % 10}`,
          text: i % 100 === 0 ? `Item ${i}` : undefined,
          attributes: i % 50 === 0 ? { "data-index": i.toString() } : undefined,
        });

        elements.push(element);

        // Periodic cleanup
        if (i % 10000 === 0 && i > 0) {
          elements.splice(0, 5000); // Remove some elements
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🚀 Rapid Element Creation (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per element: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} elements/sec`
      );
      console.log(`   Final element count: ${elements.length}`);

      expect(totalTime).toBeLessThan(10000);
    });

    it("should handle mixed operation patterns", () => {
      const iterations = 25000;
      const containers = Array.from({ length: 10 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const operationType = i % 4;
        const container = containers[i % containers.length];

        switch (operationType) {
          case 0: // Simple element
            createElement({
              tag: "div",
              className: "simple",
            });
            break;

          case 1: // Complex element
            createElement({
              tag: "button",
              className: "button primary",
              text: "Action",
              attributes: { type: "button" },
              container,
            });
            break;

          case 2: // Pooled element
            const pooled = createElementPooled({
              tag: "span",
              className: "pooled-item",
            });
            if (i % 20 === 0) {
              releaseElement(pooled);
            }
            break;

          case 3: // SVG element
            createSVGElement({
              tag: "circle",
              attributes: { r: "10" },
            });
            break;
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎭 Mixed Operation Patterns (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Operation types: 4 different patterns`);
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(15000);
    });
  });
});
