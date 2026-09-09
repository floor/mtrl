// src/components/bottom-sheet/features/state.ts

import { BottomSheetConfig, BottomSheetState } from "../types";
import {
  BOTTOM_SHEET_CLASSES,
  BOTTOM_SHEET_EVENTS,
  BOTTOM_SHEET_STATES,
  BOTTOM_SHEET_VARIANTS,
} from "../constants";

interface StateComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  emit: (event: string, data?: unknown) => unknown;
  structure: {
    scrim: HTMLElement | null;
    container: HTMLElement;
  };
}

/**
 * Opening, closing and the two open heights.
 *
 * Events go through `component.emit`, which is what the composed events
 * enhancer provides. Reaching for `component.events.emit` throws, because that
 * shape comes from a different enhancer the barrel exports under another name.
 */
export const withState =
  (config: BottomSheetConfig) =>
  <C extends StateComponent>(component: C) => {
    const { element, getClass, structure } = component;
    const root = getClass(BOTTOM_SHEET_CLASSES.ROOT);
    const isModal = config.variant === BOTTOM_SHEET_VARIANTS.MODAL;

    let state: BottomSheetState =
      config.initialState ?? BOTTOM_SHEET_STATES.HIDDEN;
    /** What had focus before a modal sheet took it */
    let previouslyFocused: HTMLElement | null = null;

    const applyState = (next: BottomSheetState): void => {
      for (const name of Object.values(BOTTOM_SHEET_STATES)) {
        element.classList.toggle(`${root}--${name}`, name === next);
      }
      const open = next !== BOTTOM_SHEET_STATES.HIDDEN;
      element.setAttribute("aria-hidden", open ? "false" : "true");
      // a closed sheet must not be reachable by keyboard behind the page
      element.style.pointerEvents = open ? "" : "none";
    };

    const setState = (next: BottomSheetState): void => {
      if (next === state) return;
      const previous = state;
      state = next;
      applyState(next);
      component.emit(BOTTOM_SHEET_EVENTS.STATE_CHANGE, { state: next, previous });
    };

    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      if (state === BOTTOM_SHEET_STATES.HIDDEN) return;
      if (!config.closeOnEscape) return;
      event.preventDefault();
      close();
    };

    const handleScrimClick = (): void => {
      if (config.closeOnScrimClick) close();
    };

    function open(to: BottomSheetState = BOTTOM_SHEET_STATES.PARTIAL): void {
      if (state === to) return;
      const wasHidden = state === BOTTOM_SHEET_STATES.HIDDEN;

      if (wasHidden && isModal) {
        previouslyFocused = document.activeElement as HTMLElement | null;
      }

      setState(to);

      if (wasHidden) {
        if (isModal) structure.container.focus();
        component.emit(BOTTOM_SHEET_EVENTS.OPEN);
      }
    }

    function close(): void {
      if (state === BOTTOM_SHEET_STATES.HIDDEN) return;
      setState(BOTTOM_SHEET_STATES.HIDDEN);

      // focus goes back where it came from, so a keyboard user is not dropped
      // at the top of the page
      if (isModal && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
        previouslyFocused = null;
      }

      component.emit(BOTTOM_SHEET_EVENTS.CLOSE);
    }

    applyState(state);
    if (config.closeOnEscape) document.addEventListener("keydown", handleKeydown);
    structure.scrim?.addEventListener("click", handleScrimClick);

    return {
      ...component,
      state: {
        open,
        close,
        expand: () => open(BOTTOM_SHEET_STATES.EXPANDED),
        collapse: () => open(BOTTOM_SHEET_STATES.PARTIAL),
        isOpen: () => state !== BOTTOM_SHEET_STATES.HIDDEN,
        getState: () => state,
        setState,
        /** Releases the listeners this feature put on the document */
        release: () => {
          document.removeEventListener("keydown", handleKeydown);
          structure.scrim?.removeEventListener("click", handleScrimClick);
        },
      },
    };
  };
