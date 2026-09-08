// src/components/dialog/features.ts (partial updated code)

import { getOverlayConfig } from "./config";
import { DialogConfig, DialogButton } from "./types";
import createButton from "../button";
import { createDivider } from "../divider"; // Import the divider component
import { addClass, removeClass } from "../../core/dom/classes";

const DIALOG_EVENTS = {
  OPEN: "open",
  CLOSE: "close",
  BEFORE_OPEN: "beforeopen",
  BEFORE_CLOSE: "beforeclose",
  AFTER_OPEN: "afteropen",
  AFTER_CLOSE: "afterclose",
};

/**
 * Creates the dialog DOM structure with proper divider handling
 * @param config Dialog configuration
 * @returns Component enhancer with DOM structure
 */
/** Ids for the elements that name and describe a dialog */
let dialogCount = 0;

export const withStructure = (config: DialogConfig) => (component) => {
  // The headline names the dialog and the supporting text describes it, so
  // both need an id to point at (M3 dialog accessibility, "Labeling elements")
  const uid = `${component.getClass("dialog")}-${++dialogCount}`;
  const titleId = `${uid}-title`;
  const contentId = `${uid}-content`;

  // Create the overlay element
  const overlayConfig = getOverlayConfig(config);
  const overlay = document.createElement(overlayConfig.tag || "div");

  // Add overlay classes
  overlay.classList.add(component.getClass("dialog-overlay"));

  // Set overlay attributes safely
  if (
    overlayConfig.attributes &&
    typeof overlayConfig.attributes === "object"
  ) {
    Object.entries(overlayConfig.attributes).forEach(([key, value]) => {
      if (key && typeof key === "string" && value !== undefined) {
        overlay.setAttribute(key, String(value));
      }
    });
  }

  // Set custom z-index if provided
  if (config.zIndex) {
    overlay.style.zIndex = String(config.zIndex);
  }

  // A basic dialog has no close affordance; a full-screen one does
  const showCloseButton =
    config.closeButton ?? config.size === "fullscreen";

  // Create internal structure
  const createHeader = () => {
    const header = document.createElement("div");
    header.classList.add(component.getClass("dialog-header"));

    const headerContent = document.createElement("div");
    headerContent.classList.add(component.getClass("dialog-header-content"));
    header.appendChild(headerContent);

    if (config.title) {
      const title = document.createElement("h2");
      title.classList.add(component.getClass("dialog-header-title"));
      title.id = titleId;
      title.textContent = config.title;
      headerContent.appendChild(title);
    }

    if (config.subtitle) {
      const subtitle = document.createElement("p");
      subtitle.classList.add(component.getClass("dialog-header-subtitle"));
      subtitle.textContent = config.subtitle;
      headerContent.appendChild(subtitle);
    }

    if (showCloseButton) {
      const closeButton = document.createElement("button");
      closeButton.classList.add(component.getClass("dialog-header-close"));
      closeButton.setAttribute("aria-label", "Close dialog");
      closeButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;

      // Close button click handler with event-based communication
      closeButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Use the dialog:close custom event which will be listened for in withVisibility
        if (component && component.emit) {
          component.emit("dialog:close", { source: "closeButton" });
        }
      });

      header.appendChild(closeButton);
    }

    return header;
  };

  const createContent = () => {
    const content = document.createElement("div");
    content.classList.add(component.getClass("dialog-content"));
    content.id = contentId;

    if (config.content) {
      content.innerHTML = config.content;
    }

    return content;
  };

  const createFooter = () => {
    const footer = document.createElement("div");
    footer.classList.add(component.getClass("dialog-footer"));

    // Apply footer alignment
    const alignment = config.footerAlignment || "right";
    if (alignment !== "right") {
      addClass(footer, `${component.getClass("dialog-footer")}--${alignment}`);
    }

    // Add buttons if provided
    if (Array.isArray(config.buttons) && config.buttons.length > 0) {
      config.buttons.forEach((buttonConfig) =>
        addButton(footer, buttonConfig, component),
      );
    }

    return footer;
  };

  const createDividerElement = () => {
    const divider = createDivider({
      variant: "full-width",
      class: component.getClass("dialog-divider"),
    });
    return divider;
  };

  // Create the dialog structure
  const header = createHeader();
  const content = createContent();
  const footer =
    Array.isArray(config.buttons) && config.buttons.length > 0
      ? createFooter()
      : null;

  // Add dialog classes to the main component element
  addClass(component.element, component.getClass("dialog"));

  // Name and describe the dialog by its own content
  if (config.title) {
    component.element.setAttribute("aria-labelledby", titleId);
  } else if (config.ariaLabel) {
    component.element.setAttribute("aria-label", config.ariaLabel);
  }
  if (config.content) {
    component.element.setAttribute("aria-describedby", contentId);
  }

  // Apply size class
  const size = config.size || "medium";
  if (size !== "medium") {
    addClass(component.element, `${component.getClass("dialog")}--${size}`);
  }

  // Apply animation class
  const animation = config.animation || "scale";
  if (animation !== "scale") {
    addClass(
      component.element,
      `${component.getClass("dialog")}--${animation}`,
    );
  }

  // Add header to dialog
  component.element.appendChild(header);

  // Create divider elements if configured
  let headerDivider = null;
  let footerDivider = null;

  if (config.divider) {
    // Add header divider (between header and content)
    headerDivider = createDividerElement();
    headerDivider.element.classList.add(
      component.getClass("dialog-header-divider"),
    );
    component.element.appendChild(headerDivider.element);

    // If footer exists, add footer divider (between content and footer)
    if (footer) {
      footerDivider = createDividerElement();
      footerDivider.element.classList.add(
        component.getClass("dialog-footer-divider"),
      );
    }
  }

  // Add content to dialog
  component.element.appendChild(content);

  // Add footer divider before footer if it exists
  if (footerDivider) {
    component.element.appendChild(footerDivider.element);
  }

  // Add footer to dialog if exists
  if (footer) {
    component.element.appendChild(footer);
  }

  // Add the dialog element to the overlay
  overlay.appendChild(component.element);

  // Add overlay to container or document.body
  const container = config.container || document.body;
  container.appendChild(overlay);

  // Store elements in component
  return {
    ...component,
    overlay,
    structure: {
      header,
      content,
      footer,
      headerDivider,
      footerDivider,
      container,
    },
  };
};

