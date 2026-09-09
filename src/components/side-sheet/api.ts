// src/components/side-sheet/api.ts

import { SideSheetComponent, SideSheetEventHandlers } from "./types";

interface ApiOptions {
  state: {
    open: () => void;
    close: () => void;
    toggle: () => void;
    isOpen: () => boolean;
    release: () => void;
  };
  structure: {
    setContent: (content: string | HTMLElement) => void;
    setTitle: (title: string) => void;
  };
  lifecycle: { destroy: () => void };
}

interface BaseComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  on: (event: string, handler: (...args: never[]) => void) => unknown;
  off: (event: string, handler: (...args: never[]) => void) => unknown;
}

/**
 * The public surface. Every method is backed by a feature; none is declared
 * and left unwired.
 */
export const withAPI =
  ({ state, structure, lifecycle }: ApiOptions) =>
  <C extends BaseComponent>(component: C): SideSheetComponent => {
    const api: SideSheetComponent = {
      element: component.element,
      getClass: component.getClass,

      open() {
        state.open();
        return this;
      },
      close() {
        state.close();
        return this;
      },
      toggle() {
        state.toggle();
        return this;
      },
      isOpen: () => state.isOpen(),

      setContent(content) {
        structure.setContent(content);
        return this;
      },
      setTitle(title) {
        structure.setTitle(title);
        return this;
      },

      on(event, handler) {
        component.on(event as string, handler as (...args: never[]) => void);
        return this;
      },
      off(event, handler) {
        component.off(event as string, handler as (...args: never[]) => void);
        return this;
      },

      destroy() {
        state.release();
        lifecycle.destroy();
        component.element.remove();
      },
    };

    return api;
  };

/** Registers the handlers given at creation */
export const applyEventHandlers = (
  component: { on: (event: string, handler: (...args: never[]) => void) => unknown },
  handlers?: SideSheetEventHandlers
): void => {
  if (!handlers) return;
  for (const [event, handler] of Object.entries(handlers)) {
    if (typeof handler === "function") {
      component.on(event, handler as (...args: never[]) => void);
    }
  }
};
