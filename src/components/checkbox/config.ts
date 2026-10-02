// src/components/checkbox/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { CheckboxConfig, BaseComponent, ApiComponent, ApiOptions } from "./types";

/**
 * Default configuration for the Checkbox component
 */
export const defaultConfig: CheckboxConfig = {
  labelPosition: "end",
  // Space toggles a checkbox and Enter is left to its form, as natively and in
  // WAI-ARIA (Dr Jones, FLO-265). The switch keeps both, as its m3 page says.
  enterToggles: false,
};

/**
 * Creates the base configuration for Checkbox component
 * @param {CheckboxConfig} config - User provided configuration
 * @returns {CheckboxConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: CheckboxConfig = {}): CheckboxConfig =>
  createComponentConfig(defaultConfig, config, "checkbox") as CheckboxConfig;

/**
 * Generates element configuration for the Checkbox component
 * @param {CheckboxConfig} config - Checkbox configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: CheckboxConfig) =>
  createElementConfig(config, {
    tag: "div",
    className: config.class,
    interactive: true,
  });

const SVG = "http://www.w3.org/2000/svg";
const checkIcons = new WeakMap<Document, DocumentFragment>();

/**
 * The check icon's nodes, built once per document with DOM APIs and cloned for each
 * checkbox: parsing the same markup through the HTML sink for every
 * instance was measurable, and a cached string would skip a Trusted Types
 * policy, where DOM APIs involve none (FLO-336). The nodes are those the
 * markup parsed to, its whitespace included.
 */
const createCheckIcon = (doc: Document): DocumentFragment => {
  let checkIcon = checkIcons.get(doc);
  if (!checkIcon) {
    checkIcon = doc.createDocumentFragment();
    const svg = doc.createElementNS(SVG, "svg");
    // As the HTML parser sets it: in the XMLNS namespace
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", SVG);
    for (const [name, value] of [["viewBox", "0 0 24 24"], ["width", "20"], ["height", "20"], ["fill", "currentColor"]]) {
      svg.setAttribute(name, value);
    }
    const path = doc.createElementNS(SVG, "path");
    path.setAttribute("d", "M9.55 14.6L6.35 11.4l-1.9 1.9L9.55 18.4l10.9-10.9-1.9-1.9z");
    svg.append("\n      ", path, "\n    ");
    checkIcon.append("\n    ", svg, "\n  ");
    checkIcons.set(doc, checkIcon);
  }
  return checkIcon.cloneNode(true) as DocumentFragment;
};

/**
 * Adds check icon to checkbox
 * @param {CheckboxConfig} config - Component configuration
 */
export const withCheckIcon =
  (config: CheckboxConfig) =>
  <C extends BaseComponent>(component: C): C => {
    const doc = document;
    const icon = doc.createElement("span");
    icon.className = `${config.prefix}-checkbox__icon`;
    icon.appendChild(createCheckIcon(doc));

    component.element.appendChild(icon);
    return component;
  };

/**
 * Applies label position class to the component
 * @param {CheckboxConfig} config - Component configuration
 */
export const withLabelPosition =
  (config: CheckboxConfig) =>
  <C extends BaseComponent>(component: C): C => {
    const position = config.labelPosition || "end";
    const positionClass = `${config.prefix}-checkbox--label-${position}`;

    component.element.classList.add(positionClass);

    return component;
  };

/**
 * Creates API configuration for the Checkbox component
 * @param {ApiComponent} comp - Component with disabled, lifecycle, and checkable features
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: ApiComponent): ApiOptions => ({
  disabled: {
    enable: comp.disabled.enable,
    disable: comp.disabled.disable,
    isDisabled: comp.disabled.isDisabled,
  },
  lifecycle: {
    destroy: comp.lifecycle.destroy,
  },
  checkable: {
    check: comp.checkable.check,
    uncheck: comp.checkable.uncheck,
    toggle: comp.checkable.toggle,
    isChecked: comp.checkable.isChecked,
  },
});

export default defaultConfig;