/**
 * Add methods to manage dividers
 * @returns Component enhancer with divider management features
 */
export const withDivider = () => (component) => {
  return {
    ...component,
    divider: {
      /**
       * Shows or hides the dividers
       * @param show Whether to show the dividers
       * @returns Component instance for chaining
       */
      toggleDivider(show) {
        // Handle header divider
        if (show && !component.structure.headerDivider) {
          // Create and add header divider
          const headerDivider = createDivider({
            variant: "full-width",
            class: `${component.getClass(
              "dialog-divider",
            )} ${component.getClass("dialog-header-divider")}`,
          });

          // Insert after header, before content
          component.element.insertBefore(
            headerDivider.element,
            component.structure.content,
          );

          component.structure.headerDivider = headerDivider;

          // If footer exists, add footer divider
          if (
            component.structure.footer &&
            !component.structure.footerDivider
          ) {
            const footerDivider = createDivider({
              variant: "full-width",
              class: `${component.getClass(
                "dialog-divider",
              )} ${component.getClass("dialog-footer-divider")}`,
            });

            // Insert before footer
            component.element.insertBefore(
              footerDivider.element,
              component.structure.footer,
            );

            component.structure.footerDivider = footerDivider;
          }
        } else if (!show) {
          // Remove header divider if it exists
          if (component.structure.headerDivider) {
            component.structure.headerDivider.element.remove();
            component.structure.headerDivider = null;
          }

          // Remove footer divider if it exists
          if (component.structure.footerDivider) {
            component.structure.footerDivider.element.remove();
            component.structure.footerDivider = null;
          }
        }

        return component;
      },

      /**
       * Checks if the dialog has dividers
       * @returns Whether the dialog has dividers
       */
      hasDivider() {
        return component.structure.headerDivider !== null;
      },
    },
  };
};

/**
 * Adds button to dialog footer
 * @param footer Footer element
 * @param buttonConfig Button configuration
 * @param component Dialog component
 */
