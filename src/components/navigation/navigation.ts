// src/components/navigation/navigation.ts
import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import {
  withEvents,
  withDisabled,
  withLifecycle,
  withVariant,
  withPosition,
} from "../../core/compose/features";
import { withAPI } from "./api";
import { withNavItems } from "./features/items";
import { withController } from "./features/controller";
import { NavigationConfig, NavigationComponent } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Sets up proper ARIA roles based on navigation variant
 * @param {NavigationComponent} nav - Navigation component
 * @param {NavigationConfig} config - Navigation configuration
 */
const setupAccessibility = (
  nav: NavigationComponent,
  config: NavigationConfig
): void => {
  const { element } = nav;
  const variant = config.variant || "rail";
  const prefix = config.prefix || "mtrl";

  // Set appropriate aria-label
  element.setAttribute("aria-label", config.ariaLabel || "Main Navigation");

  // For bar navigation (bottom or top nav)
  if (variant === "bar") {
    // If bar navigation is acting as tabs
    const hasNestedItems =
      config.items?.some((item) => item.items?.length) || false;

    if (!hasNestedItems) {
      element.setAttribute("role", "tablist");
      element.setAttribute("aria-orientation", "horizontal");
    } else {
      element.setAttribute("role", "menubar");
      element.setAttribute("aria-orientation", "horizontal");
    }
  }
  // For rail and drawer navigation
  else {
    // Use standard navigation landmark
    element.setAttribute("role", "navigation");
  }

  // Set hidden state for modal drawers if needed
  if (
    (variant === "modal" ||
      (variant === "drawer" && config.behavior === "dismissible")) &&
    !config.expanded
  ) {
    element.classList.add(`${prefix}-nav--hidden`);
  }
};

/**
 * Creates a new Navigation component
 * @param {NavigationConfig} config - Navigation configuration
 * @returns {NavigationComponent} Navigation component instance
 */
const createNavigation = (
  config: NavigationConfig = {}
): NavigationComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const navigation = pipe(
      createBase,
      // First add events system - MUST be before other features that use events
      withEvents(),
      // Then add the element and other features
      withElement(getElementConfig(baseConfig)),
      // Add core features
      withVariant(baseConfig),
      withPosition(baseConfig),
      // Add navigation-specific features
      withNavItems(baseConfig),
      // Add controller for event delegation AFTER items are set up
      withController(baseConfig),
      // Add standard component features
      withDisabled(baseConfig),
      withLifecycle(),
      // Finally add the API - this must be last to include all features
      (comp) => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    const nav = navigation as NavigationComponent;

    // Set up proper ARIA roles and relationships
    setupAccessibility(nav, baseConfig);

    // Implement any initialization logic
    if (baseConfig.disabled) {
      nav.disable();
    }

    // Add explicit component identifier for debugging
    nav.element.dataset.componentType = "navigation";
    if (baseConfig.variant) {
      nav.element.dataset.variant = baseConfig.variant;
    }

    return nav;
  } catch (error) {
    throw new Error(
      `Failed to create navigation: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export default createNavigation;
