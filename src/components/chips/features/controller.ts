// src/components/chips/features/controller.ts
import { getCleanup } from "../../../core/compose/cleanup";
import type { EventCallback } from "../../../core/state/emitter";
import {
  ChipsConfig,
  ChipsEvents,
  ChipsChangeEvent,
  ChipComponent,
  ChipConfig,
  ChipsEventListeners,
  ChipsFeatureComponent,
} from "../types";
import createChip from "../chip/chip";
import { CHIPS_EVENTS } from "../constants";
import { activeElementOf } from "../../../core/dom/focus";

/**
 * Add controller functionality to chips component
 * Manages state, events, user interactions, and UI rendering
 *
 * @param config Chips configuration
 * @returns Component enhancer with chips controller functionality
 */
export const withController =
  (config: ChipsConfig) =>
  // Generic, so the accumulated pipeline type survives. There used to be a
  // `if (!component.element)` guard here, warning and returning the component
  // untouched: withElement runs before this in the only pipe that calls it, so
  // it could not fire, and an early return makes the return type a union that
  // collapses to C.
  <C extends ChipsFeatureComponent>(component: C) => {
  // Store event listeners
  const eventListeners: ChipsEventListeners = {
    change: [],
    add: [],
    remove: [],
  };

  // Track current focused chip index for keyboard navigation
  let focusedChipIndex = -1;
  // Whether the arrows, Home and End move between the chips (keyboard.disable())
  let keyboardEnabled = true;

  /**
   * Dispatches custom events to registered handlers
   * @param {string} eventName - Name of the event to trigger
   * @param args - Arguments to pass to the handlers
   */
  const dispatchEvent = <K extends keyof ChipsEvents>(
    eventName: K,
    ...args: Parameters<ChipsEvents[K]>
  ) => {
    if (eventListeners[eventName]) {
      // Storage erases callback arguments; dispatch and the public API check them.
      eventListeners[eventName].forEach((handler: EventCallback) =>
        (handler as (...a: unknown[]) => void)(...args),
      );
    }
  };

  /** Convert selected chip values to the public getter's single or multi shape. */
  const selectionValue = (values: (string | null)[]): string | string[] | null => {
    const selected = values.filter((value): value is string => value !== null);
    return config.multiSelect ? selected : (selected[0] ?? null);
  };

  /** Build the chips set's change payload. */
  const changeEvent = (values: (string | null)[], changed: string | null): ChipsChangeEvent => {
    return { value: selectionValue(values), selected: values, changed };
  };

  const currentValue = (): string | string[] | null => selectionValue(getSelectedValues());

  const selectSingle = (selectedChip: ChipComponent) => {
    if (config.multiSelect) return;
    component.chipInstances.forEach((chip) => {
      if (chip !== selectedChip && chip.isSelected()) chip.setSelected(false);
    });
  };

  /** Applies a click's toggle to the set. True when the set refused it. */
  const handleSelection = (selectedChip: ChipComponent): boolean | void => {
    if (selectedChip.isSelected()) selectSingle(selectedChip);

    // With selectionRequired, deselecting the last selected chip is refused, in either
    // mode. It used to be forced on every single-select set. FLO-257.
    // Nothing changed, so nothing is emitted, here or on the chip, and no
    // onSelect is called. FLO-550.
    if (config.selectionRequired && !selectedChip.isSelected() && getSelectedChips().length === 0) {
      selectedChip.setSelected(true);
      return true;
    }

    // Get all currently selected chips and their values
    const selectedChips = component.chipInstances.filter((chip) =>
      chip.isSelected(),
    );
    const selectedValues = selectedChips.map((chip) => chip.getValue());
    const changedValue = selectedChip ? selectedChip.getValue() : null;

    // onChange is registered with on("change") in chips.ts, so dispatch is the
    // only call. It hears selectByValue(values, true) the same way.
    dispatchEvent(CHIPS_EVENTS.CHANGE, changeEvent(selectedValues, changedValue));
  };

  // The set is an ARIA grid with one Tab stop (the m3.material.io chips' web roles,
  // FLO-261). Its focus targets, in order: a one-action chip's cell, or the buttons of
  // a two-action chip (its action, then its remove or trailing button).
  const targets = (): HTMLElement[] =>
    component.chipInstances
      .filter((chip) => !chip.isDisabled())
      .flatMap((chip) =>
        chip.element.hasAttribute("tabindex")
          ? [chip.element]
          : Array.from(chip.element.querySelectorAll<HTMLElement>(":scope > button")),
      );
  let current: HTMLElement | null = null;
  // Roving tabindex: the last focused target takes the set's one Tab stop, or the first.
  const syncTabStop = () => {
    const list = targets();
    if (!current || !list.includes(current)) current = list[0] ?? null;
    for (const chip of component.chipInstances) {
      if (chip.element.hasAttribute("tabindex")) chip.element.tabIndex = -1;
      chip.element.querySelectorAll<HTMLElement>(":scope > button").forEach((button) => { button.tabIndex = -1; });
    }
    if (current) current.tabIndex = 0;
  };

  /**
   * Moves focus between the set's focus targets: the arrows along the layout (Left and
   * Right follow the reading direction), Home and End to the ends. Enter and Space
   * belong to the focused chip.
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyboardNavigation = (event: KeyboardEvent) => {
    if (!keyboardEnabled) return;
    const list = targets();
    if (list.length === 0) return;
    const isVertical = !!(component.layout && component.layout.isVertical());
    // :dir() follows the direction into a shadow root, which closest("[dir]") does not
    const rtl = component.element.matches(":dir(rtl)");
    const back = isVertical ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    const forward = isVertical ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
    const from = list.indexOf(event.target as HTMLElement);
    let next: number;
    if (event.key === back) next = Math.max(0, from - 1);
    else if (event.key === forward) next = Math.min(list.length - 1, from + 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = list.length - 1;
    else return;
    event.preventDefault();
    event.stopPropagation();
    if (from === -1) next = 0;
    current = list[next]!;
    syncTabStop();
    current.focus();
    const owner = component.chipInstances.findIndex((chip) => chip.element.contains(current));
    if (owner >= 0) {
      focusedChipIndex = owner;
      if (component.layout && component.layout.isScrollable()) scrollToChip(owner);
    }
  };

  /**
   * Scrolls the chips container to make a specific chip visible
   * @param {ChipComponent|number} chipOrIndex - Chip instance or index to scroll to
   */
  const scrollToChip = (chipOrIndex: ChipComponent | number) => {
    const isScrollable = component.layout && component.layout.isScrollable();
    if (!isScrollable) return;

    const index =
      typeof chipOrIndex === "number"
        ? chipOrIndex
        : component.chipInstances.indexOf(chipOrIndex);

    if (index >= 0 && index < component.chipInstances.length) {
      const chipElement = component.chipInstances[index].element;
      const container = component.chipContainer || component.element;

      // Calculate scroll position to center the chip. No `behavior`: the
      // stylesheet scrolls a scrollable set smoothly, and the reduced-motion
      // reset turns that off; an explicit "smooth" would override it (FLO-553).
      const containerRect = container.getBoundingClientRect();
      const chipRect = chipElement.getBoundingClientRect();

      const isVertical = component.layout && component.layout.isVertical();

      if (isVertical) {
        // For vertical scroll
        const scrollTop =
          chipElement.offsetTop -
          container.offsetTop -
          containerRect.height / 2 +
          chipRect.height / 2;

        container.scrollTo({
          top: Math.max(0, scrollTop),
        });
      } else {
        // For horizontal scroll
        const scrollLeft =
          chipElement.offsetLeft -
          container.offsetLeft -
          containerRect.width / 2 +
          chipRect.width / 2;

        container.scrollTo({
          left: Math.max(0, scrollLeft),
        });
      }
    }
  };

  // chip.destroy() outside removeChip used to leave the chip in this list, so
  // the set still counted it and the arrows stopped on it (FLO-533). Drop it
  // the way removeChip unwires a chip, without remove or change. removeChip
  // and the set's own teardown destroy the chip themselves and must not take
  // this path as well.
  let managedDestroy = false;
  const dropDestroyedChip = (chip: ChipComponent) => {
    const index = component.chipInstances.indexOf(chip);
    if (index < 0) return;
    chip.element.removeEventListener("keydown", handleKeyboardNavigation);
    component.chipInstances.splice(index, 1);
    if (index === focusedChipIndex) focusedChipIndex = -1;
    else if (index < focusedChipIndex) focusedChipIndex--;
    syncTabStop();
  };
  const watchChipDestroy = (chip: ChipComponent) => {
    const destroy = chip.destroy.bind(chip);
    chip.destroy = () => {
      if (!managedDestroy) dropDestroyedChip(chip);
      destroy();
    };
  };

  /**
   * Adds a chip to the chips container
   * @param {Object} chipConfig - Configuration for the chip
   * @returns {ChipComponent} The created chip instance
   */
  const addChip = (chipConfig: ChipConfig): ChipComponent => {
    // Create chip with managedSelection flag to prevent double-toggle
    // The controller handles all selection logic via its own click handler
    const chipInstance = createChip({
      ...chipConfig,
      managedSelection: true,
      onSelected: selectSingle,
      cell: true,
      onRemoved: removeChip,
    });

    // Get the container element to append to
    const container = component.chipContainer || component.element;

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    fragment.appendChild(chipInstance.element);
    container.appendChild(fragment);

    component.chipInstances.push(chipInstance);

    // A selected programmatic addition moves a single selection just as a
    // click does. Finish the model update before the `add` handler reads it.
    if (chipInstance.isSelected()) selectSingle(chipInstance);

    // This click handler is the ONLY path to handleSelection
    chipInstance.on("click", () => {
      if (!chipInstance.isDisabled() && ["filter", "input"].includes(chipInstance.getType())) {
        chipInstance.toggleSelected();

        if (!handleSelection(chipInstance)) chipConfig.onSelect?.(chipInstance);

        // Update focus tracking
        focusedChipIndex = component.chipInstances.indexOf(chipInstance);
      }
    });

    chipInstance.on("focus", () => {
      focusedChipIndex = component.chipInstances.indexOf(chipInstance);
    });
    chipInstance.element.addEventListener("keydown", handleKeyboardNavigation);
    syncTabStop();
    watchChipDestroy(chipInstance);

    // Dispatch add event
    dispatchEvent(CHIPS_EVENTS.ADD, { value: currentValue(), chip: chipInstance });

    return chipInstance;
  };

  /**
   * Removes a chip from the chips container
   * @param {ChipComponent|number} chipOrIndex - Chip instance or index to remove
   */
  const removeChip = (chipOrIndex: ChipComponent | number) => {
    const index =
      typeof chipOrIndex === "number"
        ? chipOrIndex
        : component.chipInstances.indexOf(chipOrIndex);

    if (index >= 0 && index < component.chipInstances.length) {
      const chip = component.chipInstances[index];
      const chipValue = chip.getValue();
      const hadFocus = chip.element.contains(activeElementOf(chip.element));

      chip.element.removeEventListener("keydown", handleKeyboardNavigation);
      managedDestroy = true;
      try { chip.destroy(); } finally { managedDestroy = false; }
      component.chipInstances.splice(index, 1);

      // Update focused index if needed
      if (index === focusedChipIndex) {
        focusedChipIndex = -1;
      } else if (index < focusedChipIndex) {
        focusedChipIndex--;
      }

      syncTabStop();
      // Focus that was on the removed chip moves to the one that took its place, or
      // to the one before when it was the last: it used to fall to the page. FLO-256.
      if (hadFocus) {
        const chips = component.chipInstances;
        let next = Math.min(index, chips.length - 1);
        while (next >= 0 && chips[next].isDisabled()) next--;
        if (next < 0) next = chips.findIndex(candidate => !candidate.isDisabled());
        if (next >= 0) {
          focusedChipIndex = next;
          chips[next].focus();
        }
      }
      dispatchEvent(CHIPS_EVENTS.REMOVE, { value: currentValue(), chip, chipValue });
    }
  };

  /**
   * Gets all chip instances in the container
   * @returns {ChipComponent[]} Array of chip instances
   */
  const getChips = () => {
    return [...component.chipInstances];
  };

  /**
   * Gets currently selected chips
   * @returns {ChipComponent[]} Array of selected chip instances
   */
  const getSelectedChips = () => {
    return component.chipInstances.filter((chip: ChipComponent) =>
      chip.isSelected(),
    );
  };

  /**
   * Gets the values of selected chips
   * @returns {(string|null)[]} Array of selected chip values
   */
  const getSelectedValues = () => {
    return getSelectedChips().map((chip: ChipComponent) => chip.getValue());
  };

  /**
   * Selects chips by their values
   * @param {string|string[]} values - Value or array of values to select
   * @param {boolean} triggerEvent - Emits change when true; silent by default, as a native control (FLO-328)
   */
  const selectByValue = (
    values: string | string[],
    triggerEvent = false,
    exclusive = !config.multiSelect,
  ) => {
    const valueArray = Array.isArray(values) ? values : [values];
    let selectionChanged = false;

    if (exclusive) {
      // First handle deselection if exclusive mode
      component.chipInstances.forEach((chip: ChipComponent) => {
        const chipValue = chip.getValue();
        // A chip with no value matches no requested value. The null check is
        // what the runtime already did -- includes on a string[] never matches
        // null -- said in the type.
        const shouldSelect =
          chipValue !== null && valueArray.includes(chipValue);
        if (!shouldSelect && chip.isSelected()) {
          chip.setSelected(false);
          selectionChanged = true;
        }
      });
    }

    // Then handle selection
    component.chipInstances.forEach((chip: ChipComponent) => {
      const chipValue = chip.getValue();
      const shouldSelect =
        chipValue !== null && valueArray.includes(chipValue);
      if (shouldSelect && !chip.isSelected()) {
        chip.setSelected(true);
        selectionChanged = true;
      }
    });

    // Dispatch change event if any chip selection has changed AND if triggerEvent is true
    if (selectionChanged && triggerEvent) {
      const selectedValues = getSelectedValues();
      dispatchEvent(CHIPS_EVENTS.CHANGE, changeEvent(selectedValues, null));
    }
  };

  /**
   * Clears all selections
   * @param {boolean} triggerEvent - Emits change when true; silent by default, as a native control (FLO-328)
   */
  const clearSelection = (triggerEvent = false) => {
    const selectedValues = getSelectedValues();
    const hadSelectedChips = selectedValues.length > 0;

    component.chipInstances.forEach((chip: ChipComponent) => {
      chip.setSelected(false);
    });

    // Only dispatch if there were actually chips deselected AND triggerEvent is true
    if (hadSelectedChips && triggerEvent) {
      dispatchEvent(CHIPS_EVENTS.CHANGE, changeEvent([], null));
    }
  };

  /**
   * Enables keyboard navigation between chips in the container
   */
  const enableKeyboardNavigation = () => {
    keyboardEnabled = true;
    // Add keyboard event listener to the chips container
    component.chipInstances.forEach((chip: ChipComponent) => {
      chip.element.addEventListener("keydown", handleKeyboardNavigation);
    });
  };

  /**
   * Disables keyboard navigation
   */
  const disableKeyboardNavigation = () => {
    // The set's own listener kept handling the keys after the chips' were removed
    keyboardEnabled = false;
    component.chipInstances.forEach((chip: ChipComponent) => {
      chip.element.removeEventListener("keydown", handleKeyboardNavigation);
    });
  };

  // Initialize keyboard navigation
  enableKeyboardNavigation();

  // Setup event listeners when element is available
  // Focus that lands on a target by any means (a click, focus()) takes the Tab stop.
  const trackFocus = (event: FocusEvent) => {
    const target = event.target as HTMLElement;
    if (targets().includes(target)) { current = target; syncTabStop(); }
  };
  if (component.element) {
    component.element.addEventListener("keydown", handleKeyboardNavigation);
    component.element.addEventListener("focusin", trackFocus);
  }

  // Share the base resource scope; withLifecycle is composed after this feature.
  getCleanup(component).add(() => {
    managedDestroy = true;
    component.element.removeEventListener("keydown", handleKeyboardNavigation);
    component.element.removeEventListener("focusin", trackFocus);
    component.chipInstances.forEach(chip => {
      chip.element.removeEventListener("keydown", handleKeyboardNavigation);
      chip.destroy();
    });
    component.chipInstances.length = 0;
    // Empty the arrays in place. Replacing them would leave a dispatch that is
    // already walking the old array free to call listeners after destroy.
    Object.keys(eventListeners).forEach(event => { eventListeners[event].length = 0; });
  });

  return {
    ...component,
    // Add chips controller feature
    chips: {
      addChip,
      removeChip,
      getChips,
      getSelectedChips,
      getSelectedValues,
      selectByValue,
      clearSelection,
      scrollToChip,
    },
    // Add keyboard navigation feature
    keyboard: {
      enable: enableKeyboardNavigation,
      disable: disableKeyboardNavigation,
    },
    // Event management
    on(event: string, handler: EventCallback) {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }

      eventListeners[event].push(handler);
      return this;
    },
    off(event: string, handler: EventCallback) {
      if (eventListeners[event]) {
        const index = eventListeners[event].indexOf(handler);
        if (index !== -1) {
          eventListeners[event].splice(index, 1);
        }
      }
      return this;
    },
  };
};
