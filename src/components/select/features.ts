// src/components/select/features.ts
import { processClassNames, type BaseComponentConfig } from "../../core/config/component";
import createTextField from "../textfield";
import createMenu from "../menu";
import { MenuComponent, MenuItem, MenuContent, MenuDivider, MenuPosition } from "../menu/types";
import { MENU } from "../menu/inner";
import { SelectOption, SelectConfig, SelectComponent, BaseComponent } from "./types";
import { warnUnknownValue } from "../../core/utils/warn";
import { activeElementOf } from "../../core/dom/focus";

/**
 * Creates a textfield for the select component
 * @param config - Select configuration
 * @returns Function that enhances a component with textfield functionality
 */
export const withTextField =
  (config: SelectConfig) =>
  <C extends object>(
    component: C,
  ): C & Required<Pick<BaseComponent, "element" | "textField">> => {
    // Get option text from value if provided
    let initialText = "";
    if (config.value) {
      const option = (config.options || []).find(
        (opt) => opt.id === config.value,
      );
      if (option) {
        initialText = option.text;
      }
    }

    // Create dropdown icon for the textfield
    const dropdownIcon =
      '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7 10l5 5 5-5H7z"/></svg>';

    // Create textfield component
    const textField = createTextField({
      class: processClassNames((config as BaseComponentConfig).className || ""),
      label: config.label,
      variant: config.variant || "filled",
      density: config.density || "default",
      value: initialText,
      name: config.name,
      disabled: config.disabled,
      required: config.required,
      supportingText: config.supportingText,
      error: config.error,
      trailingIcon: dropdownIcon,
      readonly: true, // Make readonly since selection happens via menu
    });

    // Add select-specific class
    textField.element.classList.add(`${config.prefix || "mtrl"}-select`);

    // Prevent typing in the input while keeping normal focus/visual behavior
    if (textField.input) {
      // `input` is HTMLInputElement | HTMLTextAreaElement, and
      // addEventListener over a union falls back to the EventTarget
      // signature, which types the event as a plain Event. Annotating the
      // parameter `KeyboardEvent` was the previous answer and is unsound:
      // under strictFunctionTypes a listener that requires a KeyboardEvent
      // cannot be registered where any Event may arrive. Narrowing the
      // receiver to their common HTMLElement picks the typed overload
      // instead, so `e` is a KeyboardEvent because the event name says so.
      const input: HTMLElement = textField.input;
      input.addEventListener("keydown", (e) => {
        // Allow navigation keys to propagate (they're handled by the menu)
        const allowedKeys = [
          "Tab",
          "Escape",
          "ArrowDown",
          "ArrowUp",
          "ArrowLeft",
          "ArrowRight",
          "Enter",
          " ",
          "Home",
          "End",
        ];
        if (!allowedKeys.includes(e.key)) {
          e.preventDefault();
        }
      });

      // Prevent paste
      textField.input.addEventListener("paste", (e) => {
        e.preventDefault();
      });

      // Prevent cut
      textField.input.addEventListener("cut", (e) => {
        e.preventDefault();
      });
    }

    return {
      ...component,
      element: textField.element,
      textField,
    };
  };

/**
 * Whether menu item data is a select option. Callers can replace the menu
 * items through `config.menu`, so the data is not known to be one.
 */
const isSelectOption = (value: unknown): value is SelectOption =>
  typeof value === "object" && value !== null && "id" in value && "text" in value;

/**
 * Recursively processes select options to create menu items
 * Ensures all items have proper data structure
 * @param options The options to process
 * @returns Properly structured menu items
 */
/**
 * A divider rather than an option.
 *
 * Written as a guard rather than inline: `"type" in option && ...` narrows the
 * branch it is true in, but leaves the union intact in the branch after it,
 * so every field read below would still see MenuDivider.
 */
const isDivider = (option: SelectOption | MenuDivider): option is MenuDivider =>
  "type" in option && option.type === "divider";

const processMenuItems = (
  options: Array<SelectOption | MenuDivider>
): MenuContent[] => {
  return options.map((option): MenuContent => {
    if (isDivider(option)) {
      return option; // Just pass dividers through
    }

    // Create a basic menu item
    const menuItem: MenuItem = {
      id: option.id.toString(), // Convert to string to match MenuItem type
      text: option.text,
      icon: option.icon,
      disabled: option.disabled,
      hasSubmenu: false,
      data: option,
    };

    // If this option has a submenu, process those items recursively
    if (option.hasSubmenu && Array.isArray(option.submenu)) {
      menuItem.hasSubmenu = true;
      menuItem.submenu = processMenuItems(option.submenu) as MenuItem[];
    }

    return menuItem;
  });
};

