// test/components/checkbox.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from "bun:test";
import { JSDOM } from "jsdom";
import {
  CHECKBOX_VARIANTS,
  CHECKBOX_LABEL_POSITION,
} from "../../src/components/checkbox";

// IMPORTANT: Due to potential circular dependencies in the actual checkbox component
// we are using a mock implementation for tests. For a full implementation
// with the actual component, see test/ts/components/checkbox.test.ts

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
  global.HTMLInputElement = window.HTMLInputElement;
  global.Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;

  // Clean up jsdom
  window.close();
});

// Mock checkbox component factory
const createCheckbox = (config: any = {}) => {
  // Create main element
  const element = document.createElement("div");
  element.className = `mtrl-checkbox ${config.variant ? `mtrl-checkbox--${config.variant}` : ""}`;

  if (config.class) {
    element.className += ` ${config.class}`;
  }

  // Create input element
  const input = document.createElement("input");
  input.type = "checkbox";
  input.className = "mtrl-checkbox-input";

  if (config.name) {
    input.name = config.name;
  }

  if (config.value) {
    input.value = config.value;
  }

  if (config.checked) {
    input.checked = true;
    element.classList.add(`mtrl-checkbox--checked`);
  }

  if (config.required) {
    input.required = true;
  }

  if (config.disabled) {
    input.disabled = true;
    element.classList.add(`mtrl-checkbox--disabled`);
  }

  element.appendChild(input);

  // Create icon element
  const icon = document.createElement("span");
  icon.className = "mtrl-checkbox-icon";
  element.appendChild(icon);

  // Create label if provided
  let labelElement: HTMLLabelElement | null = null;
  if (config.label) {
    labelElement = document.createElement("label");
    labelElement.className = "mtrl-checkbox-label";
    labelElement.textContent = config.label;

    // Set label position
    if (config.labelPosition === CHECKBOX_LABEL_POSITION.START) {
      element.classList.add("mtrl-checkbox--label-start");
      element.insertBefore(labelElement, element.firstChild);
    } else {
      element.classList.add("mtrl-checkbox--label-end");
      element.appendChild(labelElement);
    }
  }

  // Store event handlers
  const eventHandlers: Record<string, Function[]> = {};

  // Default configuration
  const defaultConfig = {
    variant: CHECKBOX_VARIANTS.FILLED,
    labelPosition: CHECKBOX_LABEL_POSITION.END,
    ...config,
  };

  return {
    element,
    input,
    config: defaultConfig,

    // getValue returns boolean checked state (unified API)
    getValue() {
      return input.checked;
    },

    // setValue accepts boolean or string (unified API)
    setValue(value: boolean | string) {
      if (typeof value === "boolean") {
        if (value) {
          this.check();
        } else {
          this.uncheck();
        }
      } else {
        const shouldCheck = value === "true" || value === "1";
        if (shouldCheck) {
          this.check();
        } else {
          this.uncheck();
        }
      }
      return this;
    },

    // getValueAttribute returns HTML value attribute (rarely needed)
    getValueAttribute() {
      return input.value;
    },

    // setValueAttribute sets HTML value attribute (rarely needed)
    setValueAttribute(value: string) {
      input.value = value;
      return this;
    },

    check() {
      input.checked = true;
      element.classList.add("mtrl-checkbox--checked");
      return this;
    },

    uncheck() {
      input.checked = false;
      element.classList.remove("mtrl-checkbox--checked");
      return this;
    },

    toggle() {
      if (input.checked) {
        this.uncheck();
      } else {
        this.check();
      }
      return this;
    },

    isChecked() {
      return input.checked;
    },

    setIndeterminate(state: boolean) {
      input.indeterminate = state;
      if (state) {
        element.classList.add("mtrl-checkbox--indeterminate");
      } else {
        element.classList.remove("mtrl-checkbox--indeterminate");
      }
      return this;
    },

    setLabel(text: string) {
      this.config.label = text;
      if (labelElement) {
        labelElement.textContent = text;
      } else if (text) {
        labelElement = document.createElement("label");
        labelElement.className = "mtrl-checkbox-label";
        labelElement.textContent = text;
        element.appendChild(labelElement);
      }
      return this;
    },

    getLabel() {
      return this.config.label || "";
    },

    enable() {
      input.disabled = false;
      element.classList.remove("mtrl-checkbox--disabled");
      return this;
    },

    disable() {
      input.disabled = true;
      element.classList.add("mtrl-checkbox--disabled");
      return this;
    },

    on(event: string, handler: Function) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);

      if (event === "change") {
        input.addEventListener("change", handler as EventListener);
      } else {
        element.addEventListener(event, handler as EventListener);
      }

      return this;
    },

    off(event: string, handler: Function) {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(
          (h) => h !== handler,
        );
      }

      if (event === "change") {
        input.removeEventListener("change", handler as EventListener);
      } else {
        element.removeEventListener(event, handler as EventListener);
      }

      return this;
    },

    // For testing purposes - simulates emit method
    emit(event: string, data: any) {
      if (eventHandlers[event]) {
        eventHandlers[event].forEach((handler) => handler(data));
      }
    },

    destroy() {
      // Clean up event handlers
      Object.entries(eventHandlers).forEach(([event, handlers]) => {
        handlers.forEach((handler) => {
          if (event === "change") {
            input.removeEventListener(event, handler as EventListener);
          } else {
            element.removeEventListener(event, handler as EventListener);
          }
        });
      });

      // Remove from DOM
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    },
  };
};

