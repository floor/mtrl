import { LIST_EVENTS } from "../constants";
import { getCleanup } from "../../../core/compose/cleanup";
import { isDataItem, itemId, itemLabel, renderAnatomy } from "./anatomy";
import type { ListConfig, ListFeatureHost, ListItem, ListRenderer, ListRow, ScrollPosition } from "../types";

export const withRenderer = (config: ListConfig<ListItem>) =>
  <C extends ListFeatureHost>(component: C): C & { list: ListRenderer; eventTarget: { current: unknown } } => {
  const items = config.items;
  const resources = getCleanup(component);
  const eventTarget: { current: unknown } = { current: component };
  const getClass = component.getClass;
  const container = document.createElement("div");
  container.className = getClass("list__content");
  container.setAttribute("role", "presentation");
  component.element.append(container);
  let rows: ListRow[] = [];
  const listeners = new Set<() => void>();
  const renderAllItems = () => {
    if (resources.destroyed) return;
    const ids = new Set<string>();
    for (const [index, item] of items.entries()) {
      if (!item || !isDataItem(item)) continue;
      const id = itemId(item, index);
      if (ids.has(id)) throw new Error(`Duplicate list item ID: ${id}`);
      ids.add(id);
    }
    const active = rows.find(row => row.action === document.activeElement)?.id;
    rows = [];
    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
      if (!item) return;
      if (!isDataItem(item)) {
        const element = document.createElement("div");
        if (item.kind === "divider") {
          element.className = getClass("list__divider"); element.setAttribute("role", "separator");
          if (item.inset) element.classList.add(getClass("list__divider--inset"));
        } else {
          element.className = getClass("list__subheader"); element.setAttribute("role", "presentation");
          element.textContent = itemLabel(item);
        }
        fragment.append(element); return;
      }
      let element: HTMLElement;
      if (config.renderItem) {
        const content = config.renderItem(item, index);
        if (content.matches("button, input, select, textarea, a")) {
          element = document.createElement("div"); element.append(content);
        } else element = content;
      } else element = renderAnatomy(item, getClass);
      element.classList.add(getClass("list__item"));
      element.setAttribute("role", "listitem");
      const id = itemId(item, index); element.dataset.id = id;
      if (item.disabled) { element.classList.add(getClass("list__item--disabled")); element.setAttribute("aria-disabled", "true"); }
      let action: HTMLButtonElement | undefined;
      if (config.trackSelection) {
        action = document.createElement("button"); action.type = "button";
        action.className = getClass("list__action"); action.disabled = !!item.disabled;
        action.setAttribute("aria-pressed", "false");
        const headline = element.querySelector<HTMLElement>(`.${getClass("list__headline")}`);
        const supporting = element.querySelector<HTMLElement>(`.${getClass("list__supporting")}`);
        if (headline?.id && headline.textContent) action.setAttribute("aria-labelledby", headline.id);
        else action.setAttribute("aria-label", itemLabel(item) || element.textContent || "Select item");
        if (supporting?.id) action.setAttribute("aria-describedby", supporting.id);
        element.classList.add(getClass("list__item--interactive")); element.prepend(action);
      }
      rows.push({ item, id, index, element, action }); fragment.append(element);
    });
    if (items.length === 0) {
      const empty = document.createElement("div"); empty.className = getClass("list__empty");
      empty.setAttribute("role", "presentation"); empty.textContent = "No items"; fragment.append(empty);
    }
    container.replaceChildren(fragment);
    listeners.forEach(listener => listener());
    if (active !== undefined) rows.find(row => row.id === active)?.action?.focus();
    component.emit?.(LIST_EVENTS.LOAD, { items, loading: false, hasNext: false, hasPrev: false, component: eventTarget.current });
  };
  const scrollRow = (row: ListRow | undefined, position: ScrollPosition, animate: boolean) => {
    row?.element.scrollIntoView({ behavior: animate ? "smooth" : "auto", block: position });
  };
  const scrollToItem = (id: string | number, position: ScrollPosition = "start", animate = false) => scrollRow(rows.find(row => row.id === String(id)), position, animate);
  const scrollToIndex = (index: number, position: ScrollPosition = "start", animate = false) => scrollRow(rows.find(row => row.index === index), position, animate);
  renderAllItems();
  resources.add(() => { listeners.clear(); rows = []; container.replaceChildren(); });
  return {
    ...component,
    eventTarget,
    list: {
      getRows: () => rows,
      onRender: handler => { listeners.add(handler); return () => { listeners.delete(handler); }; },
      getItems: () => items,
      getAllItems: () => items,
      getVisibleItems: () => items,
      refresh: renderAllItems,
      scrollToItem,
      scrollToIndex,
      // Compatibility methods (no-ops for rendered lists)
      loadNext: () => Promise.resolve({ hasNext: false, items: [] }),
      loadPage: () => Promise.resolve({ hasNext: false, items: [] }),
      loadPrevious: () => Promise.resolve({ hasPrev: false, items: [] }),
      scrollNext: () => Promise.resolve({ hasNext: false, items: [] }),
      scrollPrevious: () => Promise.resolve({ hasPrev: false, items: [] }),
      scrollToItemById: (
        itemId: string | number,
        position?: ScrollPosition,
        animate?: boolean
      ) => {
        scrollToItem(itemId, position, animate);
        return Promise.resolve();
      },
      onCollectionChange: () => () => {}, // No-op unsubscribe
      onPageChange: () => () => {}, // No-op unsubscribe
      getCurrentPage: () => 1,
      getPageSize: () => items.length,
      getCollection: () => null,
      isApiMode: () => false,
      isLoading: () => false,
      hasNextPage: () => false,    }
  };
};
export default withRenderer;