const addButton = (
  footer: HTMLElement,
  buttonConfig: DialogButton,
  component: any,
) => {
  const {
    text,
    variant = "text", // Using string literal directly instead of BUTTON_VARIANTS.TEXT
    onClick,
    closeDialog = true,
    autofocus = false,
    attributes = {},
  } = buttonConfig;

  const button = createButton({
    text,
    variant,
    ...attributes,
  });

  // Button click handler with event-based communication
  button.on("click", (event) => {
    let shouldClose = closeDialog;

    // Call onClick handler if provided
    if (typeof onClick === "function") {
      try {
        const result = onClick(event, component);
        if (result === false) {
          shouldClose = false;
        }
      } catch (err) {
        console.error("Error in onClick handler:", err);
      }
    }

    // Close dialog if needed - using event-based communication
    if (shouldClose) {
      if (component && component.emit) {
        component.emit("dialog:close", { source: "button", text });
      }
    }
  });

  // Set autofocus if needed
  if (autofocus) {
    button.element.setAttribute("autofocus", "true");
  }

  footer.appendChild(button.element);

  // Store button instance
  if (!component._buttons) {
    component._buttons = [];
  }

  component._buttons.push({
    config: buttonConfig,
    instance: button,
  });
};

/**
 * Add visibility control to dialog
 * @returns Component enhancer with visibility features
 */
