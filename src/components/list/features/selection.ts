import { LIST_EVENTS } from "../constants";
import { getCleanup } from "../../../core/compose/cleanup";
import type { ListConfig, ListFeatureHost, ListItem, ListSelection, ListRow } from "../types";

export const withSelection = (config: ListConfig<ListItem>) =>
  <C extends ListFeatureHost>(component: C): C & ListSelection => {
  const resources = getCleanup(component);
  const selected = new Set<string>();
  const rows = () => component.list?.getRows() ?? [];
  const rowFor = (id: string | number) => rows().find(row => row.id === String(id));
  const className = component.getClass("list__item--selected");
  const apply = () => {
    for (const id of selected) if (!rowFor(id)) selected.delete(id);
    for (const row of rows()) {
      const checked = selected.has(row.id);
      row.element.classList.toggle(className, checked);
      row.action?.setAttribute("aria-pressed", String(checked));
    }
  };
  const update = (id: string | number, value: boolean) => {
    if (!config.trackSelection || resources.destroyed || !rowFor(id)) return;
    if (value) selected.add(String(id)); else selected.delete(String(id));
    apply();
  };
  if (config.trackSelection) {
    for (const id of config.initialSelection ?? []) if (rowFor(id)) selected.add(String(id));
    for (const row of rows()) if (row.item.selected) selected.add(row.id);
  }
  const ownedRow = (event: Event): ListRow | undefined => {
    if (!(event.target instanceof Element)) return;
    const nearest = event.target.closest(`.${component.getClass("list__item")}`);
    return rows().find(row => row.element === nearest);
  };
  const activate = (event: MouseEvent) => {
    if (!config.trackSelection || resources.destroyed || event.defaultPrevented) return;
    const row = ownedRow(event);
    if (!row || row.item.disabled || !(event.target instanceof Element)) return;
    const control = event.target.closest('button, input, select, textarea, a, [contenteditable="true"], [data-list-control]');
    if (control && control !== row.action) return;
    const payload = {
      item: row.item, element: row.element, originalEvent: event,
      component: component.eventTarget?.current ?? component,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
    };
    component.emit?.(LIST_EVENTS.SELECT, payload);
    if (payload.defaultPrevented || resources.destroyed) return;
    const wasSelected = selected.has(row.id);
    if (!config.multiSelect) selected.clear();
    if (wasSelected) selected.delete(row.id); else selected.add(row.id);
    apply();
  };
  const blockDisabled = (event: Event) => {
    if (event instanceof KeyboardEvent && event.key === "Tab") return;
    if (ownedRow(event)?.item.disabled) { event.preventDefault(); event.stopPropagation(); }
  };
  const navigate = (event: KeyboardEvent) => {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const row = ownedRow(event);
    if (!row?.action || event.target !== row.action) return;
    const enabled = rows().filter(value => value.action && !value.item.disabled);
    const current = enabled.indexOf(row);
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : Math.max(0, Math.min(enabled.length - 1, current + (event.key === "ArrowUp" ? -1 : 1)));
    event.preventDefault(); event.stopPropagation(); enabled[next]?.action?.focus();
  };
  component.element.addEventListener("click", blockDisabled, true);
  component.element.addEventListener("click", activate);
  component.element.addEventListener("keydown", blockDisabled, true);
  component.element.addEventListener("keydown", navigate);
  if (component.list) resources.add(component.list.onRender(apply));
  resources.add(() => {
    component.element.removeEventListener("click", blockDisabled, true);
    component.element.removeEventListener("click", activate);
    component.element.removeEventListener("keydown", blockDisabled, true);
    component.element.removeEventListener("keydown", navigate);
    selected.clear();
  });
  apply();
  return {
    ...component,
    getSelectedItems: () => rows().filter(row => selected.has(row.id)).map(row => row.item),
    getSelectedItemIds: () => Array.from(selected),
    isItemSelected: id => selected.has(String(id)),
    selectItem(id) { update(id, true); return this; },
    deselectItem(id) { update(id, false); return this; },
    clearSelection() { selected.clear(); apply(); return this; },
    setSelection(ids) {
      selected.clear();
      if (config.trackSelection && !resources.destroyed) for (const id of ids) if (rowFor(id)) selected.add(String(id));
      apply(); return this;
    },
  };
};
export default withSelection;
