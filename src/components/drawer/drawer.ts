// src/components/drawer/drawer.ts
import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import {
  withEvents,
  withVariant,
  withLifecycle,
} from "../../core/compose/features";
import { withItems, withState, withHeadline } from "./features";
import { withAPI } from "./api";
import { DrawerConfig } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";
import { DRAWER_DEFAULTS } from "./constants";

/**
 * Creates a new Drawer component with the specified configuration.
 *
 * The Drawer component implements Material Design 3 navigation drawer with
 * support for standard (inline) and modal (overlay) variants. It provides
 * navigation destinations with icons, labels, badges, dividers, and section
 * labels following the MD3 specification.
 *
 * The Drawer component is created using a functional composition pattern,
 * applying various features through the pipe function.
 *
 * @param {DrawerConfig} config - Configuration options for the drawer
 *  This can include variant, items, headline, position, open state,
 *  and other drawer properties. See {@link DrawerConfig} for available options.
 *
 * @returns {DrawerComponent} A fully configured drawer component instance with
 *  all requested features applied. The returned component has methods for
 *  state management, item selection, and lifecycle management.
 *
 * @throws {Error} Throws an error if drawer creation fails for any reason
 *
 * @example
 * ```ts
 * // Create a standard navigation drawer
 * const drawer = createDrawer({
 *   variant: 'standard',
 *   headline: 'Mail',
 *   open: true,
 *   items: [
 *     { id: 'inbox', label: 'Inbox', icon: '<svg>...</svg>', badge: '24', active: true },
 *     { id: 'outbox', label: 'Outbox', icon: '<svg>...</svg>' },
 *     { type: 'divider' },
 *     { type: 'section', label: 'Labels' },
 *     { id: 'family', label: 'Family', icon: '<svg>...</svg>' },
 *   ],
 *   onSelect: (event) => console.log('Selected:', event.id),
 * });
 *
 * document.body.appendChild(drawer.element);
 *
 * // Create a modal drawer
 * const modalDrawer = createDrawer({
 *   variant: 'modal',
 *   headline: 'Navigation',
 *   items: [
 *     { id: 'home', label: 'Home', icon: '<svg>...</svg>', active: true },
 *     { id: 'settings', label: 'Settings', icon: '<svg>...</svg>' },
 *   ],
 * });
 *
 * document.body.appendChild(modalDrawer.element);
 * modalDrawer.open();
 * ```
 *
 * @category Components
 */
const createDrawer = (config: DrawerConfig = {}) => {
  const baseConfig = createBaseConfig(config);

  try {
    const drawer = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withHeadline(baseConfig),
      withItems(baseConfig),
      withState(baseConfig),
      withLifecycle(),
      // Assemble the DOM structure
      (component) => {
        const sheetEl = document.createElement("div");
        sheetEl.className = component.getClass("drawer__sheet");

        // Set drawer width as a CSS custom property on the root.
        // The sheet reads it via var(--drawer-width) in CSS.
        // The standard variant also uses it to animate the root width.
        const width = baseConfig.width;
        const widthValue = width
          ? typeof width === "number"
            ? `${width}px`
            : width
          : `${DRAWER_DEFAULTS.WIDTH}px`;
        component.element.style.setProperty("--drawer-width", widthValue);

        // Append headline if present
        if (component.headlineElement) {
          sheetEl.appendChild(component.headlineElement);
        }

        // Append items container
        if (component.itemsContainer) {
          sheetEl.appendChild(component.itemsContainer);
        }

        // For modal variant, insert scrim before the sheet in the root element
        if (component.scrimElement) {
          component.element.appendChild(component.scrimElement);
        }

        // Append sheet to root element
        component.element.appendChild(sheetEl);

        // Apply position class
        const position = baseConfig.position || "start";
        component.element.classList.add(
          `${component.getClass("drawer")}--${position}`,
        );

        return component;
      },
      (comp) => withAPI(getApiConfig(comp))(comp),
    )(baseConfig);

    return drawer;
  } catch (error) {
    console.error("Drawer creation error:", error);
    throw new Error(`Failed to create drawer: ${(error as Error).message}`);
  }
};

export default createDrawer;
