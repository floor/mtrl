// src/components/split-button/api.ts
import {
  BaseComponent,
  SplitButtonComponent,
  SplitButtonConfig,
  SplitButtonEvent,
  SplitButtonEventType,
} from "./types";
import type { MenuContent } from "../menu/types";
import { MENU, type MenuOwner } from "../menu/inner";
import { makeMenu } from "./features/menu";
import type { MenuComponent } from "../menu/types";
import { SPLIT_BUTTON_CLASSES, SPLIT_BUTTON_EVENTS } from "./constants";

interface ApiOptions {
  config: SplitButtonConfig;
  lifecycle: { destroy: () => void };
}

/**
 * Adds the public API and wires the two buttons together
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds the API
 */
export const withAPI =
  ({ config, lifecycle }: ApiOptions) =>
  (component: BaseComponent): SplitButtonComponent => {
    const element = component.element;
    const prefix = config.prefix || "mtrl";
    const { leading, trailing } = component;
    let menu = component[MENU];
    const expandedClass = `${prefix}-${SPLIT_BUTTON_CLASSES.EXPANDED}`;

    let expanded = false;
    let destroyed = false;

    const emit = (type: SplitButtonEventType, extra: Partial<SplitButtonEvent> = {}): void => {
      component.emit?.(type, {
        splitButton: api,
        expanded,
        originalEvent: null,
        ...extra,
      });
    };

    const setExpanded = (next: boolean, originalEvent: Event | null = null): void => {
      if (expanded === next) return;
      expanded = next;
      element.classList.toggle(expandedClass, expanded);
      trailing.element.setAttribute("aria-expanded", String(expanded));

      if (menu) {
        if (expanded) menu.open(originalEvent ?? undefined);
        else menu.close(originalEvent ?? undefined);
      }

      emit(expanded ? SPLIT_BUTTON_EVENTS.EXPAND : SPLIT_BUTTON_EVENTS.COLLAPSE, { originalEvent });
      emit(SPLIT_BUTTON_EVENTS.CHANGE, { originalEvent });
    };

    const api: SplitButtonComponent & MenuOwner = {
      element,
      leadingElement: leading.element as HTMLButtonElement,
      trailingElement: trailing.element as HTMLButtonElement,
      // Not a member (FLO-543): mtrl's own elements and tests reach it here
      [MENU]: menu,

      setItems(items: MenuContent[]): SplitButtonComponent {
        // Destroyed, it must not create a menu nobody would destroy
        if (destroyed) return this;
        if (menu) menu.setItems(items);
        else if (items.length) {
          wire((api[MENU] = menu = makeMenu(config, trailing.element, items)));
          if (expanded) menu.open();
        }
        return this;
      },

      getItems(): MenuContent[] {
        return menu ? menu.getItems() : [];
      },

      setText(text: string): SplitButtonComponent {
        leading.setText(text);
        return this;
      },

      getText(): string {
        return leading.getText();
      },

      setIcon(icon: string): SplitButtonComponent {
        leading.setIcon(icon);
        return this;
      },

      expand(): SplitButtonComponent {
        setExpanded(true);
        return this;
      },

      collapse(): SplitButtonComponent {
        setExpanded(false);
        return this;
      },

      isExpanded(): boolean {
        return expanded;
      },

      disable(): SplitButtonComponent {
        leading.disable();
        trailing.disable();
        return this;
      },

      enable(): SplitButtonComponent {
        leading.enable();
        trailing.enable();
        return this;
      },

      isDisabled(): boolean {
        return (leading.element as HTMLButtonElement).disabled === true;
      },

      on(event: SplitButtonEventType, handler: (event: SplitButtonEvent) => void): SplitButtonComponent {
        component.on?.(event, handler as (...args: unknown[]) => void);
        return this;
      },

      off(event: SplitButtonEventType, handler: (event: SplitButtonEvent) => void): SplitButtonComponent {
        component.off?.(event, handler as (...args: unknown[]) => void);
        return this;
      },

      destroy(): void {
        destroyed = true;
        menu?.destroy?.();
        leading.destroy();
        trailing.destroy();
        element.remove();
        lifecycle.destroy();
      },
    };

    // The leading button carries the action
    // Same payload/event confusion as dialog and button-group: this stored
    // the whole payload in `originalEvent`, which is declared `Event`.
    leading.on("click", ({ originalEvent: event }) => {
      emit(SPLIT_BUTTON_EVENTS.CLICK, { originalEvent: event });
    });

    // The trailing button opens and closes what it opens
    trailing.on("click", ({ originalEvent: event }) => {
      setExpanded(!expanded, event);
    });

    // A menu closed from the outside, by Escape or a click elsewhere, has to
    // bring the button's state back with it
    // Runs for the menu made at creation, or by the first setItems (FLO-543)
    const wire = (menu: MenuComponent): void => {
      // A trailing button that opens this component's own menu says so. The
      // menu's opener wiring sets a plain "true", so this comes after it.
      trailing.element.setAttribute("aria-haspopup", "menu");
      menu.on?.("close", () => {
        if (!expanded) return;
        expanded = false;
        element.classList.remove(expandedClass);
        trailing.element.setAttribute("aria-expanded", "false");
        emit(SPLIT_BUTTON_EVENTS.COLLAPSE);
        emit(SPLIT_BUTTON_EVENTS.CHANGE);
      });
      menu.on?.("select", (event: { item?: MenuContent }) => {
        const item = event?.item;
        emit(SPLIT_BUTTON_EVENTS.SELECT, { item, value: item && "id" in item ? (item.id ?? null) : null });
      });
    };
    if (menu) wire(menu);

    // Configured callbacks
    if (config.onClick) api.on(SPLIT_BUTTON_EVENTS.CLICK, config.onClick);
    if (config.onSelect) api.on(SPLIT_BUTTON_EVENTS.SELECT, config.onSelect);
    if (config.on) {
      for (const [type, handler] of Object.entries(config.on)) {
        if (handler) api.on(type as SplitButtonEventType, handler);
      }
    }

    return api;
  };
