// src/components/split-button/features/buttons.ts
//
// The two buttons. Both are the library's own button, so they bring the M3
// colours, state layers, focus ring and touch target with them; this feature
// only gives them their place in the pair and the shapes that go with it.

import createButton from "../../button";
import type { ButtonComponent } from "../../button/types";
import { BaseComponent, SplitButtonConfig } from "../types";
import { SPLIT_BUTTON_CLASSES, SPLIT_BUTTON_CHEVRON } from "../constants";

/**
 * Adds the leading and trailing buttons
 * @param {SplitButtonConfig} config - Component configuration
 * @returns {Function} Higher-order function that adds both buttons
 */
export const withButtons =
  (config: SplitButtonConfig) =>
  (component: BaseComponent): BaseComponent => {
    const prefix = config.prefix || "mtrl";
    const cls = (name: string): string => `${prefix}-${name}`;

    const shared = {
      variant: config.variant,
      size: config.size,
      disabled: config.disabled,
      prefix,
    };

    // The leading button carries the action: a label, an icon, or both
    const leading: ButtonComponent = createButton({
      ...shared,
      text: config.text,
      icon: config.icon,
      ariaLabel: config.ariaLabel,
      class: cls(SPLIT_BUTTON_CLASSES.LEADING),
    });

    // The trailing button opens the choices. It is a button rather than an
    // icon button so it shares the leading button's colours exactly, which is
    // what the spec asks for: the two halves are one control.
    const trailing: ButtonComponent = createButton({
      ...shared,
      icon: SPLIT_BUTTON_CHEVRON,
      iconSize: "inherit",
      ariaLabel: config.trailingLabel,
      class: cls(SPLIT_BUTTON_CLASSES.TRAILING),
    });

    const chevron = trailing.element.querySelector("svg");
    chevron?.classList.add(cls(SPLIT_BUTTON_CLASSES.CHEVRON));

    // It opens something, and says whether that something is open. The exact
    // popup type is set once the menu exists, because the menu's own opener
    // wiring writes this attribute too.
    trailing.element.setAttribute("aria-haspopup", "true");
    trailing.element.setAttribute("aria-expanded", "false");

    component.element.appendChild(leading.element);
    component.element.appendChild(trailing.element);

    return {
      ...component,
      leading,
      trailing,
      leadingElement: leading.element,
      trailingElement: trailing.element,
    };
  };
