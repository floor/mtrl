import { expect, describe, it, beforeAll } from "bun:test";
import { JSDOM } from "jsdom";

// Set up DOM environment
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;

// Import DOM utils
import {
  normalizeClasses,
  createElement as utilsCreateElement,
  setStyles,
  matches,
  closest,
} from "../../../../src/core/dom/utils";

describe("DOM Utils Performance Benchmarks", () => {
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

      expect(totalTime).toBeLessThan(1000);
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
  });

  describe("Utils createElement Performance", () => {
    it("should create simple elements efficiently", () => {
      const iterations = 50000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        utilsCreateElement("div", {
          className: "test-class",
          "data-index": i.toString(),
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🏗️  utils createElement - Simple (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(3000);
    });

    it("should handle complex attributes efficiently", () => {
      const iterations = 25000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        utilsCreateElement("button", {
          className: "btn btn-primary",
          style: {
            width: "100px",
            height: "40px",
            backgroundColor: "blue",
          },
          data: {
            id: i.toString(),
            component: "button",
            initialized: "true",
          },
          onClick: () => {},
          "aria-label": `Button ${i}`,
          tabIndex: 0,
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔧 utils createElement - Complex (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });

    it("should handle children creation efficiently", () => {
      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const child1 = utilsCreateElement("span", { className: "child-1" });
        const child2 = utilsCreateElement("span", { className: "child-2" });

        utilsCreateElement("div", {
          className: "parent",
          children: [
            child1,
            child2,
            `Text node ${i}`,
            null, // Should be handled gracefully
            undefined,
          ],
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `\n👨‍👩‍👧‍👦 utils createElement - With Children (${iterations} ops):`
      );
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Elements per operation: 3 (parent + 2 children)`);
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(10000);
    });
  });

  describe("setStyles Performance", () => {
    it("should set styles efficiently", () => {
      const iterations = 100000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const styles = {
        width: "100px",
        height: "50px",
        backgroundColor: "red",
        border: "1px solid black",
      };

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        setStyles(element, styles);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎨 setStyles Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Styles per operation: 4`);
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000); // Adjust expectation for JSDOM performance
    });

    it("should handle many styles efficiently", () => {
      const iterations = 25000;
      const elements = Array.from({ length: 50 }, () =>
        document.createElement("div")
      );

      const manyStyles = {
        width: "200px",
        height: "100px",
        backgroundColor: "blue",
        border: "2px solid red",
        margin: "10px",
        padding: "15px",
        fontSize: "14px",
        fontWeight: "bold",
        color: "white",
        textAlign: "center" as const,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        borderRadius: "8px",
      };

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        setStyles(element, manyStyles);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎨 setStyles - Many Styles (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Styles per operation: 15`);
      console.log(
        `   Per style: ${((totalTime / (iterations * 15)) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe("DOM Query Performance", () => {
    beforeAll(() => {
      // Set up a test DOM structure
      document.body.innerHTML = `
        <div class="container">
          <div class="card" data-type="content">
            <h2 class="title">Card Title</h2>
            <p class="content">Card content</p>
            <div class="actions">
              <button class="btn btn-primary">Action</button>
            </div>
          </div>
          <div class="card" data-type="sidebar">
            <h3 class="title">Sidebar</h3>
            <ul class="nav">
              <li class="nav-item"><a href="#" class="nav-link">Link 1</a></li>
              <li class="nav-item"><a href="#" class="nav-link">Link 2</a></li>
            </ul>
          </div>
        </div>
      `;
    });

    it("should perform matches efficiently", () => {
      const iterations = 200000;
      const elements = Array.from(document.querySelectorAll("*"));
      const selectors = [".card", ".btn", "[data-type]", "h2", ".nav-link"];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];
        const selector = selectors[i % selectors.length];
        matches(element, selector);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎯 matches Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Elements tested: ${elements.length}`);
      console.log(`   Selectors tested: ${selectors.length}`);
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });

    it("should perform closest efficiently", () => {
      const iterations = 100000;
      const startElements = Array.from(
        document.querySelectorAll(".nav-link, .btn, .content")
      );
      const selectors = [".card", ".container", ".actions", ".nav", "div"];

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = startElements[i % startElements.length];
        const selector = selectors[i % selectors.length];
        closest(element, selector);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔍 closest Performance (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Start elements: ${startElements.length}`);
      console.log(`   Selectors tested: ${selectors.length}`);
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(2000);
    });
  });

  describe("Real-World Usage Patterns", () => {
    it("should handle component styling efficiently", () => {
      const iterations = 15000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Create a styled component
        const button = utilsCreateElement("button", {
          className: "btn btn-primary",
          "data-component": "button",
          "aria-label": `Action ${i}`,
        });

        // Apply dynamic styles
        const isLarge = i % 3 === 0;
        const isDanger = i % 5 === 0;

        setStyles(button, {
          width: isLarge ? "150px" : "100px",
          height: isLarge ? "50px" : "36px",
          backgroundColor: isDanger ? "#dc3545" : "#007bff",
          border: isDanger ? "2px solid #bd2130" : "1px solid #0056b3",
          borderRadius: "4px",
          color: "white",
          cursor: "pointer",
        });

        // Check if it matches certain patterns
        if (i % 100 === 0) {
          const isButton = matches(button, "button");
          const container = closest(button, ".container");
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🎨 Component Styling Pattern (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per component: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Operations per component: ~10`);
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} components/sec`
      );

      expect(totalTime).toBeLessThan(10000);
    });

    it("should handle form building efficiently", () => {
      const iterations = 5000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Create form container
        const form = utilsCreateElement("form", {
          className: "form",
          style: {
            maxWidth: "400px",
            margin: "0 auto",
            padding: "20px",
          },
        });

        // Create form fields
        const fields = ["name", "email", "phone"];

        fields.forEach((fieldName, index) => {
          const fieldContainer = utilsCreateElement("div", {
            className: "field-container",
            style: {
              marginBottom: "15px",
            },
          });

          const label = utilsCreateElement("label", {
            className: "field-label",
            children: [fieldName.charAt(0).toUpperCase() + fieldName.slice(1)],
            style: {
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            },
          });

          const input = utilsCreateElement("input", {
            type: fieldName === "email" ? "email" : "text",
            name: fieldName,
            className: "field-input",
            placeholder: `Enter ${fieldName}`,
            style: {
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            },
          });

          fieldContainer.appendChild(label);
          fieldContainer.appendChild(input);
          form.appendChild(fieldContainer);
        });

        // Add submit button
        const submitBtn = utilsCreateElement("button", {
          type: "submit",
          className: "submit-btn",
          children: ["Submit"],
          style: {
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: "pointer",
          },
        });

        form.appendChild(submitBtn);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n📋 Form Building Pattern (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Per form: ${(totalTime / iterations).toFixed(3)}ms`);
      console.log(`   Elements per form: 8 (form + 3 fields × 2 + button)`);
      console.log(`   Total elements: ${iterations * 8}`);
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} forms/sec`
      );

      expect(totalTime).toBeLessThan(15000);
    });

    it("should handle dynamic class management efficiently", () => {
      const iterations = 50000;
      const elements = Array.from({ length: 100 }, () =>
        document.createElement("div")
      );

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const element = elements[i % elements.length];

        // Simulate dynamic class changes
        const baseClasses = ["component", "interactive"];
        const stateClasses: string[] = [];

        if (i % 2 === 0) stateClasses.push("active");
        if (i % 3 === 0) stateClasses.push("highlighted");
        if (i % 5 === 0) stateClasses.push("disabled");
        if (i % 7 === 0) stateClasses.push("loading");

        // Normalize all classes
        const allClasses = normalizeClasses(baseClasses, stateClasses);
        element.className = allClasses.join(" ");

        // Check states
        if (i % 100 === 0) {
          const isActive = matches(element, ".active");
          const isDisabled = matches(element, ".disabled");
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔄 Dynamic Class Management (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(`   Average classes per element: 2-4`);
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe("Edge Cases and Stress Tests", () => {
    it("should handle null and undefined values gracefully", () => {
      const iterations = 50000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Test normalizeClasses with edge cases
        normalizeClasses(
          i % 2 === 0 ? "valid-class" : "",
          i % 3 === 0 ? ["array", "classes"] : [],
          i % 5 === 0 ? (null as any) : (undefined as any)
        );

        // Test createElement with edge cases
        utilsCreateElement("div", {
          className: i % 2 === 0 ? "test" : null,
          "data-value": i % 3 === 0 ? i.toString() : undefined,
          style: i % 5 === 0 ? { color: "red" } : null,
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🔄 Edge Case Handling (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(
        `   Per operation: ${((totalTime / iterations) * 1000).toFixed(3)}μs`
      );
      console.log(
        `   Throughput: ${Math.round(iterations / (totalTime / 1000))} ops/sec`
      );

      expect(totalTime).toBeLessThan(5000);
    });

    it("should handle large DOM trees efficiently", () => {
      const iterations = 1000;

      // Create a large DOM tree
      const createLargeTree = (depth: number, breadth: number): HTMLElement => {
        const root = utilsCreateElement("div", {
          className: `level-${depth}`,
          "data-depth": depth.toString(),
        });

        if (depth > 0) {
          for (let i = 0; i < breadth; i++) {
            const child = createLargeTree(depth - 1, breadth);
            root.appendChild(child);
          }
        }

        return root;
      };

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const tree = createLargeTree(4, 3); // 4 levels deep, 3 children each

        // Query the tree
        const leaves = tree.querySelectorAll(".level-0");
        const middleNodes = tree.querySelectorAll(".level-2");

        // Test matches and closest on random elements
        if (leaves.length > 0) {
          const leaf = leaves[0];
          matches(leaf, ".level-0");
          closest(leaf, ".level-4");
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`\n🌳 Large DOM Tree Operations (${iterations} ops):`);
      console.log(`   Time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Per tree: ${(totalTime / iterations).toFixed(3)}ms`);
      console.log(`   Nodes per tree: ~40 (3^4 - 1)`);
      console.log(`   Total nodes: ${iterations * 40}`);
      console.log(
        `   Throughput: ${Math.round(
          iterations / (totalTime / 1000)
        )} trees/sec`
      );

      expect(totalTime).toBeLessThan(20000);
    });
  });
});
