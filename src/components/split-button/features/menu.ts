// src/components/split-button/features/menu.ts
//
// The menu the trailing button opens, when the caller hands over items. A
// split button that is given none still reports that its trailing button was
// activated, so the caller can open whatever it likes: the guidelines allow
// other surfaces, a menu is only the usual one.

import createMenu from "../../menu";
import type { MenuComponent, MenuContent } from "../../menu/types";
import { BaseComponent, SplitButtonConfig } from "../types";
import { SPLIT_BUTTON_DEFAULTS } from "../constants";

/**
 * Adds a menu anchored to the trailing button
 * @param {SplitButtonConfig} config - Component configuration
 * @returns {Function} Higher-order function that adds the menu
 */
export const withMenu =
  (config: SplitButtonConfig) =>
  (component: BaseComponent): BaseComponent => {
    if (!config.items || config.items.length === 0) return component;

    const trailing = component.trailingElement as HTMLElement;

    // Aligned to the trailing button and 4dp from it, as the guidelines ask.
    // The component opens and closes it, so the menu does not listen to the
    // opener itself.
    const menu: MenuComponent = createMenu({
      opener: trailing,
      items: config.items as MenuContent[],
      position: "bottom-end",
      offset: SPLIT_BUTTON_DEFAULTS.MENU_OFFSET,
      manualOpen: true,
      prefix: config.prefix,
    } as never);

    return {
      ...component,
      menu,
    };
  };
