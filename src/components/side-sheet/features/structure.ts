// src/components/side-sheet/features/structure.ts

import { SideSheetConfig } from "../types";
import { SIDE_SHEET_CLASSES, SIDE_SHEET_VARIANTS } from "../constants";

/** The close affordance: an icon button that needs a name, not just a glyph */
const CLOSE_ICON = `<svg viewBox="0 -960 960 960" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`;

/**
 * Builds the parts of the sheet and puts the whole thing on the page.
 *
 * As with the bottom sheet, the root element holds both the scrim and the
 * container, so neither depends on a parent that does not exist yet.
 */
export const withStructure =
  (config: SideSheetConfig) =>
  <C extends { element: HTMLElement; getClass: (n: string) => string }>(
    component: C
  ) => {
    const { element, getClass } = component;
    const isModal = config.variant === SIDE_SHEET_VARIANTS.MODAL;
    const root = getClass(SIDE_SHEET_CLASSES.ROOT);

    element.classList.add(root);
    element.classList.add(`${root}--${config.variant}`);
    element.classList.add(`${root}--${config.position}`);

    let scrim: HTMLElement | null = null;
    if (isModal) {
      scrim = document.createElement("div");
      scrim.className = getClass(SIDE_SHEET_CLASSES.SCRIM);
      element.appendChild(scrim);
    }

    const container = document.createElement("div");
    container.className = getClass(SIDE_SHEET_CLASSES.CONTAINER);
    container.setAttribute("role", isModal ? "dialog" : "complementary");
    if (isModal) container.setAttribute("aria-modal", "true");
    container.tabIndex = -1;
    if (config.width) container.style.width = `${config.width}px`;
    if (config.maxWidth) container.style.maxWidth = `${config.maxWidth}px`;

    let title: HTMLElement | null = null;
    let closeButton: HTMLButtonElement | null = null;

    if (config.title || config.closeButton) {
      const header = document.createElement("div");
      header.className = getClass(SIDE_SHEET_CLASSES.HEADER);

      if (config.title) {
        title = document.createElement("h2");
        title.className = getClass(SIDE_SHEET_CLASSES.TITLE);
        title.textContent = config.title;
        title.id = `${getClass(SIDE_SHEET_CLASSES.TITLE)}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        container.setAttribute("aria-labelledby", title.id);
        header.appendChild(title);
      }

      if (config.closeButton) {
        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = getClass(SIDE_SHEET_CLASSES.CLOSE);
        closeButton.innerHTML = CLOSE_ICON;
        // the glyph is decorative, so the button carries the name itself
        closeButton.setAttribute("aria-label", "Close");
        header.appendChild(closeButton);
      }

      container.appendChild(header);
    }

    const content = document.createElement("div");
    content.className = getClass(SIDE_SHEET_CLASSES.CONTENT);
    if (config.content instanceof HTMLElement) content.appendChild(config.content);
    else if (typeof config.content === "string") content.innerHTML = config.content;
    container.appendChild(content);

    element.appendChild(container);
    (config.container || document.body).appendChild(element);

    return {
      ...component,
      structure: {
        scrim,
        container,
        title,
        closeButton,
        content,

        setContent(next: string | HTMLElement): void {
          content.innerHTML = "";
          if (next instanceof HTMLElement) content.appendChild(next);
          else content.innerHTML = next;
        },

        setTitle(next: string): void {
          if (title) {
            title.textContent = next;
            return;
          }
          title = document.createElement("h2");
          title.className = getClass(SIDE_SHEET_CLASSES.TITLE);
          title.textContent = next;
          title.id = `${getClass(SIDE_SHEET_CLASSES.TITLE)}-${Math.random()
            .toString(36)
            .slice(2, 9)}`;
          container.setAttribute("aria-labelledby", title.id);

          let header = container.querySelector(
            `.${getClass(SIDE_SHEET_CLASSES.HEADER)}`
          );
          if (!header) {
            header = document.createElement("div");
            header.className = getClass(SIDE_SHEET_CLASSES.HEADER);
            container.insertBefore(header, content);
          }
          header.insertBefore(title, header.firstChild);
        },
      },
    };
  };
