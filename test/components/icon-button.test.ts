// test/components/icon-button.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { JSDOM } from "jsdom";
import {
  type IconButtonComponent,
  type IconButtonConfig,
} from "../../src/components/icon-button/types";
import {
  type IconButtonVariant,
  type IconButtonSize,
  type IconButtonShape,
  type IconButtonWidth,
} from "../../src/components/icon-button/constants";

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  // Create a new JSDOM instance
  dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });

  // Get window and document from jsdom
  window = dom.window;
  document = window.document;

  // Store original globals
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;

  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.HTMLButtonElement = window.HTMLButtonElement;
  global.Event = window.Event;
  global.CustomEvent = window.CustomEvent;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;

  // Clean up jsdom
  window.close();
});

// Constants for icon button variants
const ICON_BUTTON_VARIANTS = {
  FILLED: "filled",
  TONAL: "tonal",
  OUTLINED: "outlined",
  STANDARD: "standard",
} as const;

// Constants for icon button sizes
const ICON_BUTTON_SIZES = {
  XS: "xs",
  S: "s",
  M: "m",
  L: "l",
  XL: "xl",
} as const;

// Constants for icon button shapes
const ICON_BUTTON_SHAPES = {
  ROUND: "round",
  SQUARE: "square",
} as const;

// Constants for icon button widths
const ICON_BUTTON_WIDTHS = {
  NARROW: "narrow",
  DEFAULT: "default",
  WIDE: "wide",
} as const;