export const withVisibility = () => (component) => {
  // Initial state
  const isOpen = component.config.open === true;

  // Setup animation duration
  const animationDuration = component.config.animationDuration || 150;

  // Helper functions to handle focus trap
  const focusableElements =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let previouslyFocusedElement: HTMLElement | null = null;
  let mouseDownOnOverlay = false;
  /** Elements taken out of the page while the dialog is open */
  const inerted: HTMLElement[] = [];
  /** The body's own overflow, put back when the dialog closes */
  let scrollLock: string | null = null;

  /**
   * The elements a person can tab to inside the dialog, looked up when they
   * press Tab rather than when the dialog opens, so buttons added later are
   * part of the cycle.
   */
  const focusable = (): HTMLElement[] =>
    (Array.from(
      component.element.querySelectorAll(focusableElements)
    ) as HTMLElement[]).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.getAttribute("aria-hidden") !== "true" &&
        (el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement)
    );

  /**
   * Tab cycles inside the dialog. The handler is kept here so it can be taken
   * off again: the previous one was removed by name from an inner scope that
   * never held it, so every open left another listener behind.
   */
  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const elements = focusable();
    if (elements.length === 0) {
      // Nothing to move to: keep focus on the dialog itself
      e.preventDefault();
      component.element.focus();
      return;
    }
    const first = elements[0];
    const last = elements[elements.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !component.element.contains(active))) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && active === last) {
      first.focus();
      e.preventDefault();
    }
  }

  /**
   * Everything outside the dialog is taken out of the page while it is open:
   * `inert` stops the pointer and the keyboard reaching it, and screen readers
   * stay inside. Without it the Tab handler alone leaves a reader free to walk
   * out of a modal dialog, and the page scrolls behind the scrim.
   */
  const inertBackground = (): void => {
    if (component.config.modal === false) return;
    const parent = component.overlay.parentElement;
    if (parent) {
      (Array.from(parent.children) as HTMLElement[]).forEach((sibling) => {
        if (sibling === component.overlay) return;
        if (sibling.hasAttribute("inert")) return;
        sibling.setAttribute("inert", "");
        inerted.push(sibling);
      });
    }
    const body = component.element.ownerDocument.body;
    if (body && scrollLock === null) {
      scrollLock = body.style.overflow;
      body.style.overflow = "hidden";
    }
  };

  const releaseBackground = (): void => {
    inerted.forEach((el) => el.removeAttribute("inert"));
    inerted.length = 0;
    const body = component.element.ownerDocument.body;
    if (body && scrollLock !== null) {
      body.style.overflow = scrollLock;
      scrollLock = null;
    }
  };

  const trapFocus = () => {
    inertBackground();

    // Focus lands on the first interactive element in the dialog, or on the
    // dialog itself when it has none (M3 dialog accessibility, "Initial focus")
    if (component.config.autofocus !== false) {
      const requested = component.element.querySelector("[autofocus]") as HTMLElement | null;
      const target = requested || focusable()[0] || component.element;
      target.focus();
    }

    if (component.config.trapFocus !== false) {
      component.element.addEventListener("keydown", handleTabKey);
    }
  };

  const releaseFocus = () => {
    component.element.removeEventListener("keydown", handleTabKey);
    releaseBackground();

    // Focus goes back where it came from, whether or not it was trapped
    if (previouslyFocusedElement) {
      if (previouslyFocusedElement.isConnected) previouslyFocusedElement.focus();
      previouslyFocusedElement = null;
    }
  };

  const setupEvents = () => {
    // Handle overlay close: require both mousedown and mouseup on overlay
    // to prevent accidental closes when dragging from dialog content to overlay
    if (component.config.closeOnOverlayClick !== false) {
      component.overlay.addEventListener("mousedown", handleOverlayMouseDown);
      document.addEventListener("mouseup", handleOverlayMouseUp);
    }

    // Handle Escape key
    if (component.config.closeOnEscape !== false) {
      document.addEventListener("keydown", handleEscKey);
    }
  };

  const cleanupEvents = () => {
    component.overlay.removeEventListener("mousedown", handleOverlayMouseDown);
    document.removeEventListener("mouseup", handleOverlayMouseUp);
    document.removeEventListener("keydown", handleEscKey);
  };

  function handleOverlayMouseDown(e: MouseEvent) {
    // Track that mousedown started on the overlay itself
    mouseDownOnOverlay = e.target === component.overlay;
  }

  function handleOverlayMouseUp(e: MouseEvent) {
    // Only close if both mousedown and mouseup were on the overlay
    if (mouseDownOnOverlay && e.target === component.overlay) {
      visibility.close();
    }
    mouseDownOnOverlay = false;
  }

  function handleEscKey(e: KeyboardEvent) {
    if (e.key === "Escape" && visibility.isOpen()) {
      visibility.close();
    }
  }

  // Setup initial state
  if (isOpen) {
    addClass(
      component.overlay,
      `${component.getClass("dialog-overlay")}--visible`,
    );
    addClass(component.element, `${component.getClass("dialog")}--visible`);

    // Setup focus trap and events
    trapFocus();
    setupEvents();
  }

  // Create visibility object with clean methods
  const visibility = {
    open() {
      // Don't do anything if already open
      if (this.isOpen()) return;

      // Store the currently focused element
      previouslyFocusedElement = document.activeElement as HTMLElement;

      // Trigger before open event
      const beforeOpenEvent = {
        dialog: component,
        defaultPrevented: false,
        preventDefault: () => {
          beforeOpenEvent.defaultPrevented = true;
        },
      };

      if (typeof component.emit === "function") {
        component.emit(DIALOG_EVENTS.BEFORE_OPEN, beforeOpenEvent);
      }

      // If event was prevented, don't open
      if (beforeOpenEvent.defaultPrevented) return;

      // Add to DOM if needed
      if (component.overlay && !component.overlay.parentNode) {
        const container = component.structure.container || document.body;
        container.appendChild(component.overlay);
      }

      // Show the overlay
      addClass(
        component.overlay,
        `${component.getClass("dialog-overlay")}--visible`,
      );

      // Show the dialog
      setTimeout(() => {
        addClass(component.element, `${component.getClass("dialog")}--visible`);

        // Setup focus trap and events
        trapFocus();
        setupEvents();

        // Trigger open event
        if (typeof component.emit === "function") {
          component.emit(DIALOG_EVENTS.OPEN, { dialog: component });

          setTimeout(() => {
            component.emit(DIALOG_EVENTS.AFTER_OPEN, { dialog: component });
          }, animationDuration);
        }
      }, 10);
    },

    close() {
      // console.log("Dialog close method called");

      // Trigger before close event
      const beforeCloseEvent = {
        dialog: component,
        defaultPrevented: false,
        preventDefault: () => {
          beforeCloseEvent.defaultPrevented = true;
        },
      };

      if (typeof component.emit === "function") {
        component.emit(DIALOG_EVENTS.BEFORE_CLOSE, beforeCloseEvent);
      }

      // If event was prevented, don't close
      if (beforeCloseEvent.defaultPrevented) {
        console.log("Dialog close prevented by event handler");
        return;
      }

      // Get class names
      const dialogVisibleClass = `${component.getClass("dialog")}--visible`;
      const overlayVisibleClass = `${component.getClass(
        "dialog-overlay",
      )}--visible`;

      // Remove dialog visible class
      removeClass(component.element, dialogVisibleClass);

      // Remove overlay visible class
      removeClass(component.overlay, overlayVisibleClass);

      // Release focus and cleanup events
      releaseFocus();
      cleanupEvents();

      // Trigger close events
      if (typeof component.emit === "function") {
        component.emit(DIALOG_EVENTS.CLOSE, { dialog: component });
      }

      // Remove from DOM after animation completes
      setTimeout(() => {
        if (component.overlay && component.overlay.parentNode) {
          component.overlay.parentNode.removeChild(component.overlay);
        }

        if (typeof component.emit === "function") {
          component.emit(DIALOG_EVENTS.AFTER_CLOSE, { dialog: component });
        }
      }, animationDuration);
    },

    toggle(open?: boolean) {
      if (open === undefined) {
        this.isOpen() ? this.close() : this.open();
      } else if (open) {
        this.open();
      } else {
        this.close();
      }
    },

    isOpen() {
      return component.element.classList.contains(
        `${component.getClass("dialog")}--visible`,
      );
    },
  };

  // Set up event listener for the dialog:close event
  if (component && component.on) {
    component.on("dialog:close", () => {
      visibility.close();
    });
  }

  return {
    ...component,
    visibility,
    // The API's destroy path releases focus through this
    focus: {
      trapFocus,
      releaseFocus,
    },
  };
};