/**
 * Makes the select's input a select-only combobox over the menu's listbox
 * (WAI-ARIA Authoring Practices, "Select-Only Combobox"). Focus never leaves
 * the input: the active option is marked with a class and named by
 * aria-activedescendant, and every key is handled here.
 */
const setupCombobox = (
  component: BaseComponent,
  textField: NonNullable<BaseComponent["textField"]>,
  menu: MenuComponent,
  state: { options: SelectOption[]; selectedOption: SelectOption | null },
  choose: (option: SelectOption, originalEvent?: Event) => void,
  prefix: string,
): void => {
  const input = textField.input as HTMLInputElement;
  const field = textField.element;
  const activeClass = `${prefix}-menu__item--active`;
  const TYPEAHEAD_DELAY = 500;
  const PAGE = 10;

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("aria-expanded", "false");

  let active: HTMLElement | null = null;
  let pending: "selected" | "first" | "last" = "selected";
  let buffer = "";
  let bufferTimer: ReturnType<typeof setTimeout> | null = null;

  const options = (): HTMLElement[] =>
    Array.from(menu.element.querySelectorAll<HTMLElement>('[role="option"]'));
  const enabled = (): HTMLElement[] =>
    options().filter((option) => option.getAttribute("aria-disabled") !== "true");
  const optionFor = (element: HTMLElement | null): SelectOption | undefined =>
    element
      ? state.options.find((option) => String(option.id) === element.getAttribute("data-id"))
      : undefined;

  const setActive = (element: HTMLElement | null): void => {
    active = element;
    options().forEach((option) => option.classList.toggle(activeClass, option === element));
    if (element) {
      input.setAttribute("aria-activedescendant", element.id);
      element.scrollIntoView?.({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  };

  // Where the active option starts when the listbox opens
  const placeActive = (): void => {
    const list = enabled();
    if (!list.length) return setActive(null);
    if (pending === "first") return setActive(list[0]);
    if (pending === "last") return setActive(list[list.length - 1]);
    const selectedId = state.selectedOption ? String(state.selectedOption.id) : null;
    setActive(list.find((option) => option.getAttribute("data-id") === selectedId) ?? list[0]);
  };

  const open = (start: "selected" | "first" | "last", event?: Event): void => {
    pending = start;
    menu.open(event, "keyboard");
  };

  const close = (event?: Event): void => {
    // Focus is already on the input, and after Tab it has moved on
    menu.close(event, false);
  };

  // Select the active option and close
  const commit = (event?: Event): void => {
    const option = optionFor(active);
    if (option) choose(option, event);
    close(event);
  };

  const move = (index: number): void => {
    const list = enabled();
    if (!list.length) return;
    setActive(list[Math.max(0, Math.min(index, list.length - 1))]);
  };

  // Typing moves to the next option starting with what was typed
  const typeahead = (key: string): boolean => {
    if (bufferTimer) clearTimeout(bufferTimer);
    bufferTimer = setTimeout(() => {
      buffer = "";
      bufferTimer = null;
    }, TYPEAHEAD_DELAY);
    buffer += key.toLowerCase();
    const list = enabled();
    const start = active ? list.indexOf(active) + (buffer.length === 1 ? 1 : 0) : 0;
    const ordered = [...list.slice(start), ...list.slice(0, start)];
    const match = ordered.find((option) =>
      (option.textContent || "").trim().toLowerCase().startsWith(buffer),
    );
    if (match) setActive(match);
    return !!match;
  };

  menu.on("open", () => {
    input.setAttribute("aria-expanded", "true");
    const connect = () => {
      const list = menu.element.querySelector('[role="listbox"]');
      if (list?.id) input.setAttribute("aria-controls", list.id);
      placeActive();
    };
    // The menu renders its options on the next task after it is created
    if (options().length) connect();
    else setTimeout(connect, 0);
  });

  menu.on("close", () => {
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-controls");
    setActive(null);
    pending = "selected";
  });

  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (input.disabled) return;
    const isOpen = menu.isOpen();
    const list = enabled();
    const index = active ? list.indexOf(active) : -1;

    if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) open("selected", e);
      return;
    }
    if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) commit(e);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) open("selected", e);
        else move(index + 1);
        return;
      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) open("selected", e);
        else move(index - 1);
        return;
      case "Home":
        e.preventDefault();
        if (!isOpen) open("first", e);
        else move(0);
        return;
      case "End":
        e.preventDefault();
        if (!isOpen) open("last", e);
        else move(list.length - 1);
        return;
      case "PageDown":
        if (!isOpen) return;
        e.preventDefault();
        move(index + PAGE);
        return;
      case "PageUp":
        if (!isOpen) return;
        e.preventDefault();
        move(index - PAGE);
        return;
      case "Enter":
        e.preventDefault();
        if (isOpen) commit(e);
        else open("selected", e);
        return;
      case "Escape":
        if (!isOpen) return;
        e.preventDefault();
        close(e);
        return;
      case "Tab":
        // The active option is chosen and focus moves on as usual
        if (isOpen) commit(e);
        return;
      default:
        break;
    }

    // Space selects, unless it continues a search already being typed
    if (e.key === " " && !buffer) {
      e.preventDefault();
      if (isOpen) commit(e);
      else open("selected", e);
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      if (!isOpen) {
        open("selected", e);
        // The options are placed once the listbox has opened
        setTimeout(() => typeahead(e.key), 0);
      } else {
        typeahead(e.key);
      }
    }
  });

  // A press anywhere on the field, its label or icon included, puts focus on
  // the combobox, as a native select does
  field.addEventListener("mousedown", (e: MouseEvent) => {
    if (input.disabled || menu.element.contains(e.target as Node) || e.target === input) return;
    e.preventDefault();
    input.focus();
  });

  // A press on the field opens or closes the listbox; a press inside the
  // listbox is the option's own
  field.addEventListener("click", (e: MouseEvent) => {
    if (input.disabled || menu.element.contains(e.target as Node)) return;
    if (menu.isOpen()) close(e);
    else open("selected", e);
  });

  // Focus leaving the select closes the listbox without choosing. A
  // top-layer listbox is beside the field rather than inside it.
  input.addEventListener("blur", (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (menu.isOpen() && !field.contains(next) && !menu.element.contains(next)) close(e);
  });
};

