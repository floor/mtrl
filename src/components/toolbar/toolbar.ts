// src/components/toolbar/toolbar.ts
import { processClassNames } from "../../core/config/component";

import { pipe } from "../../core/compose/pipe";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { getCleanup } from "../../core/compose/cleanup";
import { PREFIX } from "../../core/config";
import { createRoving } from "../../core/dom/roving";
import createIconButton from "../icon-button/icon-button";
import createButton from "../button";
import { createConfig, resolveColor, OVERFLOW_ICON } from "./config";
import { TOOLBAR_EVENTS, TOOLBAR_PLACEMENTS, TOOLBAR_VARIANTS, type ToolbarColor } from "./constants";
import type {
  ToolbarConfig,
  ToolbarComponent,
  ToolbarItem,
  ToolbarElementItem,
  ToolbarButtonItem,
} from "./types";
import type { IconButtonConfig } from "../icon-button/types";

/** What takes focus inside an item that is not itself a control */
const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex], [contenteditable="true"]';

const elementOf = (item: ToolbarElementItem): HTMLElement =>
  item instanceof HTMLElement ? item : item.element;

const isElementItem = (item: ToolbarItem): item is ToolbarElementItem =>
  item instanceof HTMLElement || (item as { element?: unknown }).element instanceof HTMLElement;

/**
 * Creates a toolbar: M3 Expressive's docked and floating toolbars.
 *
 * The element with the `toolbar` role holds the items and is one tab stop,
 * walked with the arrow keys, Home and End. A paired FAB sits beside it,
 * outside that tab stop.
 *
 * @param config - Toolbar configuration
 * @returns A toolbar component
 * @category Components
 * @see https://m3.material.io/components/toolbars/overview
 *
 * @example
 * ```ts
 * const toolbar = createToolbar({
 *   variant: 'floating',
 *   placement: 'bottom',
 *   items: [
 *     { icon: boldIcon, ariaLabel: 'Bold', toggle: true },
 *     { icon: italicIcon, ariaLabel: 'Italic', toggle: true },
 *   ],
 *   overflow: (opener) => createMenu({ opener, items: moreItems }),
 * });
 * ```
 */