/**
 * Adds content management features to dialog
 * @returns Component enhancer with content features
 */
export const withContent = () => (component) => {
  const headerElement = component.structure.header;
  const contentElement = component.structure.content;
  const footerElement = component.structure.footer;

  return {
    ...component,
    content: {
      /**
       * Sets dialog title
       * @param title Title text
       */
      setTitle(title: string) {
        let titleElement = headerElement.querySelector(
          `.${component.getClass("dialog-header-title")}`,
        );

        if (!titleElement && title) {
          // Create title element if it doesn't exist
          titleElement = document.createElement("h2");
          titleElement.classList.add(component.getClass("dialog-header-title"));
          headerElement
            .querySelector(`.${component.getClass("dialog-header-content")}`)
            .appendChild(titleElement);
        }

        if (titleElement) {
          titleElement.textContent = title;
        }
      },

      /**
       * Gets dialog title
       * @returns Title text
       */
      getTitle() {
        const titleElement = headerElement.querySelector(
          `.${component.getClass("dialog-header-title")}`,
        );
        return titleElement ? titleElement.textContent || "" : "";
      },

      /**
       * Sets dialog subtitle
       * @param subtitle Subtitle text
       */
      setSubtitle(subtitle: string) {
        let subtitleElement = headerElement.querySelector(
          `.${component.getClass("dialog-header-subtitle")}`,
        );

        if (!subtitleElement && subtitle) {
          // Create subtitle element if it doesn't exist
          subtitleElement = document.createElement("p");
          subtitleElement.classList.add(
            component.getClass("dialog-header-subtitle"),
          );
          headerElement
            .querySelector(`.${component.getClass("dialog-header-content")}`)
            .appendChild(subtitleElement);
        }

        if (subtitleElement) {
          subtitleElement.textContent = subtitle;
        }
      },

      /**
       * Gets dialog subtitle
       * @returns Subtitle text
       */
      getSubtitle() {
        const subtitleElement = headerElement.querySelector(
          `.${component.getClass("dialog-header-subtitle")}`,
        );
        return subtitleElement ? subtitleElement.textContent || "" : "";
      },

      /**
       * Sets dialog content
       * @param content Content HTML
       */
      setContent(content: string) {
        contentElement.innerHTML = content;
      },

      /**
       * Gets dialog content
       * @returns Content HTML
       */
      getContent() {
        return contentElement.innerHTML;
      },

      /**
       * Gets dialog header element
       * @returns Header element
       */
      getHeaderElement() {
        return headerElement;
      },

      /**
       * Gets dialog content element
       * @returns Content element
       */
      getContentElement() {
        return contentElement;
      },

      /**
       * Gets dialog footer element
       * @returns Footer element
       */
      getFooterElement() {
        return footerElement;
      },
    },
  };
};

/**
 * Adds button management features to dialog
 * @returns Component enhancer with button features
 */