/**
 * Creates a menu for the select component
 * @param config - Select configuration
 * @returns Function that enhances a component with menu functionality
 */
export const withMenu =
  (config: SelectConfig, getComponent: () => SelectComponent) =>
  // Without a textfield the component comes back without menu and select
  <C extends BaseComponent>(component: C): C & Pick<BaseComponent, typeof MENU | "select"> => {
    if (!component.textField) {
      console.warn("Cannot add menu: text field not found");
      return component;
    }
    const textField = component.textField;

    // Initialize state
    const state = {
      options: config.options || [],
      selectedOption: null as SelectOption | null,
    };

    // Find initial selected option
    if (config.value) {
      state.selectedOption = state.options.find(
        (opt) => opt.id === config.value,
      ) ?? null;
    }

    // Convert options to menu items with proper recursive processing
    const menuItems = processMenuItems(state.options);

    // A select whose options are flat is a WAI-ARIA select-only combobox: the
    // input keeps focus and owns the keyboard, and the popup is a listbox whose
    // active option the input points at. Options with submenus cannot live in a
    // listbox, so such a select stays a menu button.
    const listbox = !state.options.some((option) => option && option.hasSubmenu);

    const menu = createMenu({
      opener: component.textField,
      // Placed against the field, not the root: the supporting text row sits
      // under it (FLO-300)
      positionTarget: component.textField.field,
      items: menuItems,
      position: (config.placement || "bottom-start") as MenuPosition,
      width: "100%",
      // Prefixed: `class` is not (FLO-117), so the menu carried a bare
      // `select__menu` and `.mtrl-select__menu` matched nothing (FLO-295).
      class: `${config.prefix || "mtrl"}-select__menu`,
      closeOnSelect: true,
      closeOnClickOutside: true,
      closeOnEscape: true,
      closeOnResize: true,
      offset: 0,
      container: component.element,
      ...(config.layer ? { layer: config.layer } : {}),
      ...(listbox ? { manualOpen: true, listbox: true, closeOnEscape: false } : {}),
      ...(config.menu ?? {}),
    });

    // Selecting an option, by pointer or by key
    const choose = (option: SelectOption, originalEvent?: Event) => {
      state.selectedOption = option;

      // Update textfield
      textField.setValue(option.text);

      // Update the selected state in the menu
      menu.setSelected(option.id);

      // Emit change event
      if (component.emit) {
        component.emit("change", {
          select: getComponent(),
          value: state.selectedOption?.id || null,
          text: option.text,
          option,
          originalEvent,
        });
      }
    };

    // Handle menu selection
    menu.on("select", (event) => {
      // Safely access data properties with proper type checking
      if (!event.item || event.item.hasSubmenu) {
        return; // Skip processing for submenu items
      }

      // Safely extract the option data and validate it
      const option = event.item.data;
      if (!isSelectOption(option)) {
        console.warn(
          "Invalid menu selection: missing required data properties",
        );
        return;
      }

      choose(option, event.originalEvent);
    });

    if (listbox) {
      setupCombobox(component, textField, menu, state, choose, config.prefix || "mtrl");
    }

    // Add keyboard event listener for textfield (menu-button selects only)
    if (!listbox) textField.element.addEventListener("keydown", (e) => {
      if (textField.input.disabled) return;

      // Handle keyboard-based open
      if (
        (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") &&
        !menu.isOpen()
      ) {
        e.preventDefault();

        // Open menu with keyboard interaction. The open event is emitted from
        // the menu's own open handler below, for every way of opening.
        menu.open(e, "keyboard");
      } else if (e.key === "Escape" && menu.isOpen()) {
        e.preventDefault();
        menu.close(e);
      }
    });

    // Update textfield styling when menu opens/closes
    menu.on("open", () => {
      // open was emitted only on the keyboard path, so opening by click or by
      // open() reported nothing, while close fired for every path. Emit it here,
      // beside close, so each opening is reported exactly once.
      if (component.emit) {
        component.emit("open", {
          select: getComponent(),
          originalEvent: null,
        });
      }

      // Add open class to the select component
      textField.element.classList.add(
        `${config.prefix || "mtrl"}-select--open`,
      );

      // Add focused class to the textfield
      const PREFIX = config.prefix || "mtrl";
      textField.element.classList.add(`${PREFIX}-textfield--focused`);

      // If using the filled variant, we need to add focus styles
      if (
        textField.element.classList.contains(
          `${PREFIX}-textfield--filled`,
        )
      ) {
        textField.element.classList.add(
          `${PREFIX}-textfield--filled-focused`,
        );
      }
    });

    menu.on("close", (event) => {
      // Remove open class from the select component
      textField.element.classList.remove(
        `${config.prefix || "mtrl"}-select--open`,
      );

      // Let focus restoration happen naturally via the anchor component
      // Just update styling based on actual focus state with a small delay
      setTimeout(() => {
        const PREFIX = config.prefix || "mtrl";
        const active = activeElementOf(textField.element);
        const isFocused =
          active === textField.input || textField.element.contains(active);

        // Update styling based on actual focus state
        if (isFocused) {
          textField.element.classList.add(
            `${PREFIX}-textfield--focused`,
          );
          if (
            textField.element.classList.contains(
              `${PREFIX}-textfield--filled`,
            )
          ) {
            textField.element.classList.add(
              `${PREFIX}-textfield--filled-focused`,
            );
          }
        } else {
          textField.element.classList.remove(
            `${PREFIX}-textfield--focused`,
          );
          if (
            textField.element.classList.contains(
              `${PREFIX}-textfield--filled`,
            )
          ) {
            textField.element.classList.remove(
              `${PREFIX}-textfield--filled-focused`,
            );
          }
        }
      }, 10);

      // Emit close event
      if (component.emit) {
        component.emit("close", {
          select: getComponent(),
          originalEvent: event.originalEvent,
        });
      }
    });

    // Handle special case for showing selected item in menu
    const markSelectedMenuItem = () => {
      if (!state.selectedOption) return;
      menu.setSelected(state.selectedOption.id);
    };

    // Mark selected item when menu opens
    menu.on("open", () => {
      setTimeout(markSelectedMenuItem, 50);
    });

    // Expose select API
    return {
      ...component,
      [MENU]: menu,

      // Select controller
      select: {
        getValue: () => state.selectedOption?.id || null,

        setValue: (value) => {
          // Handle null/undefined/empty string as clear
          if (value === null || value === undefined || value === "") {
            state.selectedOption = null;
            textField.setValue("");
            menu.setSelected(null);
            return component;
          }

          const option = state.options.find(
            (opt) => "id" in opt && opt.id === value,
          );
          if (option && "text" in option) {
            state.selectedOption = option;
            textField.setValue(option.text);
            menu.setSelected(option.id);
            return component;
          }

          // A value no option carries clears the selection, the same as
          // native `<select>` setting selectedIndex = -1. This used to keep
          // the previous selection and say nothing, so a typo left the select
          // showing a value the caller had not asked for. FLO-106. Silently,
          // as native `<select>`: a programmatic change emits no `change` (FLO-328).
          state.selectedOption = null;
          textField.setValue("");
          menu.setSelected(null);
          warnUnknownValue("select", value);
          return component;
        },

        clear: () => {
          state.selectedOption = null;
          textField.setValue("");
          menu.setSelected(null);
          return component;
        },

        getText: () => state.selectedOption?.text || "",

        getSelectedOption: () => state.selectedOption,

        getOptions: () => [...state.options],

        setOptions: (options) => {
          state.options = options;

          const menuItems = processMenuItems(options);
          menu.setItems(menuItems);

          // If previously selected option is no longer available, clear selection
          const selected = state.selectedOption;
          if (
            selected &&
            !options.find((opt) => "id" in opt && opt.id === selected.id)
          ) {
            state.selectedOption = null;
            textField.setValue("");
          }

          return component;
        },

        open: (
          event?: Event,
          interactionType: "mouse" | "keyboard" = "mouse",
        ) => {
          menu.open(event, interactionType);
          return component;
        },

        close: (event?: Event) => {
          menu.close(event);
          return component;
        },

        isOpen: () => menu.isOpen(),
      },
    };
  };
