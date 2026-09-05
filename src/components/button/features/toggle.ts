// src/components/button/features/toggle.ts
import { ButtonConfig } from "../types";

/**
 * Toggle state manager
 * @category Components
 */
export interface ToggleManager {
  /** Sets the selected state */
  setSelected: (selected: boolean) => void;
  /** Whether the button is selected */
  isSelected: () => boolean;
}

/**
 * Component with the elements the toggle feature needs
 * @internal
 */
interface ToggleableComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  emit?: (event: string, data?: unknown) => unknown;
}

/**
 * Component enhanced with toggle capabilities
 * @category Components
 */
export interface ToggleComponent {
  toggle: ToggleManager;
}

/**
 * Turns a button into an M3 toggle button: a click flips the selected
 * state, the element carries `aria-pressed`, and the `--toggle` and
 * `--selected` classes drive the selected colours and the shape swap.
 *
 * Emits a `change` event with `{ selected }` when the user toggles it.
 * With `toggleOnClick: false` the click does nothing and a container
 * (button group) drives the state through `setSelected`.
 *
 * @param config - Button configuration (`toggle`, `selected`, `toggleOnClick`)
 * @returns Component enhancer
 * @category Components
 */
export const withToggle =
  (config: ButtonConfig) =>
  <C extends ToggleableComponent>(component: C): C & Partial<ToggleComponent> => {
    if (!config.toggle) {
      return component;
    }

    const { element } = component;
    const buttonClass = component.getClass("button");
    let selected = false;

    const apply = (next: boolean): void => {
      selected = next;
      element.classList.toggle(`${buttonClass}--selected`, next);
      element.setAttribute("aria-pressed", String(next));
    };

    element.classList.add(`${buttonClass}--toggle`);
    apply(config.selected === true);

    if (config.toggleOnClick !== false) {
      element.addEventListener("click", () => {
        if ((element as HTMLButtonElement).disabled) return;
        apply(!selected);
        component.emit?.("change", { selected });
      });
    }

    return {
      ...component,
      toggle: {
        setSelected: (next: boolean) => {
          if (next !== selected) apply(next);
        },
        isSelected: () => selected,
      },
    };
  };