export const withButtons = () => (component) => {
  // Initialize buttons array if not already done
  if (!component._buttons) {
    component._buttons = [];
  }

  return {
    ...component,
    buttons: {
      /**
       * Adds a button to the dialog footer
       * @param button Button configuration
       */
      addButton(button: DialogButton) {
        // Create footer if it doesn't exist
        let footer = component.structure.footer;

        if (!footer) {
          footer = document.createElement("div");
          footer.classList.add(component.getClass("dialog-footer"));

          // Apply footer alignment
          const alignment = component.config.footerAlignment || "right";
          if (alignment !== "right") {
            addClass(
              footer,
              `${component.getClass("dialog-footer")}--${alignment}`,
            );
          }

          component.element.appendChild(footer);
          component.structure.footer = footer;
        }

        // Add the button
        addButton(footer, button, component);
      },

      /**
       * Removes a button by index or text
       * @param indexOrText Button index or text
       */
      removeButton(indexOrText: number | string) {
        if (typeof indexOrText === "number") {
          // Remove by index
          if (indexOrText >= 0 && indexOrText < component._buttons.length) {
            const button = component._buttons[indexOrText];
            button.instance.destroy();
            component._buttons.splice(indexOrText, 1);
          }
        } else {
          // Remove by text
          const index = component._buttons.findIndex(
            (button) => button.config.text === indexOrText,
          );

          if (index !== -1) {
            const button = component._buttons[index];
            button.instance.destroy();
            component._buttons.splice(index, 1);
          }
        }

        // If no buttons left, remove footer
        if (component._buttons.length === 0 && component.structure.footer) {
          component.element.removeChild(component.structure.footer);
          component.structure.footer = null;
        }
      },

      /**
       * Gets all footer buttons
       * @returns Array of button configurations
       */
      getButtons() {
        return component._buttons.map((button) => button.config);
      },

      /**
       * Sets footer alignment
       * @param alignment Footer alignment
       */
      setFooterAlignment(alignment: string) {
        if (!component.structure.footer) return;

        // Define all possible alignments
        const ALL_ALIGNMENTS = ["right", "left", "center", "space-between"];

        // Remove existing alignment classes
        ALL_ALIGNMENTS.forEach((align) => {
          if (align !== "right") {
            removeClass(
              component.structure.footer,
              `${component.getClass("dialog-footer")}--${align}`,
            );
          }
        });

        // Add new alignment class if not right (default)
        if (alignment !== "right") {
          addClass(
            component.structure.footer,
            `${component.getClass("dialog-footer")}--${alignment}`,
          );
        }
      },
    },
  };
};

/**
 * Adds size management features to dialog
 * @returns Component enhancer with size features
 */
export const withSize = () => (component) => {
  return {
    ...component,
    size: {
      /**
       * Sets dialog size
       * @param size Size variant
       */
      setSize(size: string) {
        // Define all possible sizes
        const ALL_SIZES = [
          "small",
          "medium",
          "large",
          "fullwidth",
          "fullscreen",
        ];

        // Remove existing size classes
        ALL_SIZES.forEach((sizeValue) => {
          removeClass(
            component.element,
            `${component.getClass("dialog")}--${sizeValue}`,
          );
        });

        // Add new size class if not medium (default)
        if (size !== "medium") {
          addClass(
            component.element,
            `${component.getClass("dialog")}--${size}`,
          );
        }
      },
    },
  };
};

/**
 * Adds confirmation dialog features
 * @returns Component enhancer with confirm feature
 */
export const withConfirm = () => (component) => {
  return {
    ...component,
    confirm(options) {
      return new Promise((resolve) => {
        const {
          title = "Confirm",
          message,
          confirmText = "Yes",
          cancelText = "No",
          // Use string literals directly
          confirmVariant = "filled",
          cancelVariant = "text",
          size = "small",
        } = options;

        // Set dialog properties
        component.content.setTitle(title);
        component.content.setContent(`<p>${message}</p>`);
        component.size.setSize(size);

        // Clear existing buttons
        component._buttons.forEach((button) => button.instance.destroy());
        component._buttons = [];

        // Add confirm and cancel buttons
        component.buttons.addButton({
          text: confirmText,
          variant: confirmVariant,
          onClick: () => {
            resolve(true);
          },
        });

        component.buttons.addButton({
          text: cancelText,
          variant: cancelVariant,
          onClick: () => {
            resolve(false);
          },
        });

        // Open the dialog
        component.visibility.open();
      });
    },
  };
};