describe("Checkbox Component", () => {
  test("should create a checkbox element", () => {
    const checkbox = createCheckbox();
    expect(checkbox.element).toBeDefined();
    expect(checkbox.element.tagName).toBe("DIV");
    expect(checkbox.element.className).toContain("mtrl-checkbox");
  });

  test("should create input element with type checkbox", () => {
    const checkbox = createCheckbox();
    const input = checkbox.input;
    expect(input).toBeDefined();
    expect(input.type).toBe("checkbox");
  });

  test("should add label content", () => {
    const labelText = "Accept terms";
    const checkbox = createCheckbox({
      label: labelText,
    });

    expect(checkbox.config.label).toBe(labelText);
  });

  test("should apply variant class", () => {
    const variant = CHECKBOX_VARIANTS.FILLED;
    const checkbox = createCheckbox({
      variant,
    });

    expect(checkbox.config.variant).toBe(variant);
  });

  test("should use filled as default variant", () => {
    const checkbox = createCheckbox();
    expect(checkbox.config.variant).toBe(CHECKBOX_VARIANTS.FILLED);
  });

  test("should handle change events", () => {
    const checkbox = createCheckbox();
    const handleChange = mock(() => {});

    checkbox.on("change", handleChange);

    checkbox.emit("change", {});
    expect(handleChange).toHaveBeenCalled();
  });

  test("should support disabled state", () => {
    const checkbox = createCheckbox();

    expect(typeof checkbox.disable).toBe("function");
    expect(typeof checkbox.enable).toBe("function");

    const initiallyEnabled =
      checkbox.element.hasAttribute("disabled") === false;
    expect(initiallyEnabled).toBe(true);

    checkbox.disable();

    expect(checkbox.input.disabled).toBe(true);
  });

  test("should support checked state", () => {
    const checkbox = createCheckbox();

    expect(typeof checkbox.check).toBe("function");
    expect(typeof checkbox.uncheck).toBe("function");
    expect(typeof checkbox.toggle).toBe("function");

    checkbox.check();
    expect(checkbox.input.checked).toBe(true);

    checkbox.uncheck();
    expect(checkbox.input.checked).toBe(false);

    checkbox.toggle();
    expect(checkbox.input.checked).toBe(true);

    const checkedCheckbox = createCheckbox({ checked: true });
    expect(checkedCheckbox.config.checked).toBe(true);
    expect(checkedCheckbox.input.checked).toBe(true);
  });

  test("should support indeterminate state", () => {
    const checkbox = createCheckbox();

    expect(typeof checkbox.setIndeterminate).toBe("function");

    checkbox.setIndeterminate(true);
    expect(checkbox.input.indeterminate).toBe(true);

    checkbox.setIndeterminate(false);
    expect(checkbox.input.indeterminate).toBe(false);
  });

  test("should set name attribute correctly", () => {
    const name = "terms";
    const checkbox = createCheckbox({ name });

    expect(checkbox.config.name).toBe(name);
    expect(checkbox.input.name).toBe(name);
  });

  test("should set value attribute correctly", () => {
    const value = "accept";
    const checkbox = createCheckbox({ value });

    expect(checkbox.config.value).toBe(value);
    expect(checkbox.input.value).toBe(value);
  });

  test("should set required attribute correctly", () => {
    const checkbox = createCheckbox({ required: true });

    expect(checkbox.config.required).toBe(true);
    expect(checkbox.input.required).toBe(true);
  });

  test("should position label correctly", () => {
    const startPos = CHECKBOX_LABEL_POSITION.START;
    const startCheckbox = createCheckbox({
      label: "Start Label",
      labelPosition: startPos,
    });

    expect(startCheckbox.config.labelPosition).toBe(startPos);
    expect(
      startCheckbox.element.classList.contains("mtrl-checkbox--label-start"),
    ).toBe(true);

    const endPos = CHECKBOX_LABEL_POSITION.END;
    const endCheckbox = createCheckbox({
      label: "End Label",
      labelPosition: endPos,
    });

    expect(endCheckbox.config.labelPosition).toBe(endPos);
    expect(
      endCheckbox.element.classList.contains("mtrl-checkbox--label-end"),
    ).toBe(true);
  });

  test("should allow updating label", () => {
    const initialLabel = "Initial";
    const checkbox = createCheckbox({
      label: initialLabel,
    });

    const initialLabelInConfig = checkbox.config.label;
    expect(initialLabelInConfig).toBe(initialLabel);

    const newLabel = "Updated Label";
    checkbox.setLabel(newLabel);

    const labelElement = checkbox.element.querySelector(".mtrl-checkbox-label");
    expect(labelElement?.textContent).toBe(newLabel);
  });

  test("should get label text correctly", () => {
    const labelText = "Test Label";
    const checkbox = createCheckbox({
      label: labelText,
    });

    expect(checkbox.config.label).toBe(labelText);
    expect(checkbox.getLabel()).toBe(labelText);
  });

  test("should get value correctly", () => {
    // getValue now returns boolean checked state (unified API)
    const checkbox = createCheckbox({ checked: true });
    expect(checkbox.getValue()).toBe(true);

    const unchecked = createCheckbox({ checked: false });
    expect(unchecked.getValue()).toBe(false);
  });

  test("should set value correctly", () => {
    const checkbox = createCheckbox();

    // setValue accepts boolean
    checkbox.setValue(true);
    expect(checkbox.getValue()).toBe(true);
    expect(checkbox.input.checked).toBe(true);

    checkbox.setValue(false);
    expect(checkbox.getValue()).toBe(false);
    expect(checkbox.input.checked).toBe(false);

    // setValue accepts string
    checkbox.setValue("true");
    expect(checkbox.getValue()).toBe(true);

    checkbox.setValue("false");
    expect(checkbox.getValue()).toBe(false);
  });

  test("should get and set value attribute", () => {
    const value = "test-value";
    const checkbox = createCheckbox({ value });

    expect(checkbox.config.value).toBe(value);
    expect(checkbox.getValueAttribute()).toBe(value);

    checkbox.setValueAttribute("new-value");
    expect(checkbox.getValueAttribute()).toBe("new-value");
  });

  test("should include check icon", () => {
    const checkbox = createCheckbox();
    const iconElement = checkbox.element.querySelector(".mtrl-checkbox-icon");

    expect(iconElement).toBeDefined();
  });

  test("should properly clean up resources", () => {
    const checkbox = createCheckbox();
    const parentElement = document.createElement("div");
    parentElement.appendChild(checkbox.element);

    checkbox.destroy();

    expect(parentElement.children.length).toBe(0);
  });

  test("should apply custom class", () => {
    const customClass = "custom-checkbox";
    const checkbox = createCheckbox({
      class: customClass,
    });

    expect(checkbox.element.className).toContain(customClass);
  });
});