// Mock icon button implementation
const createMockIconButton = (
  config: IconButtonConfig = {},
): IconButtonComponent => {
  // Create the main element
  const element = document.createElement("button");
  element.className = "mtrl-icon-button";
  element.type = config.type || "button";

  // Set default configuration
  const settings = {
    componentName: "icon-button",
    prefix: config.prefix || "mtrl",
    variant: config.variant || ICON_BUTTON_VARIANTS.STANDARD,
    size: config.size || ICON_BUTTON_SIZES.S,
    shape: config.shape || ICON_BUTTON_SHAPES.ROUND,
    width: config.width || ICON_BUTTON_WIDTHS.DEFAULT,
    disabled: config.disabled || false,
    toggle: config.toggle || false,
    selected: config.selected || false,
    ripple: config.ripple !== undefined ? config.ripple : true,
  };

  // Track internal state
  let isSelected = settings.selected;
  let unselectedIcon = config.icon || "";
  let selectedIcon = config.selectedIcon || "";

  // Apply variant class
  if (settings.variant) {
    element.classList.add(`mtrl-icon-button--${settings.variant}`);
  }

  // Apply size class (only if not default 's')
  if (settings.size && settings.size !== ICON_BUTTON_SIZES.S) {
    element.classList.add(`mtrl-icon-button--${settings.size}`);
  }

  // Apply shape class (only if not default 'round')
  if (settings.shape && settings.shape !== ICON_BUTTON_SHAPES.ROUND) {
    element.classList.add(`mtrl-icon-button--${settings.shape}`);
  }

  // Apply width class (only if not default)
  if (settings.width && settings.width !== ICON_BUTTON_WIDTHS.DEFAULT) {
    element.classList.add(`mtrl-icon-button--${settings.width}`);
  }

  // Apply disabled state
  if (settings.disabled) {
    element.disabled = true;
    element.classList.add("mtrl-icon-button--disabled");
  }

  // Apply toggle mode
  if (settings.toggle) {
    element.classList.add("mtrl-icon-button--toggle");
    element.setAttribute("aria-pressed", String(isSelected));
  }

  // Apply selected state
  if (settings.toggle && isSelected) {
    element.classList.add("mtrl-icon-button--selected");
  }

  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(" ");
    classes.forEach((className) => element.classList.add(className));
  }

  // Apply value if provided
  if (config.value) {
    element.setAttribute("value", config.value);
  }

  // Apply aria-label if provided
  if (config.ariaLabel) {
    element.setAttribute("aria-label", config.ariaLabel);
  }

  // Create ripple element if enabled
  if (settings.ripple) {
    const ripple = document.createElement("span");
    ripple.className = "mtrl-ripple";
    element.appendChild(ripple);
  }

  // Create icon element if provided
  let iconElement: HTMLElement | null = null;
  if (config.icon) {
    iconElement = document.createElement("span");
    iconElement.className = "mtrl-icon mtrl-icon-button-icon";
    iconElement.innerHTML =
      isSelected && selectedIcon ? selectedIcon : unselectedIcon;
    element.appendChild(iconElement);
  }

  // Initialize icon API
  const iconAPI = {
    setIcon: (html: string) => {
      if (!iconElement) {
        iconElement = document.createElement("span");
        iconElement.className = "mtrl-icon mtrl-icon-button-icon";
        element.appendChild(iconElement);
      }
      iconElement.innerHTML = html;
      return iconAPI;
    },
    getIcon: () => (iconElement ? iconElement.innerHTML : ""),
    getElement: () => iconElement,
  };

  // Set up event handlers
  const eventHandlers: Record<string, Function[]> = {};

  // Update icon based on selection state
  const updateIcon = () => {
    if (!iconElement) return;
    const iconToShow =
      isSelected && selectedIcon ? selectedIcon : unselectedIcon;
    if (iconToShow) {
      iconElement.innerHTML = iconToShow;
    }
  };

  // Create the icon button component
  const iconButton: IconButtonComponent = {
    element,
    icon: iconAPI,

    disabled: {
      enable: () => {
        element.disabled = false;
        element.classList.remove("mtrl-icon-button--disabled");
      },
      disable: () => {
        element.disabled = true;
        element.classList.add("mtrl-icon-button--disabled");
      },
      isDisabled: () => element.disabled,
    },

    lifecycle: {
      destroy: () => {
        iconButton.destroy();
      },
    },

    getClass: (name: string) => {
      const prefix = settings.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-icon-button`;
    },

    getValue: () => element.getAttribute("value") || "",

    setValue: (value: string) => {
      element.setAttribute("value", value);
      return iconButton;
    },

    getVariant: () => {
      const variants = Object.values(ICON_BUTTON_VARIANTS);
      for (const variant of variants) {
        if (element.classList.contains(`mtrl-icon-button--${variant}`)) {
          return variant;
        }
      }
      return ICON_BUTTON_VARIANTS.STANDARD;
    },

    setVariant: (variant: IconButtonVariant | string) => {
      const variants = Object.values(ICON_BUTTON_VARIANTS);
      variants.forEach((v) => {
        element.classList.remove(`mtrl-icon-button--${v}`);
      });
      element.classList.add(`mtrl-icon-button--${variant}`);
      return iconButton;
    },

    getSize: () => {
      const sizes = Object.values(ICON_BUTTON_SIZES);
      for (const size of sizes) {
        if (element.classList.contains(`mtrl-icon-button--${size}`)) {
          return size;
        }
      }
      return ICON_BUTTON_SIZES.S;
    },

    setSize: (size: IconButtonSize | string) => {
      const sizes = Object.values(ICON_BUTTON_SIZES);
      sizes.forEach((s) => {
        element.classList.remove(`mtrl-icon-button--${s}`);
      });
      if (size !== ICON_BUTTON_SIZES.S) {
        element.classList.add(`mtrl-icon-button--${size}`);
      }
      return iconButton;
    },

    getShape: () => {
      const shapes = Object.values(ICON_BUTTON_SHAPES);
      for (const shape of shapes) {
        if (element.classList.contains(`mtrl-icon-button--${shape}`)) {
          return shape;
        }
      }
      return ICON_BUTTON_SHAPES.ROUND;
    },

    setShape: (shape: IconButtonShape | string) => {
      const shapes = Object.values(ICON_BUTTON_SHAPES);
      shapes.forEach((s) => {
        element.classList.remove(`mtrl-icon-button--${s}`);
      });
      if (shape !== ICON_BUTTON_SHAPES.ROUND) {
        element.classList.add(`mtrl-icon-button--${shape}`);
      }
      return iconButton;
    },

    getWidth: () => {
      const widths = Object.values(ICON_BUTTON_WIDTHS);
      for (const width of widths) {
        if (element.classList.contains(`mtrl-icon-button--${width}`)) {
          return width;
        }
      }
      return ICON_BUTTON_WIDTHS.DEFAULT;
    },

    setWidth: (width: IconButtonWidth | string) => {
      const widths = Object.values(ICON_BUTTON_WIDTHS);
      widths.forEach((w) => {
        element.classList.remove(`mtrl-icon-button--${w}`);
      });
      if (width !== ICON_BUTTON_WIDTHS.DEFAULT) {
        element.classList.add(`mtrl-icon-button--${width}`);
      }
      return iconButton;
    },

    enable: () => {
      iconButton.disabled.enable();
      return iconButton;
    },

    disable: () => {
      iconButton.disabled.disable();
      return iconButton;
    },

    setIcon: (icon: string) => {
      if (settings.toggle && !isSelected) {
        unselectedIcon = icon;
      }
      iconAPI.setIcon(icon);
      return iconButton;
    },

    getIcon: () => iconAPI.getIcon(),

    setSelectedIcon: (icon: string) => {
      selectedIcon = icon;
      if (isSelected) {
        updateIcon();
      }
      return iconButton;
    },

    getSelectedIcon: () => selectedIcon,

    isToggle: () => settings.toggle,

    select: () => {
      if (settings.toggle && !isSelected) {
        isSelected = true;
        element.classList.add("mtrl-icon-button--selected");
        element.setAttribute("aria-pressed", "true");
        updateIcon();
      }
      return iconButton;
    },

    deselect: () => {
      if (settings.toggle && isSelected) {
        isSelected = false;
        element.classList.remove("mtrl-icon-button--selected");
        element.setAttribute("aria-pressed", "false");
        updateIcon();
      }
      return iconButton;
    },

    toggleSelected: () => {
      if (isSelected) {
        iconButton.deselect();
      } else {
        iconButton.select();
      }
      return iconButton;
    },

    isSelected: () => isSelected,

    setAriaLabel: (label: string) => {
      element.setAttribute("aria-label", label);
      return iconButton;
    },

    destroy: () => {
      // Remove element from DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }

      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    },

    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      element.addEventListener(event, handler as EventListener);
      return iconButton;
    },

    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(
          (h) => h !== handler,
        );
      }
      element.removeEventListener(event, handler as EventListener);
      return iconButton;
    },

    addClass: (...classes: string[]) => {
      classes.forEach((className) => element.classList.add(className));
      return iconButton;
    },

    removeClass: (...classes: string[]) => {
      classes.forEach((className) => element.classList.remove(className));
      return iconButton;
    },
  };

  // Add click handler for toggle mode
  if (settings.toggle) {
    element.addEventListener("click", () => {
      iconButton.toggleSelected();
      const event = new CustomEvent("toggle", {
        bubbles: true,
        detail: { selected: isSelected },
      });
      element.dispatchEvent(event);
    });
  }

  return iconButton;
};

describe("IconButton Component", () => {
  describe("Basic Creation", () => {
    test("should create an icon button element", () => {
      const iconButton = createMockIconButton();

      expect(iconButton.element).toBeDefined();
      expect(iconButton.element.tagName).toBe("BUTTON");
      expect(iconButton.element.className).toContain("mtrl-icon-button");
    });

    test("should have correct default type", () => {
      const iconButton = createMockIconButton();
      expect(iconButton.element.type).toBe("button");
    });

    test("should accept custom type", () => {
      const iconButton = createMockIconButton({ type: "submit" });
      expect(iconButton.element.type).toBe("submit");
    });
  });

  describe("Variants", () => {
    test("should apply variant classes", () => {
      const variants: IconButtonVariant[] = [
        ICON_BUTTON_VARIANTS.FILLED,
        ICON_BUTTON_VARIANTS.TONAL,
        ICON_BUTTON_VARIANTS.OUTLINED,
        ICON_BUTTON_VARIANTS.STANDARD,
      ];

      variants.forEach((variant) => {
        const iconButton = createMockIconButton({ variant });
        expect(iconButton.element.className).toContain(
          `mtrl-icon-button--${variant}`,
        );
        expect(iconButton.getVariant()).toBe(variant);
      });
    });

    test("should be able to change variant", () => {
      const iconButton = createMockIconButton({ variant: "standard" });

      expect(iconButton.getVariant()).toBe("standard");

      iconButton.setVariant("filled");

      expect(iconButton.getVariant()).toBe("filled");
      expect(iconButton.element.className).toContain(
        "mtrl-icon-button--filled",
      );
      expect(iconButton.element.className).not.toContain(
        "mtrl-icon-button--standard",
      );
    });

    test("should default to standard variant", () => {
      const iconButton = createMockIconButton();
      expect(iconButton.getVariant()).toBe("standard");
    });
  });

  describe("Sizes", () => {
    test("should apply size classes", () => {
      const sizes: IconButtonSize[] = [
        ICON_BUTTON_SIZES.XS,
        ICON_BUTTON_SIZES.M,
        ICON_BUTTON_SIZES.L,
        ICON_BUTTON_SIZES.XL,
      ];

      sizes.forEach((size) => {
        const iconButton = createMockIconButton({ size });
        expect(iconButton.element.className).toContain(
          `mtrl-icon-button--${size}`,
        );
        expect(iconButton.getSize()).toBe(size);
      });
    });

    test("should not add size class for default size (s)", () => {
      const iconButton = createMockIconButton({ size: "s" });
      // Use word boundary check to avoid matching --standard, --square, etc.
      const hasExplicitSizeClass = iconButton.element.classList.contains(
        "mtrl-icon-button--s",
      );
      expect(hasExplicitSizeClass).toBe(false);
      expect(iconButton.getSize()).toBe("s");
    });

    test("should be able to change size", () => {
      const iconButton = createMockIconButton({ size: "s" });

      iconButton.setSize("xl");

      expect(iconButton.getSize()).toBe("xl");
      expect(iconButton.element.className).toContain("mtrl-icon-button--xl");
    });
  });

  describe("Shapes", () => {
    test("should apply square shape class", () => {
      const iconButton = createMockIconButton({ shape: "square" });
      expect(iconButton.element.className).toContain(
        "mtrl-icon-button--square",
      );
      expect(iconButton.getShape()).toBe("square");
    });

    test("should not add shape class for default shape (round)", () => {
      const iconButton = createMockIconButton({ shape: "round" });
      expect(iconButton.element.className).not.toContain(
        "mtrl-icon-button--round",
      );
      expect(iconButton.getShape()).toBe("round");
    });

    test("should be able to change shape", () => {
      const iconButton = createMockIconButton({ shape: "round" });

      iconButton.setShape("square");

      expect(iconButton.getShape()).toBe("square");
      expect(iconButton.element.className).toContain(
        "mtrl-icon-button--square",
      );
    });
  });

  describe("Widths", () => {
    test("should apply width classes", () => {
      const widths: IconButtonWidth[] = [
        ICON_BUTTON_WIDTHS.NARROW,
        ICON_BUTTON_WIDTHS.WIDE,
      ];

      widths.forEach((width) => {
        const iconButton = createMockIconButton({ width });
        expect(iconButton.element.className).toContain(
          `mtrl-icon-button--${width}`,
        );
        expect(iconButton.getWidth()).toBe(width);
      });
    });

    test("should not add width class for default width", () => {
      const iconButton = createMockIconButton({ width: "default" });
      expect(iconButton.element.className).not.toContain(
        "mtrl-icon-button--default",
      );
      expect(iconButton.getWidth()).toBe("default");
    });

    test("should be able to change width", () => {
      const iconButton = createMockIconButton({ width: "default" });

      iconButton.setWidth("wide");

      expect(iconButton.getWidth()).toBe("wide");
      expect(iconButton.element.className).toContain("mtrl-icon-button--wide");
    });
  });

  describe("Icon Management", () => {
    test("should set initial icon", () => {
      const iconHtml = "<svg><path></path></svg>";
      const iconButton = createMockIconButton({ icon: iconHtml });

      const iconElement = iconButton.element.querySelector(".mtrl-icon");
      expect(iconElement).toBeDefined();
      expect(iconElement?.innerHTML).toBe(iconHtml);
      expect(iconButton.getIcon()).toBe(iconHtml);
    });

    test("should be able to change icon", () => {
      const iconButton = createMockIconButton();

      const iconHtml = '<svg><path d="M12 0"></path></svg>';
      iconButton.setIcon(iconHtml);

      expect(iconButton.getIcon()).toBe(iconHtml);
    });

    test("should create icon element when setting icon if none exists", () => {
      const iconButton = createMockIconButton();

      expect(iconButton.element.querySelector(".mtrl-icon")).toBeNull();

      iconButton.setIcon("<svg></svg>");

      expect(iconButton.element.querySelector(".mtrl-icon")).toBeDefined();
    });
  });

  describe("Disabled State", () => {
    test("should apply disabled state on creation", () => {
      const iconButton = createMockIconButton({ disabled: true });

      expect(iconButton.element.disabled).toBe(true);
      expect(iconButton.element.className).toContain(
        "mtrl-icon-button--disabled",
      );
      expect(iconButton.disabled.isDisabled()).toBe(true);
    });

    test("should be able to enable and disable", () => {
      const iconButton = createMockIconButton();

      expect(iconButton.disabled.isDisabled()).toBe(false);

      iconButton.disable();

      expect(iconButton.disabled.isDisabled()).toBe(true);
      expect(iconButton.element.disabled).toBe(true);
      expect(iconButton.element.className).toContain(
        "mtrl-icon-button--disabled",
      );

      iconButton.enable();

      expect(iconButton.disabled.isDisabled()).toBe(false);
      expect(iconButton.element.disabled).toBe(false);
      expect(iconButton.element.className).not.toContain(
        "mtrl-icon-button--disabled",
      );
    });
  });

  describe("Toggle Mode", () => {
    test("should enable toggle mode", () => {
      const iconButton = createMockIconButton({ toggle: true });

      expect(iconButton.isToggle()).toBe(true);
      expect(iconButton.element.className).toContain(
        "mtrl-icon-button--toggle",
      );
      expect(iconButton.element.getAttribute("aria-pressed")).toBe("false");
    });

    test("should not be in toggle mode by default", () => {
      const iconButton = createMockIconButton();

      expect(iconButton.isToggle()).toBe(false);
      expect(iconButton.element.className).not.toContain(
        "mtrl-icon-button--toggle",
      );
    });

    test("should apply initial selected state", () => {
      const iconButton = createMockIconButton({
        toggle: true,
        selected: true,
      });

      expect(iconButton.isSelected()).toBe(true);
      expect(iconButton.element.className).toContain(
        "mtrl-icon-button--selected",
      );
      expect(iconButton.element.getAttribute("aria-pressed")).toBe("true");
    });

    test("should be able to select and deselect", () => {
      const iconButton = createMockIconButton({ toggle: true });

      expect(iconButton.isSelected()).toBe(false);

      iconButton.select();

      expect(iconButton.isSelected()).toBe(true);
      expect(iconButton.element.className).toContain(
        "mtrl-icon-button--selected",
      );
      expect(iconButton.element.getAttribute("aria-pressed")).toBe("true");

      iconButton.deselect();

      expect(iconButton.isSelected()).toBe(false);
      expect(iconButton.element.className).not.toContain(
        "mtrl-icon-button--selected",
      );
      expect(iconButton.element.getAttribute("aria-pressed")).toBe("false");
    });

    test("should toggle selected state", () => {
      const iconButton = createMockIconButton({ toggle: true });

      expect(iconButton.isSelected()).toBe(false);

      iconButton.toggleSelected();
      expect(iconButton.isSelected()).toBe(true);

      iconButton.toggleSelected();
      expect(iconButton.isSelected()).toBe(false);
    });

    test("should switch icons on toggle", () => {
      const unselectedIcon = '<svg class="outline"><path></path></svg>';
      const selectedIconHtml = '<svg class="filled"><path></path></svg>';

      const iconButton = createMockIconButton({
        toggle: true,
        icon: unselectedIcon,
        selectedIcon: selectedIconHtml,
      });

      expect(iconButton.getIcon()).toBe(unselectedIcon);

      iconButton.select();

      expect(iconButton.getIcon()).toBe(selectedIconHtml);

      iconButton.deselect();

      expect(iconButton.getIcon()).toBe(unselectedIcon);
    });

    test("should set and get selected icon", () => {
      const iconButton = createMockIconButton({ toggle: true });

      const selectedIconHtml = '<svg class="filled"></svg>';
      iconButton.setSelectedIcon(selectedIconHtml);

      expect(iconButton.getSelectedIcon()).toBe(selectedIconHtml);
    });

    test("should emit toggle event on click", () => {
      const iconButton = createMockIconButton({ toggle: true });
      let toggleEventFired = false;
      let selectedValue = false;

      iconButton.on("toggle", (e: CustomEvent) => {
        toggleEventFired = true;
        selectedValue = e.detail.selected;
      });

      iconButton.element.click();

      expect(toggleEventFired).toBe(true);
      expect(selectedValue).toBe(true);
    });
  });

  describe("Accessibility", () => {
    test("should set aria-label", () => {
      const iconButton = createMockIconButton({
        ariaLabel: "Add to favorites",
      });

      expect(iconButton.element.getAttribute("aria-label")).toBe(
        "Add to favorites",
      );
    });

    test("should be able to change aria-label", () => {
      const iconButton = createMockIconButton({
        ariaLabel: "Add to favorites",
      });

      iconButton.setAriaLabel("Remove from favorites");

      expect(iconButton.element.getAttribute("aria-label")).toBe(
        "Remove from favorites",
      );
    });

    test("should have aria-pressed for toggle buttons", () => {
      const iconButton = createMockIconButton({ toggle: true });

      expect(iconButton.element.getAttribute("aria-pressed")).toBe("false");

      iconButton.select();

      expect(iconButton.element.getAttribute("aria-pressed")).toBe("true");
    });
  });

  describe("Value Attribute", () => {
    test("should set value attribute", () => {
      const iconButton = createMockIconButton({ value: "favorite" });

      expect(iconButton.element.getAttribute("value")).toBe("favorite");
      expect(iconButton.getValue()).toBe("favorite");
    });

    test("should be able to change value", () => {
      const iconButton = createMockIconButton();

      expect(iconButton.getValue()).toBe("");

      iconButton.setValue("new-value");

      expect(iconButton.getValue()).toBe("new-value");
      expect(iconButton.element.getAttribute("value")).toBe("new-value");
    });
  });

  describe("Event Handling", () => {
    test("should add event listeners", () => {
      const iconButton = createMockIconButton();
      let clicked = false;

      iconButton.on("click", () => {
        clicked = true;
      });

      iconButton.element.dispatchEvent(new Event("click"));

      expect(clicked).toBe(true);
    });

    test("should remove event listeners", () => {
      const iconButton = createMockIconButton();
      let count = 0;

      const handler = () => {
        count++;
      };

      iconButton.on("click", handler);

      iconButton.element.dispatchEvent(new Event("click"));
      expect(count).toBe(1);

      iconButton.off("click", handler);

      iconButton.element.dispatchEvent(new Event("click"));
      expect(count).toBe(1);
    });
  });

  describe("CSS Classes", () => {
    test("should add CSS classes", () => {
      const iconButton = createMockIconButton();

      iconButton.addClass("custom-class", "special-button");

      expect(iconButton.element.className).toContain("custom-class");
      expect(iconButton.element.className).toContain("special-button");
    });

    test("should remove CSS classes", () => {
      const iconButton = createMockIconButton({ class: "custom-class" });

      expect(iconButton.element.className).toContain("custom-class");

      iconButton.removeClass("custom-class");

      expect(iconButton.element.className).not.toContain("custom-class");
    });

    test("should apply custom classes from config", () => {
      const iconButton = createMockIconButton({
        class: "my-class another-class",
      });

      expect(iconButton.element.className).toContain("my-class");
      expect(iconButton.element.className).toContain("another-class");
    });
  });

  describe("Ripple Effect", () => {
    test("should create ripple element by default", () => {
      const iconButton = createMockIconButton();

      const rippleElement = iconButton.element.querySelector(".mtrl-ripple");
      expect(rippleElement).toBeDefined();
    });

    test("should not create ripple when disabled", () => {
      const iconButton = createMockIconButton({ ripple: false });

      const rippleElement = iconButton.element.querySelector(".mtrl-ripple");
      expect(rippleElement).toBeNull();
    });
  });

  describe("Lifecycle", () => {
    test("should be properly destroyed", () => {
      const iconButton = createMockIconButton();
      document.body.appendChild(iconButton.element);

      expect(document.body.contains(iconButton.element)).toBe(true);

      iconButton.destroy();

      expect(document.body.contains(iconButton.element)).toBe(false);
    });

    test("should have lifecycle destroy method", () => {
      const iconButton = createMockIconButton();
      document.body.appendChild(iconButton.element);

      iconButton.lifecycle.destroy();

      expect(document.body.contains(iconButton.element)).toBe(false);
    });
  });

  describe("Method Chaining", () => {
    test("should support method chaining", () => {
      const iconButton = createMockIconButton({ toggle: true });

      const result = iconButton
        .setVariant("filled")
        .setSize("l")
        .setShape("square")
        .setWidth("wide")
        .setIcon("<svg></svg>")
        .setAriaLabel("Test button")
        .setValue("test")
        .select();

      expect(result).toBe(iconButton);
      expect(iconButton.getVariant()).toBe("filled");
      expect(iconButton.getSize()).toBe("l");
      expect(iconButton.getShape()).toBe("square");
      expect(iconButton.getWidth()).toBe("wide");
      expect(iconButton.isSelected()).toBe(true);
    });
  });

  describe("getClass Helper", () => {
    test("should return prefixed class name", () => {
      const iconButton = createMockIconButton();

      expect(iconButton.getClass("icon-button")).toBe("mtrl-icon-button");
      expect(iconButton.getClass("icon")).toBe("mtrl-icon");
    });

    test("should use custom prefix", () => {
      const iconButton = createMockIconButton({ prefix: "app" });

      expect(iconButton.getClass("icon-button")).toBe("app-icon-button");
    });
  });
});
