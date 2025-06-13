// test/core/compose/features/badge.test.ts
import { describe, test, expect, beforeEach } from "bun:test";
import { withBadge } from "../../../../src/core/compose/features/badge";
import { PREFIX } from "../../../../src/core/config";
import "../../../setup"; // Import the jsdom setup

describe("withBadge", () => {
  let component;

  beforeEach(() => {
    document.body.innerHTML = "";
    component = {
      element: document.createElement("div"),
      getClass: (name) => `${PREFIX}-${name}`,
    };
  });

  test("should not add badge if content is not provided", () => {
    const config = { prefix: PREFIX };
    const enhancedComponent = withBadge(config)(component);

    expect(enhancedComponent.badge).toBeUndefined();
  });

  test("should add badge if content is provided", () => {
    const config = {
      prefix: PREFIX,
      badge: "5",
    };
    const enhancedComponent = withBadge(config)(component);

    expect(enhancedComponent.badge).toBeDefined();
    // Check that badge has required methods (not the actual values)
    expect(typeof enhancedComponent.badge.setLabel).toBe("function");
    expect(typeof enhancedComponent.badge.getLabel).toBe("function");
    expect(enhancedComponent.badge.element).toBeDefined();
  });

  test("should create badge with position config", () => {
    const config = {
      prefix: PREFIX,
      badge: "10",
      badgeConfig: {
        position: "bottom-left",
      },
    };
    const enhancedComponent = withBadge(config)(component);

    expect(enhancedComponent.badge).toBeDefined();
    // Check that the badge has a setPosition method
    expect(typeof enhancedComponent.badge.setPosition).toBe("function");
  });

  test("should create badge with all configuration options", () => {
    const config = {
      prefix: PREFIX,
      badge: "10",
      badgeConfig: {
        color: "secondary",
        variant: "small",
        max: 99,
      },
    };
    const enhancedComponent = withBadge(config)(component);

    expect(enhancedComponent.badge).toBeDefined();
    // Check that badge has the methods we expect
    expect(typeof enhancedComponent.badge.setColor).toBe("function");
    expect(typeof enhancedComponent.badge.setVariant).toBe("function");
    expect(typeof enhancedComponent.badge.setMax).toBe("function");
  });
});
