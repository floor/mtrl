// test/components/select.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from "bun:test";
import { JSDOM } from "jsdom";

// IMPORTANT: Due to dependencies on other components like textfield and menu
// we are using a mock implementation for tests. For a full implementation
// with the actual component, see test/ts/components/select.test.ts

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
  global.CustomEvent = window.CustomEvent;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;

  // Clean up jsdom
  window.close();
});

// Types for our mock
interface SelectOption {
  id: string;
  text: string;
  disabled?: boolean;
  icon?: string;
  data?: any;
}

interface MockSelectConfig {
  options?: SelectOption[];
  value?: string;
  variant?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  supportingText?: string;
  error?: boolean;
}

// Mock select component factory
const createSelect = (config: MockSelectConfig = {}) => {
  // Create main container
  const element = document.createElement("div");
  element.className = `mtrl-select mtrl-textfield ${config.variant ? `mtrl-textfield--${config.variant}` : "mtrl-textfield--filled"}`;

  // Create textfield container
  const input = document.createElement("input");
  input.type = "text";
  input.className = "mtrl-textfield-input";
  input.readOnly = true;

  if (config.disabled) {
    element.classList.add("mtrl-textfield--disabled");
    input.disabled = true;
  }

  if (config.required) {
    input.required = true;
  }

  // Add label if provided
  if (config.label) {
    const label = document.createElement("label");
    label.className = "mtrl-textfield-label";
    label.textContent = config.label;
    element.appendChild(label);
  }

  // Add supporting text if provided
  if (config.supportingText) {
    const supportingText = document.createElement("div");
    supportingText.className = "mtrl-textfield-supporting-text";
    supportingText.textContent = config.supportingText;
    if (config.error) {
      supportingText.classList.add("mtrl-textfield-supporting-text--error");
    }
    element.appendChild(supportingText);
  }

  // Add dropdown icon
  const iconWrapper = document.createElement("span");
  iconWrapper.className = "mtrl-textfield-trailing-icon";
  iconWrapper.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7 10l5 5 5-5H7z"/></svg>';

  // Create the main textfield outer container
  const textfieldCont = document.createElement("div");
  textfieldCont.className = "mtrl-textfield-container";
  textfieldCont.appendChild(input);
  textfieldCont.appendChild(iconWrapper);
  element.appendChild(textfieldCont);

  // Setup state
  const state = {
    options: config.options || [],
    selectedOption: null as SelectOption | null,
    isOpen: false,
  };

  // Find initial selected option
  if (config.value) {
    state.selectedOption =
      state.options.find((opt) => opt.id === config.value) || null;
    if (state.selectedOption) {
      input.value = state.selectedOption.text;
    }
  }

  // Create mock menu element
  const menu = document.createElement("div");
  menu.className = "mtrl-menu";
  menu.style.display = "none";
  document.body.appendChild(menu);

  // Create menu items
  const updateMenuItems = () => {
    menu.innerHTML = "";
    const list = document.createElement("ul");
    list.className = "mtrl-menu-list";

    state.options.forEach((option) => {
      // Skip if this is a divider
      if ("type" in option && option.type === "divider") {
        const dividerEl = document.createElement("li");
        dividerEl.className = "mtrl-menu-divider";
        dividerEl.setAttribute("role", "separator");
        list.appendChild(dividerEl);
        return;
      }

      const item = document.createElement("li");
      item.className = "mtrl-menu-item";
      item.setAttribute("data-id", option.id);

      if (option.disabled) {
        item.classList.add("mtrl-menu-item--disabled");
      }

      if (state.selectedOption && state.selectedOption.id === option.id) {
        item.classList.add("mtrl-menu-item--selected");
      }

      // Create content container
      const content = document.createElement("span");
      content.className = "mtrl-menu-item-content";

      // Add icon if provided
      if (option.icon) {
        const iconEl = document.createElement("span");
        iconEl.className = "mtrl-menu-item-icon";
        iconEl.innerHTML = option.icon;
        content.appendChild(iconEl);
      }

      // Add text
      const textEl = document.createElement("span");
      textEl.className = "mtrl-menu-item-text";
      textEl.textContent = option.text;
      content.appendChild(textEl);

      item.appendChild(content);

      // Add click handler
      if (!option.disabled) {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          // Update selection
          state.selectedOption = option;
          input.value = option.text;

          // Trigger change event
          const changeEvent = new CustomEvent("change", {
            detail: {
              select: mockComponent,
              value: option.id,
              text: option.text,
              option: option,
            },
            bubbles: true,
          });
          element.dispatchEvent(changeEvent);

          // Close menu
          closeMenu();
        });
      }

      list.appendChild(item);
    });

    menu.appendChild(list);
  };

  // Setup event handlers
  const eventHandlers: Record<string, Function[]> = {};

  // Functions to open/close menu
  const openMenu = (interactionType: "mouse" | "keyboard" = "mouse") => {
    if (input.disabled) return;

    state.isOpen = true;
    element.classList.add("mtrl-select--open");
    menu.style.display = "block";

    // Update menu items
    updateMenuItems();

    // Position the menu
    const rect = element.getBoundingClientRect();
    menu.style.position = "absolute";
    menu.style.top = `${rect.bottom}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.width = `${rect.width}px`;
    menu.style.zIndex = "1000";

    // Trigger open event
    const openEvent = new CustomEvent("open", {
      detail: {
        select: mockComponent,
      },
      bubbles: true,
    });
    element.dispatchEvent(openEvent);

    // Add document click handler to close
    setTimeout(() => {
      document.addEventListener("click", documentClickHandler);
    }, 0);
  };

  const closeMenu = () => {
    if (!state.isOpen) return;

    state.isOpen = false;
    element.classList.remove("mtrl-select--open");
    menu.style.display = "none";

    // Trigger close event
    const closeEvent = new CustomEvent("close", {
      detail: {
        select: mockComponent,
      },
      bubbles: true,
    });
    element.dispatchEvent(closeEvent);

    // Remove document click handler
    document.removeEventListener("click", documentClickHandler);
  };

  // Document click handler to close menu
  const documentClickHandler = (e: Event) => {
    // Only close if click is outside the select and menu
    if (
      !element.contains(e.target as Node) &&
      !menu.contains(e.target as Node)
    ) {
      closeMenu();
    }
  };

  // Add click listener to open/close menu
  element.addEventListener("click", (e) => {
    if (state.isOpen) {
      closeMenu();
    } else {
      openMenu("mouse");
    }
  });

  // Add keyboard handling
  element.addEventListener("keydown", (e) => {
    if (input.disabled) return;

    if (
      (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") &&
      !state.isOpen
    ) {
      e.preventDefault();
      openMenu("keyboard");
    } else if (e.key === "Escape" && state.isOpen) {
      e.preventDefault();
      closeMenu();
    }
  });

  // Create the mock component object
  const mockComponent = {
    element,
    textfield: {
      element,
      input,
      setValue(value: string) {
        input.value = value;
        return this;
      },
      getValue() {
        return input.value;
      },
      enable() {
        input.disabled = false;
        element.classList.remove("mtrl-textfield--disabled");
        return this;
      },
      disable() {
        input.disabled = true;
        element.classList.add("mtrl-textfield--disabled");
        return this;
      },
      setError(error: boolean, message?: string) {
        if (error) {
          element.classList.add("mtrl-textfield--error");
          if (message) {
            // Create or update supporting text element
            let supportingText = element.querySelector(
              ".mtrl-textfield-supporting-text",
            );
            if (!supportingText) {
              supportingText = document.createElement("div");
              supportingText.className =
                "mtrl-textfield-supporting-text mtrl-textfield-supporting-text--error";
              element.appendChild(supportingText);
            }
            supportingText.textContent = message;
            supportingText.classList.add(
              "mtrl-textfield-supporting-text--error",
            );
          }
        } else {
          element.classList.remove("mtrl-textfield--error");
          const supportingText = element.querySelector(
            ".mtrl-textfield-supporting-text",
          );
          if (supportingText) {
            supportingText.remove();
          }
        }
        return this;
      },
    },
    menu: {
      element: menu,
      open(event?: Event, interactionType: "mouse" | "keyboard" = "mouse") {
        openMenu(interactionType);
        return this;
      },
      close() {
        closeMenu();
        return this;
      },
      isOpen() {
        return state.isOpen;
      },
    },
    getValue() {
      return state.selectedOption ? state.selectedOption.id : null;
    },
    setValue(value: string | null | undefined) {
      // Handle null/undefined/empty string as clear
      if (value === null || value === undefined || value === "") {
        state.selectedOption = null;
        input.value = "";
        // Update menu items if open
        if (state.isOpen) {
          updateMenuItems();
        }
        return this;
      }

      const option = state.options.find((opt) => opt.id === value);
      if (option) {
        state.selectedOption = option;
        input.value = option.text;

        // Update menu items if open
        if (state.isOpen) {
          updateMenuItems();
        }
      }
      return this;
    },
    clear() {
      state.selectedOption = null;
      input.value = "";
      // Update menu items if open
      if (state.isOpen) {
        updateMenuItems();
      }
      return this;
    },
    getText() {
      return state.selectedOption ? state.selectedOption.text : "";
    },
    getSelectedOption() {
      return state.selectedOption;
    },
    getOptions() {
      return [...state.options];
    },
    setOptions(options: SelectOption[]) {
      state.options = options;

      // If previously selected option is no longer available, clear selection
      if (
        state.selectedOption &&
        !options.some(
          (opt) => "id" in opt && opt.id === state.selectedOption?.id,
        )
      ) {
        state.selectedOption = null;
        input.value = "";
      }

      // Update menu items if open
      if (state.isOpen) {
        updateMenuItems();
      }

      return this;
    },
    open(interactionType: "mouse" | "keyboard" = "mouse") {
      openMenu(interactionType);
      return this;
    },
    close() {
      closeMenu();
      return this;
    },
    isOpen() {
      return state.isOpen;
    },
    on(event: string, handler: Function) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      element.addEventListener(event, (e: any) => {
        if (e.detail) {
          handler(e.detail);
        } else {
          handler(e);
        }
      });
      return this;
    },
    off(event: string, handler: Function) {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(
          (h) => h !== handler,
        );
      }
      return this;
    },
    enable() {
      this.textfield.enable();
      return this;
    },
    disable() {
      this.textfield.disable();
      return this;
    },
    setError(error: boolean, message?: string) {
      this.textfield.setError(error, message);
      return this;
    },
    clearError() {
      this.textfield.setError(false);
      return this;
    },
    destroy() {
      // Clean up event handlers
      Object.entries(eventHandlers).forEach(([event, handlers]) => {
        handlers.forEach((handler) => {
          // We can't directly remove these, but we've cleared the array
        });
      });

      // Remove document click handler
      document.removeEventListener("click", documentClickHandler);

      // Remove menu from DOM
      if (menu.parentNode) {
        menu.parentNode.removeChild(menu);
      }

      // Remove element from DOM
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    },
  };

  // Initialize menu items
  updateMenuItems();

  return mockComponent;
};

describe("Select Component", () => {
  test("should create a select element", () => {
    const select = createSelect();
    expect(select.element).toBeDefined();
    expect(select.element.className).toContain("mtrl-select");
    expect(select.element.className).toContain("mtrl-textfield");
  });

  test("should add label", () => {
    const labelText = "Select Country";
    const select = createSelect({
      label: labelText,
    });

    const labelElement = select.element.querySelector(".mtrl-textfield-label");
    expect(labelElement).toBeDefined();
    expect(labelElement?.textContent).toBe(labelText);
  });

  test("should apply variant class", () => {
    const variant = "outlined";
    const select = createSelect({
      variant,
    });

    expect(select.element.className).toContain(`mtrl-textfield--${variant}`);
  });

  test("should render options and select one", () => {
    const options = [
      { id: "us", text: "United States" },
      { id: "ca", text: "Canada" },
      { id: "mx", text: "Mexico" },
    ];

    const select = createSelect({
      options,
    });

    // Initially no selection
    expect(select.getValue()).toBeNull();

    // Set a value
    select.setValue("ca");
    expect(select.getValue()).toBe("ca");
    expect(select.getText()).toBe("Canada");

    // Get selected option
    const selectedOption = select.getSelectedOption();
    expect(selectedOption).toBeDefined();
    expect(selectedOption?.id).toBe("ca");
    expect(selectedOption?.text).toBe("Canada");
  });

  test("should handle change events", () => {
    const options = [
      { id: "us", text: "United States" },
      { id: "ca", text: "Canada" },
      { id: "mx", text: "Mexico" },
    ];

    const select = createSelect({
      options,
    });

    const handleChange = mock((event: any) => {});
    select.on("change", handleChange);

    // Open the menu and click on an item
    select.open();
    const item = select.menu.element.querySelector('[data-id="mx"]');
    item?.dispatchEvent(new Event("click", { bubbles: true }));

    // Verify change event was triggered
    expect(handleChange).toHaveBeenCalled();
    expect(select.getValue()).toBe("mx");
  });

  test("should show selected option in menu", () => {
    const options = [
      { id: "us", text: "United States" },
      { id: "ca", text: "Canada" },
      { id: "mx", text: "Mexico" },
    ];

    const select = createSelect({
      options,
      value: "ca", // Pre-select Canada
    });

    select.open();

    const selectedItem = select.menu.element.querySelector(
      ".mtrl-menu-item--selected",
    );
    expect(selectedItem).toBeDefined();
    expect(selectedItem?.getAttribute("data-id")).toBe("ca");
  });

  test("should support disabled state", () => {
    const select = createSelect({
      options: [
        { id: "us", text: "United States" },
        { id: "ca", text: "Canada" },
      ],
    });

    // Initially not disabled
    expect(select.textfield.input.disabled).toBe(false);

    // Disable the select
    select.disable();
    expect(select.textfield.input.disabled).toBe(true);
    expect(select.element.classList.contains("mtrl-textfield--disabled")).toBe(
      true,
    );

    // Try to open the menu - it should not open when disabled
    select.open();
    expect(select.isOpen()).toBe(false);

    // Enable the select
    select.enable();
    expect(select.textfield.input.disabled).toBe(false);
    expect(select.element.classList.contains("mtrl-textfield--disabled")).toBe(
      false,
    );
  });

  test("should update options", () => {
    const select = createSelect({
      options: [
        { id: "us", text: "United States" },
        { id: "ca", text: "Canada" },
      ],
      value: "ca",
    });

    // Verify initial state
    expect(select.getValue()).toBe("ca");

    // Update with new options
    const newOptions = [
      { id: "fr", text: "France" },
      { id: "de", text: "Germany" },
      { id: "it", text: "Italy" },
    ];

    select.setOptions(newOptions);

    // Verify options updated and selection cleared (since 'ca' is not in new options)
    expect(select.getOptions().length).toBe(3);
    expect(select.getValue()).toBeNull();

    // Set a new value
    select.setValue("fr");
    expect(select.getValue()).toBe("fr");
    expect(select.getText()).toBe("France");
  });

  test("should handle open and close menu", () => {
    const select = createSelect({
      options: [
        { id: "us", text: "United States" },
        { id: "ca", text: "Canada" },
      ],
    });

    // Initially closed
    expect(select.isOpen()).toBe(false);

    // Open the menu
    select.open();
    expect(select.isOpen()).toBe(true);
    expect(select.element.classList.contains("mtrl-select--open")).toBe(true);

    // Close the menu
    select.close();
    expect(select.isOpen()).toBe(false);
    expect(select.element.classList.contains("mtrl-select--open")).toBe(false);
  });

  test("should properly clean up resources", () => {
    const select = createSelect();
    const parentElement = document.createElement("div");
    parentElement.appendChild(select.element);

    // Verify menu is in the document
    expect(document.body.contains(select.menu.element)).toBe(true);

    // Destroy should remove elements and clean up resources
    select.destroy();

    expect(document.body.contains(select.menu.element)).toBe(false);
    expect(parentElement.children.length).toBe(0);
  });

  test("should clear selection with clear() method", () => {
    const options = [
      { id: "1", text: "Option 1" },
      { id: "2", text: "Option 2" },
    ];
    const select = createSelect({
      options,
      value: "1",
    });

    // Verify initial selection
    expect(select.getValue()).toBe("1");
    expect(select.getText()).toBe("Option 1");

    // Clear the selection
    select.clear();

    // Verify selection is cleared
    expect(select.getValue()).toBe(null);
    expect(select.getText()).toBe("");
    expect(select.getSelectedOption()).toBe(null);
  });

  test("should clear selection with setValue(null)", () => {
    const options = [
      { id: "1", text: "Option 1" },
      { id: "2", text: "Option 2" },
    ];
    const select = createSelect({
      options,
      value: "2",
    });

    // Verify initial selection
    expect(select.getValue()).toBe("2");
    expect(select.getText()).toBe("Option 2");

    // Clear using setValue(null)
    select.setValue(null);

    // Verify selection is cleared
    expect(select.getValue()).toBe(null);
    expect(select.getText()).toBe("");
  });

  test("should clear selection with setValue(undefined)", () => {
    const options = [
      { id: "1", text: "Option 1" },
      { id: "2", text: "Option 2" },
    ];
    const select = createSelect({
      options,
      value: "1",
    });

    // Verify initial selection
    expect(select.getValue()).toBe("1");

    // Clear using setValue(undefined)
    select.setValue(undefined);

    // Verify selection is cleared
    expect(select.getValue()).toBe(null);
    expect(select.getText()).toBe("");
  });

  test("should clear selection with setValue empty string", () => {
    const options = [
      { id: "1", text: "Option 1" },
      { id: "2", text: "Option 2" },
    ];
    const select = createSelect({
      options,
      value: "1",
    });

    // Verify initial selection
    expect(select.getValue()).toBe("1");

    // Clear using setValue('')
    select.setValue("");

    // Verify selection is cleared
    expect(select.getValue()).toBe(null);
    expect(select.getText()).toBe("");
  });

  test("should set error state with setError", () => {
    const select = createSelect({
      options: [
        { id: "1", text: "Option 1" },
        { id: "2", text: "Option 2" },
      ],
    });

    // Initially no error
    expect(select.element.classList.contains("mtrl-textfield--error")).toBe(
      false,
    );

    // Set error with message
    select.setError(true, "This field is required");

    // Verify error state
    expect(select.element.classList.contains("mtrl-textfield--error")).toBe(
      true,
    );
    const supportingText = select.element.querySelector(
      ".mtrl-textfield-supporting-text",
    );
    expect(supportingText).toBeDefined();
    expect(supportingText?.textContent).toBe("This field is required");
  });

  test("should clear error state with clearError", () => {
    const select = createSelect({
      options: [
        { id: "1", text: "Option 1" },
        { id: "2", text: "Option 2" },
      ],
    });

    // Set error first
    select.setError(true, "This field is required");
    expect(select.element.classList.contains("mtrl-textfield--error")).toBe(
      true,
    );

    // Clear error
    select.clearError();

    // Verify error is cleared
    expect(select.element.classList.contains("mtrl-textfield--error")).toBe(
      false,
    );
    const supportingText = select.element.querySelector(
      ".mtrl-textfield-supporting-text",
    );
    expect(supportingText).toBe(null);
  });

  test("should clear error state with setError(false)", () => {
    const select = createSelect({
      options: [
        { id: "1", text: "Option 1" },
        { id: "2", text: "Option 2" },
      ],
    });

    // Set error first
    select.setError(true, "Error message");
    expect(select.element.classList.contains("mtrl-textfield--error")).toBe(
      true,
    );

    // Clear using setError(false)
    select.setError(false);

    // Verify error is cleared
    expect(select.element.classList.contains("mtrl-textfield--error")).toBe(
      false,
    );
  });
});