const createToolbar = (config: ToolbarConfig = {}): ToolbarComponent => {
  const settings = createConfig(config);
  const { variant, orientation, placement } = settings;
  const block = `${PREFIX}-toolbar`;
  const vertical = orientation === "vertical";
  let color: ToolbarColor = settings.color;

  const component = pipe(
    createBase,
    withEvents(),
    withElement({
      tag: "div",
      componentName: "toolbar",
      className: [
        `${block}--${variant}`,
        `${block}--${color}`,
        vertical ? `${block}--vertical` : "",
        placement !== TOOLBAR_PLACEMENTS.NONE ? `${block}--${placement}` : "",
        variant === TOOLBAR_VARIANTS.DOCKED ? `${block}--${settings.arrangement}` : "",
        settings.elevated ? `${block}--elevated` : "",
        processClassNames(settings.className || ""),
      ].filter(Boolean),
    }),
    withLifecycle()
  )(settings);
  const resources = getCleanup(component);
  const root = component.element;

  const bar = document.createElement("div");
  bar.className = `${block}__bar`;
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", settings.ariaLabel || "Toolbar");
  if (vertical) bar.setAttribute("aria-orientation", "vertical");
  root.appendChild(bar);

  // Items the toolbar created, destroyed with it or when removed
  const created = new Map<HTMLElement, { destroy(): void }>();

  // The focus target of an item: a control, a web component's host (it
  // delegates focus to its control), or the first control inside it.
  const targetOf = (element: HTMLElement): HTMLElement | null =>
    element.matches(FOCUSABLE) || element.localName.includes("-")
      ? element
      : element.querySelector<HTMLElement>(FOCUSABLE);
  const roving = createRoving({
    container: bar,
    vertical: () => vertical,
    // A slot stands for what is assigned to it: the element's items.
    targets: () =>
      Array.from(bar.children as HTMLCollectionOf<HTMLElement>)
        .flatMap((child) =>
          child.localName === "slot"
            ? ((child as HTMLSlotElement).assignedElements({ flatten: true }) as HTMLElement[])
            : [child]
        )
        .map(targetOf)
        .filter((target): target is HTMLElement => target !== null),
  });
  const onSlotChange = () => roving.sync();
  bar.addEventListener("slotchange", onSlotChange);
  resources.add(() => {
    roving.destroy();
    bar.removeEventListener("slotchange", onSlotChange);
  });

  let overflowButton: HTMLElement | null = null;

  const build = (item: ToolbarItem): HTMLElement => {
    if (isElementItem(item)) return elementOf(item);
    const made =
      typeof (item as ToolbarButtonItem).text === "string"
        ? createButton(item as ToolbarButtonItem)
        : createIconButton(item as IconButtonConfig);
    created.set(made.element, made);
    return made.element;
  };

  if (settings.overflow) {
    const button = createIconButton({
      icon: settings.overflowIcon || OVERFLOW_ICON,
      ariaLabel: settings.overflowLabel || "More options",
      class: `${block}__overflow`,
    });
    button.element.setAttribute("aria-haspopup", "menu");
    created.set(button.element, button);
    overflowButton = button.element;
    bar.appendChild(overflowButton);
    const menu = settings.overflow(overflowButton) as { destroy?: () => void } | null | undefined;
    if (typeof menu?.destroy === "function") resources.add(() => menu.destroy!());
  }

  const add = (item: ToolbarItem): HTMLElement => {
    const element = build(item);
    bar.insertBefore(element, overflowButton);
    roving.sync();
    return element;
  };
  (settings.items ?? []).forEach(add);

  if (settings.fab) {
    const fab = document.createElement("div");
    fab.className = `${block}__fab`;
    fab.appendChild(elementOf(settings.fab));
    root.classList.add(`${block}--with-fab`);
    // The FAB's side along the layout; the DOM order keeps the focus order visual.
    if (settings.fabPosition === "start") {
      root.classList.add(`${block}--fab-start`);
      root.insertBefore(fab, bar);
    } else {
      root.appendChild(fab);
    }
  }

  let visible = true;
  const setVisible = (next: boolean) => {
    if (next === visible) return;
    visible = next;
    root.classList.toggle(`${block}--hidden`, !visible);
    // Off screen, the toolbar and its FAB leave the focus order and the
    // accessibility tree (Compose makes the scrolled-off toolbar unfocusable).
    if (visible) root.removeAttribute("inert");
    else root.setAttribute("inert", "");
    component.emit(visible ? TOOLBAR_EVENTS.SHOW : TOOLBAR_EVENTS.HIDE);
  };

  if (settings.exit) {
    const target = settings.scrollTarget ?? window;
    const position = () =>
      target === window ? window.scrollY : (target as HTMLElement).scrollTop;
    const threshold = settings.scrollThreshold;
    // Where the scroll last turned: the toolbar changes state once the
    // content has moved the threshold away from it.
    let anchor = position();
    const onScroll = () => {
      const y = position();
      if (y <= 0) {
        setVisible(true);
        anchor = 0;
      } else if (visible ? y - anchor >= threshold : anchor - y >= threshold) {
        setVisible(!visible);
        anchor = y;
      } else if (visible ? y < anchor : y > anchor) {
        anchor = y;
      }
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    resources.add(() => target.removeEventListener("scroll", onScroll));
  }

  resources.add(() => {
    created.forEach((item) => item.destroy());
    created.clear();
  });

  const toolbar: ToolbarComponent = {
    ...component,
    bar,
    overflowButton,

    addClass(...classes: string[]) {
      component.addClass(...classes);
      return this;
    },

    sync() {
      roving.sync();
    },

    add,

    remove(item: ToolbarElementItem) {
      const element = elementOf(item);
      if (element.parentNode !== bar || element === overflowButton) return this;
      const made = created.get(element);
      if (made) {
        created.delete(element);
        made.destroy();
      }
      element.remove();
      roving.sync();
      return this;
    },

    getItems() {
      return Array.from(bar.children as HTMLCollectionOf<HTMLElement>).filter(
        (element) => element !== overflowButton
      );
    },

    show() {
      setVisible(true);
      return this;
    },

    hide() {
      setVisible(false);
      return this;
    },

    isVisible() {
      return visible;
    },

    setColor(next: ToolbarColor | string) {
      const resolved = resolveColor(next);
      root.classList.replace(`${block}--${color}`, `${block}--${resolved}`);
      color = resolved;
      return this;
    },

    getColor() {
      return color;
    },

    on(event, handler) {
      component.on(event, handler);
      return this;
    },

    off(event, handler) {
      component.off(event, handler);
      return this;
    },

    destroy() {
      component.lifecycle.destroy();
    },
  };

  return toolbar;
};

export default createToolbar;
export { createToolbar };
