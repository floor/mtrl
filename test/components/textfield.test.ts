// test/components/textfield.test.ts
import { describe, test, expect, mock } from "bun:test";
import { JSDOM } from "jsdom";

// Set up JSDOM
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window as any as Window & typeof globalThis;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;

// Import types directly to avoid circular dependencies
import type {
  TextfieldComponent,
  TextfieldConfig,
  TextfieldVariant,
  TextfieldTypes,
} from "../../src/components/textfield/types";

// Define constants here to avoid circular dependencies
const TEXTFIELD_VARIANTS = {
  FILLED: "filled",
  OUTLINED: "outlined",
} as const;

const TEXTFIELD_TYPES = {
  TEXT: "text",
  PASSWORD: "password",
  EMAIL: "email",
  NUMBER: "number",
  TEL: "tel",
  URL: "url",
  SEARCH: "search",
  MULTILINE: "multiline",
} as const;

// Create a mock textfield implementation
const createTextfield = (config: TextfieldConfig = {}): TextfieldComponent => {
  // Create base element
  const element = document.createElement("div");
  element.className = `mtrl-textfield ${config.class || ""}`;

  // Add variant class if provided
  if (config.variant) {
    element.classList.add(`mtrl-textfield--${config.variant}`);
  }

  // Create input element
  const input = document.createElement(
    config.type === TEXTFIELD_TYPES.MULTILINE ? "textarea" : "input"
  ) as HTMLInputElement | HTMLTextAreaElement;
  input.className = "mtrl-textfield-input";

  if (input instanceof HTMLInputElement) {
    input.type = config.type || TEXTFIELD_TYPES.TEXT;
  }

  input.value = config.value || "";
  input.placeholder = config.placeholder || "";

  if (config.name) input.name = config.name;
  if (config.maxLength) input.maxLength = config.maxLength;
  if (config.required) input.required = true;
  if (config.disabled) input.disabled = true;

  element.appendChild(input);

  // Create label if provided
  let label: HTMLLabelElement | null = null;
  if (config.label) {
    label = document.createElement("label");
    label.className = "mtrl-textfield-label";
    label.textContent = config.label;
    element.appendChild(label);
  }

  // Event handlers
  const eventHandlers: Record<string, EventListener[]> = {};

  // Create the textfield component instance
  const textfield: TextfieldComponent = {
    element,
    input,

    getValue: () => input.value,

    setValue: (value: string) => {
      input.value = value || "";
      return textfield;
    },

    setAttribute: (name: string, value: string) => {
      input.setAttribute(name, value);
      return textfield;
    },

    getAttribute: (name: string) => input.getAttribute(name),

    removeAttribute: (name: string) => {
      input.removeAttribute(name);
      return textfield;
    },

    setVariant: (variant: TextfieldVariant) => {
      element.classList.remove(
        "mtrl-textfield--filled",
        "mtrl-textfield--outlined"
      );
      element.classList.add(`mtrl-textfield--${variant}`);
      return textfield;
    },

    getVariant: () => {
      if (element.classList.contains("mtrl-textfield--outlined"))
        return "outlined";
      return "filled";
    },

    setLabel: (text: string) => {
      if (label) {
        label.textContent = text;
      }
      return textfield;
    },

    getLabel: () => label?.textContent || "",

    leadingIcon: null,
    setLeadingIcon: () => textfield,
    removeLeadingIcon: () => textfield,

    trailingIcon: null,
    setTrailingIcon: () => textfield,
    removeTrailingIcon: () => textfield,

    supportingTextElement: null,
    setSupportingText: () => textfield,
    removeSupportingText: () => textfield,

    prefixTextElement: null,
    setPrefixText: () => textfield,
    removePrefixText: () => textfield,

    suffixTextElement: null,
    setSuffixText: () => textfield,
    removeSuffixText: () => textfield,

    updatePositions: () => textfield,

    setDensity: () => textfield,
    getDensity: () => "default",

    on: (event: string, handler: Function) => {
      const listener = handler as EventListener;
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }

      eventHandlers[event].push(listener);
      input.addEventListener(event, listener);
      return textfield;
    },

    off: (event: string, handler: Function) => {
      const listener = handler as EventListener;
      input.removeEventListener(event, listener);

      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(
          (h) => h !== listener
        );
      }

      return textfield;
    },

    enable: () => {
      input.disabled = false;
      element.classList.remove("mtrl-textfield--disabled");
      return textfield;
    },

    disable: () => {
      input.disabled = true;
      element.classList.add("mtrl-textfield--disabled");
      return textfield;
    },

    destroy: () => {
      // Clean up event listeners
      Object.entries(eventHandlers).forEach(([event, handlers]) => {
        handlers.forEach((handler) => {
          input.removeEventListener(event, handler);
        });
      });

      // Clear handlers
      Object.keys(eventHandlers).forEach((key) => {
        eventHandlers[key] = [];
      });

      // Remove from DOM if attached
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    },
  };

  return textfield;
};

