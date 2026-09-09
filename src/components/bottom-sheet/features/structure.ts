// src/components/bottom-sheet/features/structure.ts

import { BottomSheetConfig } from "../types";
import { BOTTOM_SHEET_CLASSES, BOTTOM_SHEET_VARIANTS } from "../constants";

/**
 * Builds the parts of the sheet and puts the whole thing on the page.
 *
 * The root element is a fixed layer that holds the scrim and the sheet
 * container, so both are children of something that exists. An earlier sheet
 * in this library inserted its scrim through `element.parentNode` at
 * construction, when the element had no parent yet, and so never had a scrim
 * at all.
 */
export const withStructure =
  (config: BottomSheetConfig) =>
  <C extends { element: HTMLElement; getClass: (n: string) => string }>(
    component: C
  ) => {
    const { element, getClass } = component;
    const isModal = config.variant === BOTTOM_SHEET_VARIANTS.MODAL;

    element.classList.add(getClass(BOTTOM_SHEET_CLASSES.ROOT));
    element.classList.add(
      `${getClass(BOTTOM_SHEET_CLASSES.ROOT)}--${config.variant}`
    );

    // The scrim belongs to modal sheets only: a standard sheet leaves the page
    // usable, so covering it would be wrong
    let scrim: HTMLElement | null = null;
    if (isModal) {
      scrim = document.createElement("div");
      scrim.className = getClass(BOTTOM_SHEET_CLASSES.SCRIM);
      element.appendChild(scrim);
    }

    const container = document.createElement("div");
    container.className = getClass(BOTTOM_SHEET_CLASSES.CONTAINER);
    container.setAttribute("role", isModal ? "dialog" : "region");
    if (isModal) container.setAttribute("aria-modal", "true");
    container.tabIndex = -1;
    if (config.maxWidth) {
      container.style.maxWidth = `${config.maxWidth}px`;
    }

    // The handle says the sheet can be dragged, so dragging without one would
    // be a gesture with nothing to suggest it
    let handle: HTMLElement | null = null;
    if (config.dragHandle) {
      handle = document.createElement("div");
      handle.className = getClass(BOTTOM_SHEET_CLASSES.HANDLE);
      // decorative: the sheet is operable by button and key without it
      handle.setAttribute("aria-hidden", "true");
      container.appendChild(handle);
    }

    let title: HTMLElement | null = null;
    if (config.title) {
      const header = document.createElement("div");
      header.className = getClass(BOTTOM_SHEET_CLASSES.HEADER);

      title = document.createElement("h2");
      title.className = getClass(BOTTOM_SHEET_CLASSES.TITLE);
      title.textContent = config.title;
      title.id = `${getClass(BOTTOM_SHEET_CLASSES.TITLE)}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
      // the headline names the sheet, so a screen reader announces it on open
      container.setAttribute("aria-labelledby", title.id);

      header.appendChild(title);
      container.appendChild(header);
    }

    const content = document.createElement("div");
    content.className = getClass(BOTTOM_SHEET_CLASSES.CONTENT);
    if (config.content instanceof HTMLElement) {
      content.appendChild(config.content);
    } else if (typeof config.content === "string") {
      content.innerHTML = config.content;
    }
    container.appendChild(content);

    element.appendChild(container);
    (config.container || document.body).appendChild(element);

    return {
      ...component,
      structure: {
        scrim,
        container,
        handle,
        title,
        content,

        /** Replaces the body */
        setContent(next: string | HTMLElement): void {
          content.innerHTML = "";
          if (next instanceof HTMLElement) content.appendChild(next);
          else content.innerHTML = next;
        },

        /** Replaces the headline, adding one if the sheet had none */
        setTitle(next: string): void {
          if (title) {
            title.textContent = next;
            return;
          }
          const header = document.createElement("div");
          header.className = getClass(BOTTOM_SHEET_CLASSES.HEADER);
          title = document.createElement("h2");
          title.className = getClass(BOTTOM_SHEET_CLASSES.TITLE);
          title.textContent = next;
          title.id = `${getClass(BOTTOM_SHEET_CLASSES.TITLE)}-${Math.random()
            .toString(36)
            .slice(2, 9)}`;
          container.setAttribute("aria-labelledby", title.id);
          header.appendChild(title);
          container.insertBefore(header, content);
        },
      },
    };
  };
