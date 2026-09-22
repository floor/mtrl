import { getCleanup } from "../../../core/compose/cleanup";
import { pipe } from "../../../core/compose/pipe";
import { createBase, withElement } from "../../../core/compose/component";
import { withEvents, withRipple, withLifecycle } from "../../../core/compose/features";
import { createComponentConfig, createElementConfig } from "../../../core/config/component";
import { setHTML } from "../../../core/dom/html";
import type { ChipConfig, ChipComponent, ChipEvents } from "../types";

const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

/** Shared internal implementation for the four Material chip factories. */
const createChip = (config: ChipConfig = {}): ChipComponent => {
  const options = createComponentConfig<ChipConfig>({ type: "filter", ripple: true }, config, "chip");
  const type = options.type ?? "filter";
  const selectable = type === "filter" || type === "input";
  const base = pipe(createBase, withEvents(), withElement(createElementConfig(options, { tag: "div" })), withRipple(options), withLifecycle())(options);
  const root = base.element;
  const resources = getCleanup(base);
  root.classList.add(base.getClass(`chip--${type}`));
  if (options.elevated && type !== "input") root.classList.add(base.getClass("chip--elevated"));
  const action = document.createElement("button");
  action.type = "button";
  action.className = base.getClass("chip__action");
  if (selectable) action.setAttribute("role", "checkbox");
  root.append(action);

  const leading = document.createElement("span");
  leading.className = base.getClass("chip__leading-icon");
  leading.setAttribute("aria-hidden", "true");
  const check = document.createElement("span");
  check.className = base.getClass("chip__checkmark");
  check.setAttribute("aria-hidden", "true");
  setHTML(check, CHECK);
  const label = document.createElement("span");
  label.className = base.getClass("chip__label");
  const trailing = document.createElement("span");
  trailing.className = base.getClass("chip__trailing-icon");
  trailing.setAttribute("aria-hidden", "true");
  action.append(leading, check, label, trailing);

  let selected = selectable && !!options.selected;
  let disabled = !!options.disabled;
  let value: string | null = options.value ?? null;
  let leadingIcon = options.leadingIcon ?? options.icon ?? "";
  const avatar = type === "input" ? options.avatar : undefined;
  let trailingIcon = type === "suggestion" ? "" : options.trailingIcon ?? "";
  let remove: HTMLButtonElement | undefined;
  if (type === "input" && options.onRemove) {
    remove = document.createElement("button");
    remove.type = "button";
    remove.className = base.getClass("chip__remove");
    setHTML(remove, trailingIcon || CLOSE);
    root.append(remove);
    root.setAttribute("role", "group");
  }

  const render = () => {
    root.classList.toggle(base.getClass("chip--selected"), selected);
    root.classList.toggle(base.getClass("chip--disabled"), disabled);
    root.classList.toggle(base.getClass("chip--avatar"), !!avatar);
    action.disabled = disabled;
    if (selectable) action.setAttribute("aria-checked", String(selected));
    leading.hidden = !avatar && (!leadingIcon || selected);
    check.hidden = !(selected && (type === "filter" || (type === "input" && !avatar)));
    trailing.hidden = !trailingIcon || !!remove;
    root.classList.toggle(base.getClass("chip--leading"), !leading.hidden || !check.hidden);
    root.classList.toggle(base.getClass("chip--trailing"), !trailing.hidden || !!remove);
    if (remove) {
      remove.disabled = disabled;
      remove.setAttribute("aria-label", options.removeLabel ?? `Remove ${label.textContent ?? ""}`);
      root.setAttribute("aria-label", label.textContent ?? "");
    }
  };
  const setLabel = (text: string) => { label.textContent = text; render(); return api; };
  const setLeadingIcon = (icon: string) => {
    leadingIcon = icon;
    setHTML(leading, avatar || icon);
    render();
    return api;
  };
  const api: ChipComponent = {
    element: root,
    action,
    getType: () => type,
    getValue() {
      const attribute = root.getAttribute("data-value");
      if (attribute !== null) return attribute;
      if (value === null && label.textContent) {
        value = label.textContent.replace(/ Theme$/, "").toLowerCase().replace(/\s+/g, "-");
      }
      if (value !== null) root.setAttribute("data-value", value);
      return value;
    },
    setValue(next) { value = next; root.setAttribute("data-value", next); return api; },
    enable() { disabled = false; render(); return api; },
    disable() { disabled = true; render(); return api; },
    isDisabled: () => disabled,
    setLabel,
    getLabel: () => label.textContent ?? "",
    setText: setLabel,
    getText: () => label.textContent ?? "",
    setIcon: setLeadingIcon,
    getIcon: () => leadingIcon,
    setLeadingIcon,
    setTrailingIcon(icon) {
      trailingIcon = type === "suggestion" ? "" : icon;
      setHTML(remove ?? trailing, trailingIcon || (remove ? CLOSE : ""));
      render();
      return api;
    },
    isSelected: () => selected,
    setSelected(next) { selected = selectable && next; render(); return api; },
    toggleSelected() { return api.setSelected(!selected); },
    focus() { action.focus(); return api; },
    destroy: () => base.lifecycle.destroy(),
    on<K extends keyof ChipEvents>(event: K, handler: ChipEvents[K]) { base.on(event, handler); return api; },
    off<K extends keyof ChipEvents>(event: K, handler: ChipEvents[K]) { base.off(event, handler); return api; },
    addClass(...classes) { root.classList.add(...classes); return api; },
  };

  const listen = <K extends keyof HTMLElementEventMap>(element: HTMLElement, name: K, handler: (event: HTMLElementEventMap[K]) => void) => {
    element.addEventListener(name, handler);
    resources.add(() => element.removeEventListener(name, handler));
  };
  listen(root, "click", event => {
    if (disabled || resources.destroyed) return;
    if (selectable && !options.managedSelection) {
      api.toggleSelected();
      base.emit("change", { selected, chip: api });
      options.onChange?.(selected, api);
      options.onSelect?.(api);
    }
    base.emit("click", { event, originalEvent: event, element: root });
    options.onClick?.(api);
  });
  listen(action, "keydown", event => {
    if (!disabled) base.emit("keydown", { event, originalEvent: event, element: root });
  });
  for (const name of ["focus", "blur"] as const) {
    listen(action, name, event => base.emit(name, { event, originalEvent: event, element: root }));
  }
  if (remove) {
    listen(remove, "click", event => {
      event.stopPropagation();
      if (disabled) return;
      base.emit("remove", api);
      options.onRemove?.(api);
    });
    // The chips container's navigation must not activate selection for this button.
    listen(remove, "keydown", event => event.stopPropagation());
  }
  label.textContent = options.label ?? options.text ?? "";
  setHTML(leading, avatar || leadingIcon);
  setHTML(trailing, trailingIcon);
  render();
  api.getValue();
  return api;
};
export default createChip;
