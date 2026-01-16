// test/components/button-group/button-group.test.ts

import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { JSDOM } from "jsdom";

// Set up JSDOM environment
let dom: JSDOM;
let document: Document;

beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost",
  });
  document = dom.window.document;
  (global as any).document = document;
  (global as any).window = dom.window;
  (global as any).HTMLElement = dom.window.HTMLElement;
  (global as any).Element = dom.window.Element;
  (global as any).Node = dom.window.Node;
  (global as any).Event = dom.window.Event;
  (global as any).MouseEvent = dom.window.MouseEvent;
  (global as any).CustomEvent = dom.window.CustomEvent;

  // Mock requestAnimationFrame for JSDOM
  (global as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 0);
  };
  (global as any).cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
});

afterEach(() => {
  dom.window.close();
});

// Import after setting up JSDOM
import createButtonGroup from "../../../src/components/button-group/button-group";
import {
  BUTTON_GROUP_DEFAULTS,
  BUTTON_GROUP_VARIANTS,
  BUTTON_GROUP_ORIENTATIONS,
  BUTTON_GROUP_DENSITY,
} from "../../../src/components/button-group/constants";

describe("Button Group Component", () => {
  describe("Creation", () => {
    it("should create a button group with default configuration", () => {
      const buttonGroup = createButtonGroup({
        buttons: [
          { text: "Button 1" },
          { text: "Button 2" },
          { text: "Button 3" },
        ],
      });

      expect(buttonGroup).toBeDefined();
      expect(buttonGroup.element).toBeDefined();
      expect(buttonGroup.element.tagName.toLowerCase()).toBe("div");
      expect(buttonGroup.buttons.length).toBe(3);
    });

    it("should create a button group with empty buttons array", () => {
      const buttonGroup = createButtonGroup({
        buttons: [],
      });

      expect(buttonGroup).toBeDefined();
      expect(buttonGroup.buttons.length).toBe(0);
    });

    it("should apply default variant (outlined)", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
      });

      expect(buttonGroup.getVariant()).toBe(BUTTON_GROUP_DEFAULTS.VARIANT);
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--outlined"),
      ).toBe(true);
    });

    it("should apply default orientation (horizontal)", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
      });

      expect(buttonGroup.getOrientation()).toBe(
        BUTTON_GROUP_DEFAULTS.ORIENTATION,
      );
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--horizontal"),
      ).toBe(true);
    });

    it('should set role="group" for accessibility', () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
      });

      expect(buttonGroup.element.getAttribute("role")).toBe("group");
    });

    it("should set aria-label when provided", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        ariaLabel: "Text formatting options",
      });

      expect(buttonGroup.element.getAttribute("aria-label")).toBe(
        "Text formatting options",
      );
    });
  });

  describe("Variants", () => {
    it("should apply filled variant", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        variant: "filled",
      });

      expect(buttonGroup.getVariant()).toBe("filled");
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--filled"),
      ).toBe(true);
    });

    it("should apply tonal variant", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        variant: "tonal",
      });

      expect(buttonGroup.getVariant()).toBe("tonal");
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--tonal"),
      ).toBe(true);
    });

    it("should apply elevated variant", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        variant: "elevated",
      });

      expect(buttonGroup.getVariant()).toBe("elevated");
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--elevated"),
      ).toBe(true);
    });

    it("should apply text variant", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        variant: "text",
      });

      expect(buttonGroup.getVariant()).toBe("text");
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--text"),
      ).toBe(true);
    });

    it("should change variant dynamically", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        variant: "outlined",
      });

      buttonGroup.setVariant("filled");

      expect(buttonGroup.getVariant()).toBe("filled");
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--filled"),
      ).toBe(true);
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--outlined"),
      ).toBe(false);
    });
  });

  describe("Orientation", () => {
    it("should apply vertical orientation", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        orientation: "vertical",
      });

      expect(buttonGroup.getOrientation()).toBe("vertical");
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--vertical"),
      ).toBe(true);
    });

    it("should change orientation dynamically", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        orientation: "horizontal",
      });

      buttonGroup.setOrientation("vertical");

      expect(buttonGroup.getOrientation()).toBe("vertical");
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--vertical"),
      ).toBe(true);
      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--horizontal"),
      ).toBe(false);
    });
  });

  describe("Density", () => {
    it("should apply comfortable density", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        density: "comfortable",
      });

      expect(buttonGroup.getDensity()).toBe("comfortable");
      expect(
        buttonGroup.element.classList.contains(
          "mtrl-button-group--density-comfortable",
        ),
      ).toBe(true);
    });

    it("should apply compact density", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        density: "compact",
      });

      expect(buttonGroup.getDensity()).toBe("compact");
      expect(
        buttonGroup.element.classList.contains(
          "mtrl-button-group--density-compact",
        ),
      ).toBe(true);
    });

    it("should change density dynamically", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        density: "default",
      });

      buttonGroup.setDensity("compact");

      expect(buttonGroup.getDensity()).toBe("compact");
      expect(
        buttonGroup.element.classList.contains(
          "mtrl-button-group--density-compact",
        ),
      ).toBe(true);
    });
  });

  describe("Button Access", () => {
    it("should get button by index", () => {
      const buttonGroup = createButtonGroup({
        buttons: [
          { text: "Button 1" },
          { text: "Button 2" },
          { text: "Button 3" },
        ],
      });

      const button = buttonGroup.getButton(1);
      expect(button).toBeDefined();
      expect(button?.getText()).toBe("Button 2");
    });

    it("should return undefined for invalid index", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
      });

      expect(buttonGroup.getButton(99)).toBeUndefined();
    });

    it("should get button by id", () => {
      const buttonGroup = createButtonGroup({
        buttons: [
          { text: "Button 1", id: "btn-1" },
          { text: "Button 2", id: "btn-2" },
        ],
      });

      const button = buttonGroup.getButtonById("btn-2");
      expect(button).toBeDefined();
      expect(button?.getText()).toBe("Button 2");
    });

    it("should get button by value", () => {
      const buttonGroup = createButtonGroup({
        buttons: [
          { text: "Button 1", value: "value-1" },
          { text: "Button 2", value: "value-2" },
        ],
      });

      const button = buttonGroup.getButtonById("value-2");
      expect(button).toBeDefined();
      expect(button?.getText()).toBe("Button 2");
    });
  });

  describe("Disabled State", () => {
    it("should disable entire button group", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Button 1" }, { text: "Button 2" }],
      });

      buttonGroup.disable();

      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--disabled"),
      ).toBe(true);
    });

    it("should enable entire button group", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
        disabled: true,
      });

      buttonGroup.enable();

      expect(
        buttonGroup.element.classList.contains("mtrl-button-group--disabled"),
      ).toBe(false);
    });

    it("should disable individual button", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Button 1" }, { text: "Button 2" }],
      });

      buttonGroup.disableButton(0);

      const button = buttonGroup.getButton(0);
      expect(button?.disabled?.isDisabled()).toBe(true);
    });

    it("should enable individual button", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Button 1", disabled: true }, { text: "Button 2" }],
      });

      buttonGroup.enableButton(0);

      const button = buttonGroup.getButton(0);
      expect(button?.disabled?.isDisabled()).toBe(false);
    });
  });

  describe("Events", () => {
    it("should emit click event when button is clicked", () => {
      let clickedIndex = -1;
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Button 1" }, { text: "Button 2" }],
      });

      buttonGroup.on("click", (event) => {
        clickedIndex = event.index;
      });

      // Simulate click on second button
      const button = buttonGroup.buttons[1];
      button.element.click();

      expect(clickedIndex).toBe(1);
    });

    it("should include button reference in event", () => {
      let eventButton: any = null;
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
      });

      buttonGroup.on("click", (event) => {
        eventButton = event.button;
      });

      buttonGroup.buttons[0].element.click();

      expect(eventButton).toBe(buttonGroup.buttons[0]);
    });

    it("should remove event listener with off()", () => {
      let clickCount = 0;
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
      });

      const handler = () => {
        clickCount++;
      };

      buttonGroup.on("click", handler);
      buttonGroup.buttons[0].element.click();
      expect(clickCount).toBe(1);

      buttonGroup.off("click", handler);
      buttonGroup.buttons[0].element.click();
      expect(clickCount).toBe(1); // Should not increment
    });
  });

  describe("Equal Width", () => {
    it("should apply equal-width class when enabled", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Short" }, { text: "Much Longer Button" }],
        equalWidth: true,
      });

      expect(
        buttonGroup.element.classList.contains(
          "mtrl-button-group--equal-width",
        ),
      ).toBe(true);
    });
  });

  describe("Button Position Classes", () => {
    it("should add position classes to buttons", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "First" }, { text: "Middle" }, { text: "Last" }],
      });

      expect(
        buttonGroup.buttons[0].element.classList.contains(
          "mtrl-button-group__button--first",
        ),
      ).toBe(true);
      expect(
        buttonGroup.buttons[1].element.classList.contains(
          "mtrl-button-group__button--middle",
        ),
      ).toBe(true);
      expect(
        buttonGroup.buttons[2].element.classList.contains(
          "mtrl-button-group__button--last",
        ),
      ).toBe(true);
    });

    it("should add single class when only one button", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Only" }],
      });

      expect(
        buttonGroup.buttons[0].element.classList.contains(
          "mtrl-button-group__button--single",
        ),
      ).toBe(true);
    });
  });

  describe("Destroy", () => {
    it("should clean up on destroy", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Button 1" }, { text: "Button 2" }],
      });

      const buttonCount = buttonGroup.buttons.length;
      expect(buttonCount).toBe(2);

      buttonGroup.destroy();

      expect(buttonGroup.buttons.length).toBe(0);
    });
  });

  describe("Chaining", () => {
    it("should support method chaining", () => {
      const buttonGroup = createButtonGroup({
        buttons: [{ text: "Test" }],
      });

      const result = buttonGroup
        .setVariant("filled")
        .setOrientation("vertical")
        .setDensity("compact")
        .disable()
        .enable();

      expect(result).toBe(buttonGroup);
    });
  });
});