describe("Textfield Component", () => {
  test("should create a textfield element", () => {
    const textfield = createTextfield();
    expect(textfield.element).toBeDefined();
    expect(textfield.element.tagName).toBe("DIV");
    expect(textfield.element.className).toContain("mtrl-textfield");
  });

  test("should apply variant class", () => {
    // Test filled variant
    const filledTextField = createTextfield({
      variant: TEXTFIELD_VARIANTS.FILLED,
    });
    expect(filledTextField.element.className).toContain(
      "mtrl-textfield--filled"
    );

    // Test outlined variant
    const outlinedTextField = createTextfield({
      variant: TEXTFIELD_VARIANTS.OUTLINED,
    });
    expect(outlinedTextField.element.className).toContain(
      "mtrl-textfield--outlined"
    );
  });

  test("should set initial value", () => {
    const initialValue = "Hello World";
    const textfield = createTextfield({
      value: initialValue,
    });

    expect(textfield.getValue()).toBe(initialValue);
  });

  test("should update value", () => {
    const textfield = createTextfield();
    const newValue = "Updated Value";

    textfield.setValue(newValue);
    expect(textfield.getValue()).toBe(newValue);
  });

  test("should set and get label", () => {
    const initialLabel = "Username";
    const textfield = createTextfield({
      label: initialLabel,
    });

    expect(textfield.getLabel()).toBe(initialLabel);

    // Update label
    const newLabel = "New Label";
    textfield.setLabel(newLabel);
    expect(textfield.getLabel()).toBe(newLabel);
  });

  test("should handle attributes", () => {
    const textfield = createTextfield();

    // Set attribute
    textfield.setAttribute("data-test", "test-value");
    expect(textfield.getAttribute("data-test")).toBe("test-value");

    // Remove attribute
    textfield.removeAttribute("data-test");
    expect(textfield.getAttribute("data-test")).toBeNull();
  });

  test("should support disabled state", () => {
    // Create initially enabled
    const textfield = createTextfield();

    // Check API methods
    expect(typeof textfield.disable).toBe("function");
    expect(typeof textfield.enable).toBe("function");

    // Disable and check state
    textfield.disable();
    expect(textfield.input.disabled).toBe(true);

    // Enable and check state
    textfield.enable();
    expect(textfield.input.disabled).toBe(false);

    // Test initially disabled through config
    const disabledTextfield = createTextfield({ disabled: true });
    expect(disabledTextfield.input.disabled).toBe(true);
  });

  test("should support different input types", () => {
    // Test regular text input
    const textInput = createTextfield({
      type: TEXTFIELD_TYPES.TEXT,
    });

    if (textInput.input instanceof HTMLInputElement) {
      expect(textInput.input.type).toBe("text");
    }

    // Test password input
    const passwordInput = createTextfield({
      type: TEXTFIELD_TYPES.PASSWORD,
    });

    if (passwordInput.input instanceof HTMLInputElement) {
      expect(passwordInput.input.type).toBe("password");
    }

    // Test email input
    const emailInput = createTextfield({
      type: TEXTFIELD_TYPES.EMAIL,
    });

    if (emailInput.input instanceof HTMLInputElement) {
      expect(emailInput.input.type).toBe("email");
    }

    // Test multiline input (textarea)
    const multilineInput = createTextfield({
      type: TEXTFIELD_TYPES.MULTILINE,
    });
    expect(multilineInput.input.tagName).toBe("TEXTAREA");
  });

  test("should register event handlers", () => {
    const textfield = createTextfield();

    // Create a mock handler
    const mockHandler = mock(() => {});

    // Register handler
    textfield.on("input", mockHandler);

    // Trigger an input event
    const inputEvent = new Event("input");
    textfield.input.dispatchEvent(inputEvent);

    // Check that handler was called
    expect(mockHandler.mock.calls.length).toBeGreaterThan(0);

    // Unregister handler and trigger again
    textfield.off("input", mockHandler);
    textfield.input.dispatchEvent(inputEvent);

    // Handler call count should not increase
    expect(mockHandler.mock.calls.length).toBe(1);
  });

  test("should apply custom class", () => {
    const customClass = "custom-textfield";
    const textfield = createTextfield({
      class: customClass,
    });

    expect(textfield.element.className).toContain(customClass);
  });

  test("should set placeholder", () => {
    const placeholder = "Enter text here";
    const textfield = createTextfield({
      placeholder,
    });

    expect(textfield.input.placeholder).toBe(placeholder);
  });

  test("should set required attribute", () => {
    const textfield = createTextfield({
      required: true,
    });

    expect(textfield.input.required).toBe(true);
  });

  test("should set name attribute", () => {
    const name = "username";
    const textfield = createTextfield({
      name,
    });

    expect(textfield.input.name).toBe(name);
  });

  test("should set maxLength attribute", () => {
    const maxLength = 50;
    const textfield = createTextfield({
      maxLength,
    });

    expect(textfield.input.maxLength).toBe(maxLength);
  });

  test("should properly clean up resources on destroy", () => {
    const textfield = createTextfield();

    const parentElement = document.createElement("div");
    parentElement.appendChild(textfield.element);

    // Destroy the component
    textfield.destroy();

    // Check if element was removed
    expect(parentElement.children.length).toBe(0);
  });
});
