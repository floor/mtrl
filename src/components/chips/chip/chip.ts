import { getCleanup } from "../../../core/compose/cleanup";
import { pipe } from "../../../core/compose/pipe";
import { createBase, withElement } from "../../../core/compose/component";
import { withEvents, withLifecycle } from "../../../core/compose/features";
import { createRipple } from "../../../core/compose/features/ripple";
import { createComponentConfig, createElementConfig } from "../../../core/config/component";
import { setHTML } from "../../../core/dom/html";
import type { ChipOptions, ChipComponent, ChipEvents } from "../types";

const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
const DROP_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>';
const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

/** Shared internal implementation for the four Material chip factories. */
const createChip = (config: ChipOptions = {}): ChipComponent => {
  const options = createComponentConfig<ChipOptions>({ type: "filter", ripple: true }, config, "chip");
  const type = options.type ?? "filter";
  const selectable = type === "filter" || type === "input";
  const base = pipe(createBase, withEvents(), withElement(createElementConfig(options, { tag: "div" })), withLifecycle())(options);
  const root = base.element;
  const resources = getCleanup(base);
  // The set's selection hook. removeChip and the set's teardown both destroy
  // the chip, which is what drops the hook: a later setSelected cannot reach
  // a set that no longer has this chip. FLO-518.
  resources.add(() => { options.onSelected = undefined; });
  root.classList.add(base.getClass(`chip--${type}`));
  if (options.elevated && type !== "input") root.classList.add(base.getClass("chip--elevated"));
  const action = document.createElement("button");
  action.type = "button";
  action.className = base.getClass("chip__action");
  if (selectable) action.setAttribute("role", "checkbox");
  root.append(action);
  // The ripple belongs to the chip's action, not the whole chip: mounted on the root,
  // a press on the remove or trailing button rippled across the chip it does not
  // activate.
  if (options.ripple) {
    const ripple = createRipple();
    ripple.mount(action);
    resources.add(() => ripple.unmount(action));
  }

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
  // Every input chip is removable (m3.material.io chips); it used to need onRemove.
  if (type === "input") {
    remove = document.createElement("button");
    remove.type = "button";
    remove.className = base.getClass("chip__remove");
    setHTML(remove, trailingIcon || CLOSE);
    root.append(remove);
    root.setAttribute("role", "group");
  }
  // A filter chip's trailing icon can have its own action: open a menu or remove the
  // chip (m3.material.io chips). Built like the remove button, beside the action,
  // never inside it. FLO-259.
  let trailingAction: HTMLButtonElement | undefined;
  if (type === "filter" && options.onTrailingClick) {
    trailingAction = document.createElement("button");
    trailingAction.type = "button";
    trailingAction.className = base.getClass("chip__trailing-action");
    if (options.trailingMenu) {
      trailingAction.setAttribute("aria-haspopup", "menu");
      trailingAction.setAttribute("aria-expanded", "false");
    }
    setHTML(trailingAction, trailingIcon || (options.trailingMenu ? DROP_DOWN : CLOSE));
    root.append(trailingAction);
    root.setAttribute("role", "group");
  }

  // In a chip set's grid (the m3.material.io chips' web roles, FLO-261) the chip is a
  // gridcell. A chip with one action is itself the focus target: the cell carries
  // the selection and answers Space and Enter, and its inner button stays for the
  // pointer but leaves the accessibility tree, so the chip is announced once. A chip
  // with two actions (select + remove, or a trailing action) keeps both buttons as
  // the focus targets inside its cell, "button or checkbox" as the site gives them.
  const oneActionCell = !!options.cell && !remove && !trailingAction;
  if (options.cell) {
    root.setAttribute("role", "gridcell");
    root.removeAttribute("aria-label");
    for (const button of [action, remove, trailingAction]) if (button) button.tabIndex = -1;
  }
  if (oneActionCell) {
    root.tabIndex = -1;
    action.setAttribute("aria-hidden", "true");
    action.removeAttribute("role");
  }

  const render = () => {
    root.classList.toggle(base.getClass("chip--selected"), selected);
    root.classList.toggle(base.getClass("chip--disabled"), disabled);
    root.classList.toggle(base.getClass("chip--avatar"), !!avatar);
    action.disabled = disabled;
    if (oneActionCell) {
      if (selectable) root.setAttribute("aria-selected", String(selected));
      root.setAttribute("aria-disabled", String(disabled));
    } else if (selectable) action.setAttribute("aria-checked", String(selected));
    leading.hidden = !avatar && (!leadingIcon || selected);
    check.hidden = !(selected && (type === "filter" || (type === "input" && !avatar)));
    trailing.hidden = !trailingIcon || !!remove || !!trailingAction;
    root.classList.toggle(base.getClass("chip--leading"), !leading.hidden || !check.hidden);
    root.classList.toggle(base.getClass("chip--trailing"), !trailing.hidden || !!remove || !!trailingAction);
    if (remove) {
      remove.disabled = disabled;
      remove.setAttribute("aria-label", options.removeLabel ?? `Remove ${label.textContent ?? ""}`);
      if (!options.cell) root.setAttribute("aria-label", label.textContent ?? "");
    }
    if (trailingAction) {
      trailingAction.disabled = disabled;
      const text = label.textContent ?? "";
      trailingAction.setAttribute("aria-label", options.trailingLabel ?? (options.trailingMenu ? `${text} options` : `Remove ${text}`));
      if (!options.cell) root.setAttribute("aria-label", text);
    }
  };
  // Set once the chip has been made: a change after that animates its icons, the first
  // render does not (see --motion in the stylesheet).
  let made = false;
  const animateChanges = () => { if (made) root.classList.add(base.getClass("chip--motion")); };
  const setLabel = (text: string) => { label.textContent = text; render(); return api; };
  const setLeadingIcon = (icon: string) => {
    animateChanges();
    leadingIcon = icon;
    setHTML(leading, avatar || icon);
    render();
    return api;
  };
  const api: ChipComponent = {
    element: root,
    action,
    trailingAction,
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
      if (trailingAction) setHTML(trailingAction, trailingIcon || (options.trailingMenu ? DROP_DOWN : CLOSE));
      else setHTML(remove ?? trailing, trailingIcon || (remove ? CLOSE : ""));
      render();
      return api;
    },
    isSelected: () => selected,
    setSelected(next) {
      animateChanges();
      selected = selectable && next;
      render();
      if (selected) options.onSelected?.(api);
      return api;
    },
    toggleSelected() { return api.setSelected(!selected); },
    focus() { (oneActionCell ? root : action).focus(); return api; },
    destroy: () => base.lifecycle.destroy(),
    on<K extends keyof ChipEvents>(event: K, handler: ChipEvents[K]) { base.on(event, handler); return api; },
    off<K extends keyof ChipEvents>(event: K, handler: ChipEvents[K]) { base.off(event, handler); return api; },
    addClass(...classes) { root.classList.add(...classes); return api; },
  };
  if (options.onChange) api.on("change", options.onChange);
  if (options.onClick) api.on("click", options.onClick);
  if (options.onRemove) api.on("remove", options.onRemove);
  if (options.onTrailingClick) api.on("trailing", options.onTrailingClick);

  const listen = <K extends keyof HTMLElementEventMap>(element: HTMLElement, name: K, handler: (event: HTMLElementEventMap[K]) => void) => {
    element.addEventListener(name, handler);
    resources.add(() => element.removeEventListener(name, handler));
  };
  listen(root, "click", event => {
    if (disabled || resources.destroyed) return;
    // One order, alone or in a set: click reports the press, with the state
    // as it was; change follows, only if the selection changed. A set toggles
    // the chip from its own click listener, and may refuse (FLO-550).
    // setSelected itself stays silent, so a chip replaced by a single-select
    // click does not emit change.
    const was = selected;
    base.emit("click", { event, originalEvent: event, element: root });
    if (!selectable || resources.destroyed) return;
    if (!options.managedSelection) api.toggleSelected();
    if (selected !== was) base.emit("change", { selected, chip: api, value: api.getValue() });
    if (!options.managedSelection) options.onSelect?.(api);
  });
  // Backspace and Delete remove a focused removable chip (m3.material.io chips
  // accessibility, keyboard table). FLO-256.
  const removeFromKeyboard = (event: KeyboardEvent) => {
    if (!remove || disabled || (event.key !== "Backspace" && event.key !== "Delete")) return false;
    event.preventDefault();
    remove.click();
    return true;
  };
  listen(action, "keydown", event => {
    if (removeFromKeyboard(event)) return;
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
      // After the listeners, which read a chip that is still there: in a set
      // the set removes it, on its own the chip leaves the page. FLO-257.
      if (resources.destroyed) return;
      if (options.onRemoved) options.onRemoved(api);
      else root.remove();
    });
    // Enter and Space activate this button, so the set must not also select the chip
    // for them; the arrows go on to the set's navigation, which they did not.
    listen(remove, "keydown", event => {
      if (removeFromKeyboard(event)) return;
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    });
  }
  if (trailingAction) {
    listen(trailingAction, "click", event => {
      event.stopPropagation();
      if (disabled) return;
      base.emit("trailing", api);
    });
    // As for the remove button: Enter and Space stay here, the arrows go on to the set.
    listen(trailingAction, "keydown", event => {
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    });
  }
  if (oneActionCell) {
    // The cell answers Space and Enter for its hidden button, and a press on that
    // button focuses the cell rather than the button.
    listen(root, "keydown", event => {
      if (event.target !== root || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      if (!disabled) action.click();
    });
    // Focus moved by script matches :focus-visible, so a click drew the keyboard
    // ring. focusVisible: false marks it as pointer focus where the browser supports
    // it (HTML FocusOptions, not yet in TypeScript's DOM types; Chromium 130 ignores
    // it), and --pointer-focus hides the ring everywhere else, including a click on
    // the cell that already had keyboard focus. Any key, or leaving the cell,
    // clears it, so Tab and the arrows still show the ring.
    const pointerFocus: FocusOptions & { focusVisible: boolean } = { focusVisible: false };
    const pointerClass = base.getClass("chip--pointer-focus");
    listen(action, "mousedown", event => {
      event.preventDefault();
      root.classList.add(pointerClass);
      root.focus(pointerFocus);
    });
    listen(root, "keydown", () => root.classList.remove(pointerClass));
    listen(root, "blur", () => root.classList.remove(pointerClass));
  }
  // The dragged state (Compose DraggedContainerElevation, DraggedStateLayerOpacity) for
  // a chip the app makes draggable; mtrl does no dragging itself. FLO-259.
  listen(root, "dragstart", () => root.classList.add(base.getClass("chip--dragged")));
  listen(root, "dragend", () => root.classList.remove(base.getClass("chip--dragged")));
  label.textContent = options.label ?? "";
  setHTML(leading, avatar || leadingIcon);
  setHTML(trailing, trailingIcon);
  render();
  api.getValue();
  made = true;
  return api;
};
export default createChip;
