// src/components/bottom-sheet/api.ts

import {
  BottomSheetComponent,
  BottomSheetEventHandlers,
  BottomSheetState,
} from "./types";

interface ApiOptions {
  state: {
    open: () => void;
    close: () => void;
    expand: () => void;
    collapse: () => void;
    isOpen: () => boolean;
    getState: () => BottomSheetState;
    release: () => void;
  };
  structure: {
    setContent: (content: string | HTMLElement) => void;
    setTitle: (title: string) => void;
  };
  drag: { release: () => void };
  lifecycle: { destroy: () => void };
}

interface BaseComponent {
  element: HTMLElement;
  getClass: (name: string) => string;
  on: (event: string, handler: (...args: never[]) => void) => unknown;
  off: (event: string, handler: (...args: never[]) => void) => unknown;
}

/**
 * The public surface. Every method here is backed by a feature above it; none
 * is declared and left unwired.
 */
export const withAPI =
  ({ state, structure, drag, lifecycle }: ApiOptions) =>
  <C extends BaseComponent>(component: C): BottomSheetComponent => {
    const api: BottomSheetComponent = {
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
      expand() {
        state.expand();
        return this;
      },
      collapse() {
        state.collapse();
        return this;
      },
      isOpen: () => state.isOpen(),
      getState: () => state.getState(),

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
        // release what the features put on the document before the element goes
        drag.release();
        state.release();
        lifecycle.destroy();
        component.element.remove();
      },
    };

    return api;
  };

/**
 * Registers the handlers given at creation.
 *
 * Several components in this library declare an `on` option and never read it,
 * so handlers passed at creation are silently dropped. This one reads it.
 */
export const applyEventHandlers = (
  component: { on: (event: string, handler: (...args: never[]) => void) => unknown },
  handlers?: BottomSheetEventHandlers
): void => {
  if (!handlers) return;
  for (const [event, handler] of Object.entries(handlers)) {
    if (typeof handler === "function") {
      component.on(event, handler as (...args: never[]) => void);
    }
  }
};
