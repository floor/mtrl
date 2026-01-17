// src/components/chips/chip/chip.ts
import { pipe } from "../../../core/compose";
import { createBase, withElement } from "../../../core/compose/component";
import {
  withEvents,
  withVariant,
  withRipple,
  withDisabled,
  withLifecycle,
} from "../../../core/compose/features";
import { withAPI } from "./api";
import { ChipConfig, ChipComponent } from "../types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Creates a new Chip component
 * @param {ChipConfig} config - Chip configuration
 * @returns {ChipComponent} Chip component instance
 */
const createChip = (config: ChipConfig = {}): ChipComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create base component with core features
    const chip = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withDisabled(baseConfig),
      withRipple(baseConfig),
      withLifecycle(),
    )(baseConfig);

    // Create a container for the chip content to ensure proper ordering
    const contentContainer = document.createElement("div");
    contentContainer.className = `${chip.getClass("chip")}-content`;
    contentContainer.style.display = "flex";
    contentContainer.style.alignItems = "center";
    contentContainer.style.gap = "8px";
    contentContainer.style.width = "100%";
    chip.element.appendChild(contentContainer);

    // Add leading icon if provided
    if (config.leadingIcon || config.icon) {
      const leadingIconElement = document.createElement("span");
      leadingIconElement.className = `${chip.getClass("chip")}-leading-icon`;
      leadingIconElement.innerHTML = config.leadingIcon || config.icon || "";
      contentContainer.appendChild(leadingIconElement);
    }

    // Add text element if provided
    if (config.text) {
      const textElement = document.createElement("span");
      textElement.className = `${chip.getClass("chip")}-text`;
      textElement.textContent = config.text;
      contentContainer.appendChild(textElement);
    }

    // Add trailing icon if provided
    if (config.trailingIcon) {
      const trailingIconElement = document.createElement("span");
      trailingIconElement.className = `${chip.getClass("chip")}-trailing-icon`;
      trailingIconElement.innerHTML = config.trailingIcon;

      // Add click handler for trailing icon
      if (config.onTrailingIconClick) {
        trailingIconElement.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent chip click event
          config.onTrailingIconClick(chip as unknown as ChipComponent);
        });
      }

      contentContainer.appendChild(trailingIconElement);
    }

    // Add selected class if needed
    if (config.selected) {
      chip.element.classList.add(`${chip.getClass("chip")}--selected`);
      chip.element.setAttribute("aria-selected", "true");
    }

    // Set data-value attribute if provided
    if (config.value) {
      chip.element.setAttribute("data-value", config.value);
    }

    // Add API methods to the component
    const enhancedChip = withAPI(getApiConfig(chip))(chip);

    // Initialize value if not already set
    if (!chip.element.hasAttribute("data-value") && config.text) {
      enhancedChip.getValue(); // This will trigger the automatic value generation in our fixed API
    }

    // Add click handler for selection toggle
    // Skip if managedSelection is true (chip is managed by a chips container)
    const isSelectableVariant =
      config.variant === "filter" ||
      config.variant === "assist" ||
      config.variant === "suggestion" ||
      config.selectable;

    if (isSelectableVariant && !config.managedSelection) {
      chip.element.addEventListener("click", () => {
        if (enhancedChip.isDisabled()) return;

        const wasSelected = enhancedChip.isSelected();
        enhancedChip.toggleSelected();
        const isNowSelected = enhancedChip.isSelected();

        // Call onChange with correct parameters
        if (config.onChange && wasSelected !== isNowSelected) {
          config.onChange(isNowSelected, enhancedChip);
        }

        // Call onSelect with consistent parameters
        if (config.onSelect) {
          config.onSelect(enhancedChip);
        }
      });
    }

    return enhancedChip as unknown as ChipComponent;
  } catch (error) {
    console.error("Chip creation error:", error);
    throw new Error(`Failed to create chip: ${(error as Error).message}`);
  }
};

export default createChip;
