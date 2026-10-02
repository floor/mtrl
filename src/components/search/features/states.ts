// src/components/search/features/states.ts

import type { SearchComponent } from "../types";
import {
  SearchConfig,
  SearchState,
  SearchStructure,
  SearchViewMode,
  SearchVariant,
} from "../types";
import {
  SEARCH_STATES,
  SEARCH_VIEW_MODES,
  SEARCH_CLASSES,
  SEARCH_ICONS,
} from "../constants";

import { setHTML } from "../../../core/dom/html";
import { PREFIX } from "../../../core/config";
import { hideFromTopLayer, showInTopLayer } from "../../../core/dom/layer";
import { activeElementOf } from "../../../core/dom/focus";
import { getCleanup, type CleanupScope } from "../../../core/compose/cleanup";
/**
 * Adds state management features to the search component
 * Handles bar ↔ view transitions per MD3 specifications
 *
 * @param config Search configuration
 * @returns Component enhancer with state management features
 */
/** What this feature reads off the component it is handed. */
interface StatesHost {
  element: HTMLElement;
  getClass: (name: string) => string;
  resources?: CleanupScope;
  structure?: SearchStructure;
  emit?: (event: string, data: unknown) => unknown;
}

export const withStates =
  (config: SearchConfig, getComponent: () => SearchComponent) =>
  // Generic, so the accumulated pipeline type survives to the features after
  // this one. A concrete parameter type would erase it — the defect fixed in
  // textfield's withDensity (#109).
  <C extends StatesHost>(component: C) => {
  // Initialize state
  let currentState: SearchState = config.initialState || SEARCH_STATES.BAR;
  let currentViewMode: SearchViewMode =
    config.viewMode || SEARCH_VIEW_MODES.DOCKED;
  let currentVariant: SearchVariant = config.variant === "divided" ? "divided" : "contained";
  let isDisabled = config.disabled === true;
  const resources = getCleanup(component);
  let focusFrame: number | null = null;
  const cancelPendingFocus = (): void => {
    if (focusFrame !== null) cancelAnimationFrame(focusFrame);
    focusFrame = null;
  };
  resources.add(cancelPendingFocus);

  // Helper to get prefixed class names
  const getClass = (className: string): string => {
    return component.getClass ? component.getClass(className) : className;
  };

  // The open view (FLO-285). It was in the page's flow, so a docked view pushed
  // the page down, and a full-screen search covered the page even collapsed.
  // Now the bar and its results show in the top layer together, over the bar's
  // place: docked under the bar's width over a scrim, full screen as a modal
  // surface. The root keeps the bar's height in the page meanwhile.
  const prefix = config.prefix ?? PREFIX;
  const property = (name: string) => `--${prefix}-search-${name}`;
  const place = (): void => {
    const surface = component.structure?.surface;
    if (!surface) return;
    const box = component.element.getBoundingClientRect();
    surface.style.setProperty(property("top"), `${box.top}px`);
    surface.style.setProperty(property("left"), `${box.left}px`);
    surface.style.setProperty(property("width"), `${box.width}px`);
  };
  // A press on the scrim closes the docked view. A popover's backdrop is not
  // its own target, as a dialog's is: the press lands on whatever is under it,
  // which may not even take focus from the input, so it is caught here.
  const onOutside = (event: PointerEvent): void => {
    const surface = component.structure?.surface;
    if (surface && !event.composedPath().includes(surface)) collapseToBar(false);
  };
  // Escape on a full-screen view, from anywhere in it but the input (which
  // clears its text first): the modal dialog's cancel.
  const onCancel = (event: Event): void => {
    event.preventDefault();
    collapseToBar();
  };
  // Set while the surface moves in or out of the top layer, and focus is put
  // back, so that focus does not reopen the view.
  let refocusing = false;
  const openSurface = (): void => {
    const surface = component.structure?.surface;
    if (!surface) return;
    const focused = activeElementOf(component.element);
    place();
    refocusing = true;
    if (currentViewMode === SEARCH_VIEW_MODES.FULLSCREEN) {
      // A real modal: the page is inert, and Escape is the dialog's cancel.
      surface.removeAttribute("role");
      surface.setAttribute("aria-label", component.structure?.input.getAttribute("aria-label") || "Search");
      showInTopLayer(surface, { kind: "modal" });
      surface.addEventListener("cancel", onCancel);
    } else {
      showInTopLayer(surface, { kind: "popover-manual" });
      document.addEventListener("pointerdown", onOutside, true);
    }
    // showModal() focuses the first control, the back button; the person was
    // typing.
    if (focused instanceof HTMLElement && surface.contains(focused) && activeElementOf(component.element) !== focused) {
      focused.focus({ preventScroll: true });
    }
    refocusing = false;
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
  };
  const closeSurface = (restoreFocus = true): void => {
    const surface = component.structure?.surface;
    if (!surface) return;
    // Leaving the top layer hides the surface for a moment, which drops focus:
    // it goes back to where it was, unless the view was dismissed from outside.
    const focused = activeElementOf(component.element);
    const hadFocus = focused instanceof HTMLElement && surface.contains(focused);
    refocusing = true;
    hideFromTopLayer(surface);
    // A closed popover is hidden, and the bar must show in the page.
    surface.removeAttribute("popover");
    surface.removeAttribute("aria-label");
    // Closed, the <dialog> is only the bar's box.
    surface.setAttribute("role", "none");
    const now = activeElementOf(component.element);
    if (hadFocus && restoreFocus && now !== focused) focused.focus({ preventScroll: true });
    else if (!restoreFocus && now instanceof HTMLElement && surface.contains(now)) now.blur();
    refocusing = false;
    window.removeEventListener("scroll", place, true);
    window.removeEventListener("resize", place);
    surface.removeEventListener("cancel", onCancel);
    document.removeEventListener("pointerdown", onOutside, true);
  };

  /**
   * Transitions from bar state to view state
   */
  const expandToView = (): void => {
    if (currentState === SEARCH_STATES.VIEW || isDisabled || refocusing) {
      return;
    }

    const element = component.element;
    const structure = component.structure;

    // Update state
    currentState = SEARCH_STATES.VIEW;

    // Update classes
    element.classList.remove(getClass(SEARCH_CLASSES.STATE_BAR));
    element.classList.add(getClass(SEARCH_CLASSES.STATE_VIEW));

    // Update leading icon to back arrow
    if (structure?.leadingIcon) {
      setHTML(structure.leadingIcon, SEARCH_ICONS.BACK);
      structure.leadingIcon.setAttribute("aria-label", "Go back");
    }

    openSurface();
    structure?.input.setAttribute("aria-expanded", "true");

    // Focus input after transition
    if (structure?.input) {
      focusFrame = requestAnimationFrame(() => {
        focusFrame = null;
        structure.input.focus();
      });
    }

    // Emit expand event
    if (component.emit) {
      component.emit("expand", {
        component: getComponent(),
        state: currentState,
        viewMode: currentViewMode,
      });
    }
  };

  /**
   * Transitions from view state to bar state
   */
  const collapseToBar = (restoreFocus = true): void => {
    if (currentState === SEARCH_STATES.BAR) {
      return;
    }

    const element = component.element;
    const structure = component.structure;

    // Update state
    currentState = SEARCH_STATES.BAR;
    cancelPendingFocus();

    // Update classes
    element.classList.remove(getClass(SEARCH_CLASSES.STATE_VIEW));
    element.classList.add(getClass(SEARCH_CLASSES.STATE_BAR));

    // Update leading icon to search icon
    if (structure?.leadingIcon) {
      setHTML(structure.leadingIcon, config.leadingIcon || SEARCH_ICONS.SEARCH);
      structure.leadingIcon.setAttribute("aria-label", "Search");
    }

    closeSurface(restoreFocus);
    structure?.input.setAttribute("aria-expanded", "false");
    structure?.input.removeAttribute("aria-activedescendant");
    if (structure?.status) structure.status.textContent = "";

    // Emit collapse event
    if (component.emit) {
      component.emit("collapse", {
        component: getComponent(),
        state: currentState,
        viewMode: currentViewMode,
      });
    }
  };

  /**
   * Sets the view mode (docked or fullscreen)
   */
  const setViewMode = (mode: SearchViewMode): void => {
    if (mode === currentViewMode) {
      return;
    }

    const element = component.element;

    // Remove current view mode class
    element.classList.remove(
      getClass(
        currentViewMode === SEARCH_VIEW_MODES.DOCKED
          ? SEARCH_CLASSES.VIEW_DOCKED
          : SEARCH_CLASSES.VIEW_FULLSCREEN,
      ),
    );

    // Update state
    currentViewMode = mode;

    // Add new view mode class
    element.classList.add(
      getClass(
        mode === SEARCH_VIEW_MODES.DOCKED
          ? SEARCH_CLASSES.VIEW_DOCKED
          : SEARCH_CLASSES.VIEW_FULLSCREEN,
      ),
    );

    // An open view reopens in the new mode: modal or not.
    if (currentState === SEARCH_STATES.VIEW) {
      closeSurface();
      openSurface();
    }
  };

  /** Sets the variant, contained or divided (FLO-287). */
  const setVariant = (variant: SearchVariant): void => {
    if (variant === currentVariant) return;
    component.element.classList.replace(
      getClass(currentVariant === "divided" ? SEARCH_CLASSES.VARIANT_DIVIDED : SEARCH_CLASSES.VARIANT_CONTAINED),
      getClass(variant === "divided" ? SEARCH_CLASSES.VARIANT_DIVIDED : SEARCH_CLASSES.VARIANT_CONTAINED),
    );
    currentVariant = variant;
  };

  /**
   * Disables the component
   */
  const disableComponent = (): void => {
    isDisabled = true;

    const element = component.element;
    const structure = component.structure;

    element.classList.add(getClass(SEARCH_CLASSES.DISABLED));
    element.setAttribute("aria-disabled", "true");

    // Disable input
    if (structure?.input) {
      structure.input.disabled = true;
    }

    // Disable interactive elements
    const interactiveElements = [
      structure?.leadingIcon,
      structure?.clearButton,
    ].filter(Boolean);

    // Add trailing items if they exist
    if (structure?.trailingContainer) {
      const trailingButtons =
        structure.trailingContainer.querySelectorAll("button");
      trailingButtons.forEach((btn) => interactiveElements.push(btn));
    }

    interactiveElements.forEach((el) => {
      if (el) {
        (el as HTMLElement).tabIndex = -1;
        el.setAttribute("aria-disabled", "true");
      }
    });
  };

  /**
   * Enables the component
   */
  const enableComponent = (): void => {
    isDisabled = false;

    const element = component.element;
    const structure = component.structure;

    element.classList.remove(getClass(SEARCH_CLASSES.DISABLED));
    element.setAttribute("aria-disabled", "false");

    // Enable input
    if (structure?.input) {
      structure.input.disabled = false;
    }

    // Enable interactive elements
    const interactiveElements = [
      structure?.leadingIcon,
      structure?.clearButton,
    ].filter(Boolean);

    // Add trailing items if they exist
    if (structure?.trailingContainer) {
      const trailingButtons =
        structure.trailingContainer.querySelectorAll("button");
      trailingButtons.forEach((btn) => interactiveElements.push(btn));
    }

    interactiveElements.forEach((el) => {
      if (el) {
        (el as HTMLElement).tabIndex = 0;
        el.setAttribute("aria-disabled", "false");
      }
    });

    // Clear button special case - only enable if there's text
    if (structure?.clearButton && structure.input && !structure.input.value) {
      structure.clearButton.tabIndex = -1;
    }
  };

  /**
   * Updates the populated state class based on input value
   */
  const updatePopulatedState = (hasValue: boolean): void => {
    const element = component.element;

    if (hasValue) {
      element.classList.add(getClass(SEARCH_CLASSES.POPULATED));
    } else {
      element.classList.remove(getClass(SEARCH_CLASSES.POPULATED));
    }
  };

  /**
   * Updates the focused state class
   */
  const updateFocusedState = (isFocused: boolean): void => {
    const element = component.element;

    if (isFocused) {
      element.classList.add(getClass(SEARCH_CLASSES.FOCUSED));
    } else {
      element.classList.remove(getClass(SEARCH_CLASSES.FOCUSED));
    }
  };

  // Created open: the surface goes to the top layer once the search is in the
  // page, which it cannot be before.
  if (currentState === SEARCH_STATES.VIEW) {
    setTimeout(() => {
      if (currentState === SEARCH_STATES.VIEW && component.element.isConnected) openSurface();
    }, 0);
  }

  // Apply initial disabled state if needed
  if (isDisabled) {
    // Use setTimeout to ensure structure is ready
    setTimeout(() => {
      disableComponent();
    }, 0);
  }

  // Return enhanced component with state management
  return {
    ...component,

    // State management API
    states: {
      /**
       * Expands to search view
       */
      expand: expandToView,

      /**
       * Collapses to search bar
       */
      collapse: collapseToBar,

      /**
       * Gets the current state
       */
      getState: (): SearchState => currentState,

      /**
       * Checks if currently expanded (in view state)
       */
      isExpanded: (): boolean => currentState === SEARCH_STATES.VIEW,

      /**
       * Sets the view mode
       */
      setViewMode,

      /**
       * Gets the current view mode
       */
      getViewMode: (): SearchViewMode => currentViewMode,

      setVariant,

      getVariant: (): SearchVariant => currentVariant,

      /**
       * Updates populated state
       */
      updatePopulatedState,

      /**
       * Updates focused state
       */
      updateFocusedState,
    },

    // Disabled state management (for backward compatibility)
    disabled: {
      /**
       * Enables the component
       */
      enable(): typeof this {
        enableComponent();
        return this;
      },

      /**
       * Disables the component
       */
      disable(): typeof this {
        disableComponent();
        return this;
      },

      /**
       * Checks if component is disabled
       */
      isDisabled: (): boolean => isDisabled,
    },
  };
};
