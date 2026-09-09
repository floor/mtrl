// src/components/side-sheet/features/state.ts

import { SideSheetConfig } from "../types";
import {
  SIDE_SHEET_CLASSES,
  SIDE_SHEET_EVENTS,
  SIDE_SHEET_VARIANTS,
} from "../constants";

interface StateComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  emit: (event: string, data?: unknown) => unknown;
  structure: {
    scrim: HTMLElement | null;
    container: HTMLElement;
    closeButton: HTMLButtonElement | null;
  };
}

/**
 * Opening and closing, and everything that closes it.
 *
 * Events go through `component.emit`, which is what the composed events
 * enhancer provides.
 */
export const withState =
  (config: SideSheetConfig) =>
  <C extends StateComponent>(component: C) => {
    const { element, getClass, structure } = component;
    const root = getClass(SIDE_SHEET_CLASSES.ROOT);
    const isModal = config.variant === SIDE_SHEET_VARIANTS.MODAL;

    let open = false;
    let previouslyFocused: HTMLElement | null = null;

    const apply = (): void => {
      element.classList.toggle(`${root}--open`, open);
      element.setAttribute("aria-hidden", open ? "false" : "true");
      // a closed sheet must not intercept clicks meant for the page
      element.style.pointerEvents = open ? "" : "none";
    };

    function show(): void {
      if (open) return;
      if (isModal) previouslyFocused = document.activeElement as HTMLElement | null;
      open = true;
      apply();
      if (isModal) structure.container.focus();
      component.emit(SIDE_SHEET_EVENTS.OPEN);
    }

    function hide(): void {
      if (!open) return;
      open = false;
      apply();
      // focus returns to whatever opened the sheet
      if (isModal && previouslyFocused?.isConnected) {
        previouslyFocused.focus();
        previouslyFocused = null;
      }
      component.emit(SIDE_SHEET_EVENTS.CLOSE);
    }

    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape" || !open || !config.closeOnEscape) return;
      event.preventDefault();
      hide();
    };
    const handleScrimClick = (): void => {
      if (config.closeOnScrimClick) hide();
    };
    const handleCloseClick = (): void => hide();

    if (config.open) open = true;
    apply();

    if (config.closeOnEscape) document.addEventListener("keydown", handleKeydown);
    structure.scrim?.addEventListener("click", handleScrimClick);
    structure.closeButton?.addEventListener("click", handleCloseClick);

    return {
      ...component,
      state: {
        open: show,
        close: hide,
        toggle: () => (open ? hide() : show()),
        isOpen: () => open,
        /** Releases the listeners this feature put on the document */
        release: () => {
          document.removeEventListener("keydown", handleKeydown);
          structure.scrim?.removeEventListener("click", handleScrimClick);
          structure.closeButton?.removeEventListener("click", handleCloseClick);
        },
      },
    };
  };
