import { createElement } from "../../../core/dom/create";
import { ChipsConfig } from "../types";
import { ElementComponent } from "../../../core/compose/component";

/**
 * Creates the inner chips DOM structure using optimized createElement
 * This works alongside withElement to create chips-specific inner elements
 *
 * @param config Chips configuration
 * @returns Component enhancement function
 */
export const withDom =
  (config: ChipsConfig) =>
  <T extends ElementComponent>(
    component: T
  ): T & {
    chipContainer: HTMLElement;
    label?: HTMLElement;
    getChipContainer: () => HTMLElement;
    getLabel: () => HTMLElement | null;
  } => {
    // Get prefixed class names
    const getClass = (className: string) => component.getClass(className);

    // Set default values
    const hasLabel = config.label && config.label.trim().length > 0;
    const labelPosition = config.labelPosition || "start";

    // Create optional label element
    let label: HTMLElement | undefined;
    if (hasLabel) {
      label = createElement({
        tag: "label",
        className: getClass("chips-label"),
        text: config.label,
        container: component.element,
      });
    }

    // Create the chips container where individual chips will be added
    const chipContainer = createElement({
      tag: "div",
      className: getClass("chips-container"),
      container: component.element,
    });

    // Return enhanced component with inner elements
    return {
      ...component,
      chipContainer,
      label,

      // Add DOM query methods for compatibility
      getChipContainer: () => chipContainer,
      getLabel: () => label || null,
    };
  };
