// src/components/drawer/features/state.ts
import { DrawerConfig } from "../types";
import { DRAWER_EVENTS } from "../constants";

/**
 * Component shape expected by withState
 */
interface StateBaseComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  emit: (event: string, data?: unknown) => void;
  [key: string]: unknown;
}

/**
 * Adds open/close state management, scrim, and keyboard dismiss to the drawer
 *
 * @param config - Drawer configuration
 * @returns Component enhancer function
 */
export const withState =
  (config: DrawerConfig) =>
  (component: StateBaseComponent): StateBaseComponent => {
    const isModal = config.variant === "modal";
    const dismissible = config.dismissible !== false;
    let isOpen = config.open === true;
    let scrimElement: HTMLElement | null = null;

    // Create scrim element for modal variant
    if (isModal) {
      scrimElement = document.createElement("div");
      scrimElement.className = component.getClass("drawer__scrim");

      if (dismissible) {
        scrimElement.addEventListener("click", () => {
          close();
        });
      }
    }

    // Keyboard handler for Escape key (modal only)
    const handleKeydown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isOpen && isModal && dismissible) {
        e.preventDefault();
        close();
      }
    };

    if (isModal) {
      document.addEventListener("keydown", handleKeydown);
    }

    /**
     * Opens the drawer
     */
    function open(): void {
      if (isOpen) return;

      isOpen = true;
      component.element.classList.add(`${component.getClass("drawer")}--open`);

      if (isModal && scrimElement) {
        scrimElement.classList.add(
          `${component.getClass("drawer__scrim")}--visible`,
        );
        // Prevent body scroll when modal is open
        document.body.style.overflow = "hidden";
      }

      // Set focus on first item or the drawer itself
      requestAnimationFrame(() => {
        const firstItem = component.element.querySelector(
          `.${component.getClass("drawer__item")}[tabindex="0"]`,
        ) as HTMLElement;
        if (firstItem) {
          firstItem.focus();
        } else {
          component.element.focus();
        }
      });

      component.emit(DRAWER_EVENTS.OPEN);

      if (config.onOpen) {
        config.onOpen();
      }
    }

    /**
     * Closes the drawer
     */
    function close(): void {
      if (!isOpen) return;

      isOpen = false;
      component.element.classList.remove(
        `${component.getClass("drawer")}--open`,
      );

      if (isModal && scrimElement) {
        scrimElement.classList.remove(
          `${component.getClass("drawer__scrim")}--visible`,
        );
        document.body.style.overflow = "";
      }

      component.emit(DRAWER_EVENTS.CLOSE);

      if (config.onClose) {
        config.onClose();
      }
    }

    /**
     * Toggles the drawer open/closed
     */
    function toggle(): void {
      if (isOpen) {
        close();
      } else {
        open();
      }
    }

    // Apply initial open state
    if (isOpen) {
      component.element.classList.add(`${component.getClass("drawer")}--open`);
      if (isModal && scrimElement) {
        scrimElement.classList.add(
          `${component.getClass("drawer__scrim")}--visible`,
        );
      }
    }

    return {
      ...component,
      scrimElement,
      drawerState: {
        open,
        close,
        toggle,
        isOpen: () => isOpen,
      },
      // Add cleanup for keyboard listener
      _stateCleanup: () => {
        if (isModal) {
          document.removeEventListener("keydown", handleKeydown);
          if (scrimElement && scrimElement.parentNode) {
            scrimElement.parentNode.removeChild(scrimElement);
          }
          document.body.style.overflow = "";
        }
      },
    };
  };
