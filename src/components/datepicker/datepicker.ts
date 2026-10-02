import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withDisabled, withLifecycle } from "../../core/compose/features";
import { createElement } from "../../core/dom/create";
import { setHTML } from "../../core/dom/html";
import { activeElementOf, deepActiveElement } from "../../core/dom/focus";
import { DATEPICKER_ICONS } from "./constants";
import { PREFIX } from "../../core/config";
import { createBaseConfig, getContainerConfig } from "./config";
import { withAPI } from "./api";
import { renderCalendar } from "./render";
import { addDays, addMonths, formatDate, isSameDay, parseDate, parseInputDate, toIsoValue } from "./utils";
import type { DatePickerComponent, DatePickerConfig, DatePickerInput, DatePickerState, DatePickerValue, DatePickerValueOf, DatePickerView } from "./types";

const isRangeObject = (value: DatePickerInput): value is { start: Date | string; end: Date | string } =>
  typeof value === "object" && value !== null && !(value instanceof Date) && !Array.isArray(value);

let nextId = 0;
const scrollLocks = new WeakMap<Document, { count: number; overflow: string }>();
function lockScroll(doc: Document): () => void {
  const lock = scrollLocks.get(doc) ?? { count: 0, overflow: doc.body.style.overflow };
  lock.count++; scrollLocks.set(doc, lock); doc.body.style.overflow = "hidden";
  return () => { if (--lock.count === 0) { doc.body.style.overflow = lock.overflow; scrollLocks.delete(doc); } };
}

/** M3 calendar/input modes share a draft; modal acceptance is the commit boundary. */
/**
 * The value's type follows a literal selectionMode (FLO-295): `'range'` makes
 * it a pair, the default a date.
 */
const createDatePicker = <M extends string = "single">(
  config: DatePickerConfig & { selectionMode?: M } = {},
): DatePickerComponent<DatePickerValueOf<M>> => {
  const settings = createBaseConfig(config);
  const base = pipe(createBase, withEvents(), withElement(getContainerConfig(settings)), withDisabled(settings), withLifecycle())(settings);
  const doc = base.element.ownerDocument;
  const view = doc.defaultView ?? window;
  const id = `${PREFIX}-datepicker-${++nextId}`;
  const cls = (name: string) => base.getClass(`datepicker__${name}`);
  const today = parseDate(new Date())!;
  const state: DatePickerState = {
    id, prefix: PREFIX, label: settings.label || "Select date", selectedDate: null, rangeEndDate: null,
    // The full-screen list has no month or year views. FLO-276.
    currentView: settings.variant !== "fullscreen" && ["month", "year"].includes(settings.initialView ?? "") ? settings.initialView as DatePickerView : "day",
    currentMonth: today.getMonth(), currentYear: today.getFullYear(), focusedDate: today,
    minDate: parseDate(settings.minDate ?? null), maxDate: parseDate(settings.maxDate ?? null),
    dateFormat: settings.dateFormat || "MM/DD/YYYY", variant: settings.variant === "modal" || settings.variant === "modal-input" || settings.variant === "fullscreen" ? settings.variant : "docked",
    selectionMode: settings.selectionMode === "range" ? "range" : "single", inputMode: settings.variant === "modal-input",
    specialDates: (settings.specialDates ?? []).map(item => ({ ...item })),
    isAllowed: date => (!state.minDate || date >= state.minDate) && (!state.maxDate || date <= state.maxDate) && !state.specialDates.some(item => { const special = parseDate(item.date); return item.disabled && special && isSameDay(date, special); }),
  };
  const modal = state.variant !== "docked";
  let opened = false, opening = false, destroyed = false, navigationRequested = false, readOnly = false;
  let committed: Date | null = null, committedEnd: Date | null = null;
  let returnFocus: HTMLElement | null = null;
  let unlock: (() => void) | undefined;
  const label = createElement({ tag: "label", className: cls("label"), text: state.label, attributes: { for: `${id}-input` } });
  const field = createElement({ tag: "div", className: cls("anchor") });
  const input = doc.createElement("input");
  input.className = cls("input"); input.id = `${id}-input`; input.type = "text"; input.readOnly = modal;
  if (settings.name) input.name = settings.name;
  input.placeholder = settings.placeholder || state.dateFormat; input.autocomplete = "off";
  input.setAttribute("aria-describedby", `${id}-help ${id}-error`);
  const trigger = doc.createElement("button"); trigger.type = "button"; trigger.className = cls("trigger"); setHTML(trigger, DATEPICKER_ICONS.calendar);
  trigger.dataset.action = "open"; trigger.setAttribute("aria-label", "Choose date"); trigger.setAttribute("aria-haspopup", "dialog"); trigger.setAttribute("aria-controls", `${id}-dialog`); trigger.setAttribute("aria-expanded", "false");
  // The supporting text, the date format unless given (FLO-289).
  const help = createElement({ tag: "div", className: cls("help"), text: settings.supportingText || state.dateFormat, attributes: { id: `${id}-help` } });
  const error = createElement({ tag: "div", className: cls("error"), attributes: { id: `${id}-error`, "aria-live": "polite" } });
  const dialog = doc.createElement("dialog"); dialog.id = `${id}-dialog`; dialog.className = cls("calendar");
  dialog.classList.add(base.getClass(`datepicker--${modal ? "modal" : "docked"}`));
  if (state.variant === "fullscreen") dialog.classList.add(base.getClass("datepicker--fullscreen"));
  dialog.setAttribute("aria-modal", String(modal));
  if (settings.animate) dialog.classList.add(base.getClass("datepicker--animate"));
  if (state.selectionMode === "range") dialog.classList.add(base.getClass("datepicker--range"));
  if (modal) dialog.setAttribute("aria-labelledby", `${id}-title`); else dialog.setAttribute("aria-label", state.label);
  const announcement = createElement({ tag: "div", className: cls("sr-only"), attributes: { "aria-live": "polite", "aria-atomic": "true" } });
  field.append(input, trigger); base.element.append(label, field, help, error, dialog);
  const formatted = (date: Date | null, end: Date | null) => formatDate(date, state.dateFormat) + (date && end ? ` - ${formatDate(end, state.dateFormat)}` : "");
  const getValue = (): DatePickerValue => committed ? committedEnd ? [new Date(committed), new Date(committedEnd)] : new Date(committed) : null;
  const syncInput = () => {
    input.value = formatted(committed, committedEnd); input.removeAttribute("aria-invalid"); error.textContent = "";
    trigger.setAttribute("aria-label", committed ? `Change date, ${input.value}` : "Choose date");
  };
  const resetDraft = () => { state.selectedDate = committed && new Date(committed); state.rangeEndDate = committedEnd && new Date(committedEnd); };
  const setDisplayDate = (date: Date) => { state.focusedDate = new Date(date); state.currentMonth = date.getMonth(); state.currentYear = date.getFullYear(); };
  const focusCurrent = () => {
    const selector = state.inputMode ? '[data-entry="start"]' : '[data-date][tabindex="0"], [data-month][tabindex="0"], [data-year][tabindex="0"]';
    (dialog.querySelector<HTMLElement>(selector) ?? dialog.querySelector<HTMLElement>('button:not(:disabled)'))?.focus();
  };
  const track = () => dialog.querySelector<HTMLElement>(`.${cls("track")}`);
  const rtl = (element: HTMLElement) => view.getComputedStyle(element).direction === "rtl";
  // The current month is the middle page; re-centred without motion after each render.
  // The year list opens with the selected year in its middle. FLO-274, FLO-275.
  const centre = () => {
    const element = track();
    if (element?.clientWidth) element.scrollLeft = (rtl(element) ? -1 : 1) * element.clientWidth;
    const years = dialog.querySelector<HTMLElement>(`.${cls("years")}`);
    const year = years?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (years && year) years.scrollTop = year.offsetTop - (years.clientHeight - year.offsetHeight) / 2;
  };
  // Full screen: the rendered months are a window around the focused month, clamped
  // to minDate and maxDate, and extended by a year as the list nears either end. The
  // list keeps its scroll position across renders; months added above shift it by
  // their height. FLO-276.
  const monthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();
  const fromIndex = (index: number) => new Date(Math.floor(index / 12), index % 12, 1);
  const list = () => dialog.querySelector<HTMLElement>(`.${cls("list")}`);
  const limits = () => [state.minDate ? monthIndex(state.minDate) : -Infinity, state.maxDate ? monthIndex(state.maxDate) : Infinity];
  let shiftBy: number | null = null;
  const ensureWindow = () => {
    if (state.variant !== "fullscreen") return;
    const focus = state.currentYear * 12 + state.currentMonth;
    const start = state.listStart ? monthIndex(state.listStart) : NaN;
    if (start <= focus && focus < start + (state.listLength ?? 0)) return;
    const [min, max] = limits();
    const first = Math.max(min, focus - 12), last = Math.min(max, focus + 12);
    state.listStart = fromIndex(first); state.listLength = last - first + 1;
  };
  const extend = (element: HTMLElement) => {
    const [min, max] = limits();
    const start = monthIndex(state.listStart!), end = start + state.listLength! - 1;
    const margin = element.clientHeight;
    if (element.scrollTop < margin && start > min) {
      const first = Math.max(min, start - 12);
      state.listStart = fromIndex(first); state.listLength = end - first + 1; shiftBy = element.scrollHeight;
    } else if (element.scrollHeight - element.scrollTop - element.clientHeight < margin && end < max) {
      state.listLength = Math.min(max, end + 12) - start + 1;
    } else return;
    // Focus is read from the picker's own root: inside a shadow root the
    // document only sees the host. FLO-284.
    const focused = activeElementOf(dialog);
    const active = focused instanceof HTMLElement ? focused.dataset.date : undefined;
    render();
    if (active) dialog.querySelector<HTMLElement>(`[data-date="${active}"]`)?.focus({ preventScroll: true });
  };
  // Opening shows the focused month at the top of the list.
  const reveal = () => {
    const element = list();
    const section = element?.querySelector<HTMLElement>(`[data-month-key="${state.currentYear}-${state.currentMonth}"]`);
    if (element && section) element.scrollTop = section.offsetTop;
  };
  const render = (focus = false, action?: string) => {
    if (!opened || destroyed) return;
    ensureWindow();
    const previous = list();
    const kept = previous && { top: previous.scrollTop, height: previous.scrollHeight };
    dialog.replaceChildren(renderCalendar(state), announcement);
    const current = list();
    if (current && kept) current.scrollTop = kept.top + (shiftBy === null ? 0 : current.scrollHeight - kept.height);
    shiftBy = null;
    centre();
    announcement.textContent = new Date(state.currentYear, state.currentMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (action) dialog.querySelector<HTMLElement>(`[data-action="${action}"]`)?.focus();
    else if (focus) focusCurrent();
  };
  // One shape, whatever committed it: a range's value is the pair, and
  // rangeEndDate its end, kept for compatibility. The docked calendar sent the
  // start as the value and the end apart; the dialog's Save, the pair. FLO-295.
  // `iso`: the value as the <m-datepicker> element's `value` carries it. FLO-320.
  const emitChange = () => {
    const rangeEndDate = committedEnd && new Date(committedEnd);
    base.emit("change", { value: getValue(), rangeEndDate, formattedValue: formatted(committed, committedEnd), iso: toIsoValue(getValue(), rangeEndDate) });
  };
  const commitDraft = () => {
    committed = state.selectedDate && new Date(state.selectedDate); committedEnd = state.rangeEndDate && new Date(state.rangeEndDate); syncInput();
    emitChange();
  };
  const close = (restoreFocus = true) => {
    if (!opened) return;
    opened = false;
    if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open");
    unlock?.(); unlock = undefined; resetDraft();
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
    if (!destroyed) base.emit("close", { value: getValue() });
  };
  const open = () => {
    if (destroyed || opened || base.disabled.isDisabled() || readOnly) return;
    opened = true; opening = true; setTimeout(() => { opening = false; }, 0); resetDraft(); state.inputMode = state.variant === "modal-input"; state.listStart = undefined;
    let initial = committed ?? today;
    if (state.minDate && initial < state.minDate) initial = state.minDate;
    if (state.maxDate && initial > state.maxDate) initial = state.maxDate;
    if (!navigationRequested) setDisplayDate(initial);
    navigationRequested = false;
    // Whatever really had focus, through any shadow roots, gets it back. FLO-284.
    const opener = deepActiveElement();
    returnFocus = opener instanceof HTMLElement && opener !== doc.body ? opener : trigger;
    render();
    // The native top layer supplies the scrim and makes the background inert.
    // DOM-only environments without dialog methods still expose the open state.
    if (modal && typeof dialog.showModal === "function" && dialog.isConnected) dialog.showModal();
    else if (!modal && typeof dialog.show === "function") dialog.show();
    else dialog.setAttribute("open", "");
    if (modal) unlock = lockScroll(doc);
    centre(); reveal();
    trigger.setAttribute("aria-expanded", "true"); focusCurrent(); base.emit("open", { value: getValue() });
  };
  const assignValue = (input: DatePickerInput, emit: boolean) => {
    // A range as { start, end } too (FLO-289), besides the pair.
    const given = isRangeObject(input) ? [input.start, input.end] as [Date | string, Date | string] : input;
    // In range mode a lone date is a one-day range, so a range's value is
    // always a pair (FLO-295): it was the start alone.
    const value = state.selectionMode === "range" && !Array.isArray(given) ? [given, given] as [Date | string, Date | string] : given;
    if (destroyed || Array.isArray(value) && state.selectionMode !== "range") return;
    const start = parseDate(Array.isArray(value) ? value[0] : value);
    const end = Array.isArray(value) ? parseDate(value[1]) : null;
    if (!start || !state.isAllowed(start) || Array.isArray(value) && (!end || !state.isAllowed(end))) return;
    committed = end && end < start ? end : start; committedEnd = end && end < start ? start : end;
    resetDraft(); setDisplayDate(committed); syncInput(); render(); if (emit) emitChange();
  };
  // setValue() and clear() are silent, as a native input set by script; the
  // user's entry and the calendar emit `change` (FLO-328).
  const clearValue = (emit: boolean) => {
    if (destroyed) return;
    committed = null; committedEnd = null; resetDraft(); syncInput(); render(); if (emit) emitChange();
  };
  const validateEntries = (): boolean => {
    const fields = Array.from(dialog.querySelectorAll<HTMLInputElement>('[data-entry]'));
    if (!fields.length) return !!state.selectedDate && state.isAllowed(state.selectedDate) && (state.selectionMode !== "range" || !!state.rangeEndDate && state.isAllowed(state.rangeEndDate));
    const values = fields.map(field => parseInputDate(field.value, state.dateFormat));
    let valid = true;
    fields.forEach((field, index) => {
      const date = values[index];
      const message = !date ? `Enter a valid date (${state.dateFormat}).` : !state.isAllowed(date) ? "Date is not selectable." : index === 1 && values[0] && date < values[0] ? "End date must be on or after start date." : "";
      if (message) { field.setAttribute("aria-invalid", "true"); valid = false; } else field.removeAttribute("aria-invalid");
      dialog.querySelector<HTMLElement>(`#${field.id}-error`)!.textContent = message;
    });
    const confirm = dialog.querySelector<HTMLButtonElement>('[data-action="confirm"]'); if (confirm) confirm.disabled = !valid;
    if (valid) {
      state.selectedDate = values[0]; state.rangeEndDate = values[1] ?? null; setDisplayDate(values[0]!);
      const headline = dialog.querySelector<HTMLElement>(`.${cls("headline")}`);
      if (headline) headline.textContent = formatDate(state.selectedDate, "MMM D, YYYY") + (state.rangeEndDate ? ` – ${formatDate(state.rangeEndDate, "MMM D, YYYY")}` : "");
    }
    return valid;
  };
  const onEntry = () => { validateEntries(); };
  const onInputChange = () => {
    if (modal || destroyed || base.disabled.isDisabled()) return;
    if (!input.value.trim()) { clearValue(true); return; }
    const pieces = state.selectionMode === "range" ? input.value.split(' - ') : [input.value];
    const dates = pieces.map(value => parseInputDate(value, state.dateFormat));
    if (dates.length !== (state.selectionMode === 'range' ? 2 : 1) || dates.some(date => !date || !state.isAllowed(date)) || dates[1] && dates[0] && dates[1] < dates[0]) {
      input.setAttribute("aria-invalid", "true"); error.textContent = `Enter a selectable ${state.selectionMode === "range" ? "date range" : "date"} (${state.dateFormat}).`; return;
    }
    assignValue(dates.length === 2 ? [dates[0]!, dates[1]!] : dates[0]!, true);
  };
  const select = (date: Date) => {
    if (!state.isAllowed(date)) return;
    if (state.selectionMode === "range" && state.selectedDate && !state.rangeEndDate) {
      state.rangeEndDate = date < state.selectedDate ? state.selectedDate : date;
      state.selectedDate = date < state.selectedDate ? date : state.selectedDate;
    } else { state.selectedDate = date; state.rangeEndDate = null; }
    setDisplayDate(date);
    // A docked range commits once it is whole: its start alone is not a value.
    const whole = state.selectionMode !== "range" || !!state.rangeEndDate;
    if ((!modal || settings.closeOnSelect) && whole) commitDraft();
    if (settings.closeOnSelect && (state.selectionMode !== "range" || state.rangeEndDate)) close(); else render(true);
  };
  const navigate = (amount: number) => {
    // The year view has no arrows: its list scrolls. FLO-275.
    const count = state.currentView === "day" ? amount : amount * 12;
    const anchor = new Date(state.currentYear, state.currentMonth, 1);
    anchor.setDate(Math.min(state.focusedDate.getDate(), new Date(state.currentYear, state.currentMonth + 1, 0).getDate()));
    setDisplayDate(addMonths(anchor, count));
  };
  const onClick = (event: MouseEvent) => {
    if (destroyed || base.disabled.isDisabled()) return;
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null;
    if (!target || !base.element.contains(target) || target.hasAttribute('disabled')) return;
    const action = target.dataset.action;
    if (action === "open") { opened ? close() : open(); return; }
    if (!opened) return;
    if (target.dataset.date) { select(parseDate(target.dataset.date)!); return; }
    if (target.dataset.month) { setDisplayDate(new Date(state.currentYear, Number(target.dataset.month), 1)); state.currentView = "day"; render(true); return; }
    if (target.dataset.year) { state.currentYear = Number(target.dataset.year); state.currentView = "month"; render(true); return; }
    if (action === "cancel") close();
    else if (action === "confirm") { if (validateEntries()) { commitDraft(); close(); } }
    else if (action === "toggle-mode") { if (state.inputMode && !validateEntries()) return; state.inputMode = !state.inputMode; render(true); }
    else if (action === "month" || action === "year") { state.currentView = action; render(true); }
    else if (action === "prev" || action === "next") {
      // In the day view the arrows slide the track as a swipe would; the month
      // changes when it settles. Reduced motion, or no layout, changes it at once.
      const element = state.currentView === "day" ? track() : null;
      if (element?.clientWidth && !view.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        element.scrollBy({ left: (action === "prev" ? -1 : 1) * (rtl(element) ? -1 : 1) * element.clientWidth, behavior: "smooth" });
      } else { navigate(action === "prev" ? -1 : 1); render(false, action); }
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" && event.target === input && !modal) { event.preventDefault(); onInputChange(); return; }
    if (event.key === "Enter" && opened && state.inputMode && event.target instanceof HTMLElement && event.target.hasAttribute("data-entry")) {
      event.preventDefault(); if (validateEntries()) { commitDraft(); close(); } return;
    }
    if (!opened) { if (event.key === "ArrowDown" && event.target === input) { event.preventDefault(); open(); } return; }
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (event.key === "Tab" && modal) {
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), input:not(:disabled)'));
      const first = elements[0], last = elements.at(-1);
      const focused = activeElementOf(dialog);
      if (event.shiftKey && focused === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && focused === last) { event.preventDefault(); first?.focus(); }
      return;
    }
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.dataset.date) {
      const date = parseDate(target.dataset.date)!;
      let next: Date;
      // Left and right follow the reading direction. FLO-277.
      const ahead = rtl(dialog) ? -1 : 1;
      if (event.key === "ArrowLeft") next = addDays(date, -ahead);
      else if (event.key === "ArrowRight") next = addDays(date, ahead);
      else if (event.key === "ArrowUp") next = addDays(date, -7);
      else if (event.key === "ArrowDown") next = addDays(date, 7);
      else if (event.key === "Home") next = addDays(date, -date.getDay());
      else if (event.key === "End") next = addDays(date, 6 - date.getDay());
      else if (event.key === "PageUp" || event.key === "PageDown") next = addMonths(date, (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1));
      else return;
      event.preventDefault();
      if (state.minDate && next < state.minDate) next = new Date(state.minDate);
      if (state.maxDate && next > state.maxDate) next = new Date(state.maxDate);
      const direction = next < date ? -1 : 1;
      // Only explicitly disabled special dates require skipping; bounds are clamped.
      for (let n = 0; !state.isAllowed(next) && n <= state.specialDates.length; n++) next = addDays(next, direction);
      if (state.isAllowed(next)) { setDisplayDate(next); render(true); }
    } else if (target?.hasAttribute('data-month') || target?.hasAttribute('data-year')) {
      const buttons = Array.from(dialog.querySelectorAll<HTMLElement>('[data-month], [data-year]'));
      let index = buttons.indexOf(target!);
      const ahead = rtl(dialog) ? -1 : 1;
      const delta = ({ ArrowLeft: -ahead, ArrowRight: ahead, ArrowUp: -3, ArrowDown: 3 } as Record<string, number>)[event.key];
      if (event.key === "Home") index = 0; else if (event.key === "End") index = buttons.length - 1; else if (delta) index = Math.min(buttons.length - 1, Math.max(0, index + delta)); else return;
      event.preventDefault(); buttons.forEach(button => button.tabIndex = -1); buttons[index].tabIndex = 0; buttons[index].focus();
    }
  };
  const onFocus = (event: FocusEvent) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.dataset.date) { state.focusedDate = parseDate(target.dataset.date)!; dialog.querySelectorAll<HTMLElement>('[data-date]').forEach(el => el.tabIndex = el === target ? 0 : -1); }
  };
  // A settled swipe, or an arrow's slide: the page it rests on becomes the month.
  // scrollend where there is one; otherwise the scroll going quiet. FLO-274.
  let quiet: ReturnType<typeof setTimeout> | undefined;
  const settle = () => {
    const element = track();
    if (!opened || !element?.clientWidth) return;
    const page = Math.round(Math.abs(element.scrollLeft) / element.clientWidth) - 1;
    if (!page) return;
    const focused = activeElementOf(dialog);
    const active = focused instanceof HTMLElement && dialog.contains(focused) ? focused : null;
    navigate(page);
    render(!!active?.dataset.date, active?.dataset.action);
  };
  const onScroll = (event: Event) => {
    if (event.type === "scroll" && event.target instanceof HTMLElement && event.target === list()) { extend(event.target); return; }
    if (!(event.target instanceof HTMLElement) || event.target !== track()) return;
    if (event.type === "scrollend") { settle(); return; }
    if ("onscrollend" in view) return;
    clearTimeout(quiet); quiet = setTimeout(settle, 150);
  };
  const onCancel = (event: Event) => { event.preventDefault(); close(); };
  const onOutside = (event: MouseEvent) => {
    // The click that called open() reaches the document after it, in the same
    // task: the event that opened the picker never dismisses it (FLO-548).
    // `opening` is true for the rest of that task, as the dialog's is.
    if (!opened || opening) return;
    if (!modal && event.target instanceof Node && !event.composedPath().includes(base.element)) close(false);
    if (modal && event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close(); }
  };
  const onDialogClick = (event: MouseEvent) => { onClick(event); onOutside(event); event.stopPropagation(); };
  const onInputClick = () => { if (modal) open(); };
  const onFocusOut = (event: FocusEvent) => {
    // Native focus changes can run microtasks before activeElement has settled.
    // Use the destination so moving between days cannot close the popup mid-click.
    if (!destroyed && opened && !modal && event.relatedTarget instanceof Node && !base.element.contains(event.relatedTarget)) close(false);
  };
  base.element.addEventListener("click", onClick); base.element.addEventListener("keydown", onKey);
  base.element.addEventListener("focusout", onFocusOut); dialog.addEventListener("focusin", onFocus);
  dialog.addEventListener("click", onDialogClick); dialog.addEventListener("input", onEntry); dialog.addEventListener("cancel", onCancel);
  dialog.addEventListener("scroll", onScroll, true); dialog.addEventListener("scrollend", onScroll, true);
  input.addEventListener("change", onInputChange); input.addEventListener("click", onInputClick); doc.addEventListener("click", onOutside);
  const setDisabled = (disabled: boolean) => {
    if (destroyed) return;
    if (disabled) { close(); base.disabled.disable(); } else base.disabled.enable();
    input.disabled = disabled; trigger.disabled = disabled || readOnly;
  };
  // Read-only (FLO-289): the value shows and cannot change; the field takes
  // no typing and the calendar does not open.
  const setReadOnly = (value: boolean) => {
    if (destroyed) return;
    readOnly = value;
    if (value) close();
    input.readOnly = value || modal;
    trigger.disabled = value || base.disabled.isDisabled();
    base.element.classList.toggle(base.getClass("datepicker--readonly"), value);
  };
  // Required (FLO-289): on the input for forms, where the docked field is
  // typed in; a dialog variant's input is read-only, which forms do not
  // validate. checkValidity() says whether a required date is missing, and
  // reportValidity() shows it on the field as well, as native inputs do.
  const checkValidity = (): boolean => !(input.required && !committed);
  const reportValidity = (): boolean => {
    const valid = checkValidity();
    if (!valid) { input.setAttribute("aria-invalid", "true"); error.textContent = `Select a ${state.selectionMode === "range" ? "date range" : "date"}.`; }
    return valid;
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true; close();
    doc.removeEventListener("click", onOutside); input.removeEventListener("change", onInputChange); input.removeEventListener("click", onInputClick);
    base.element.removeEventListener("click", onClick); base.element.removeEventListener("keydown", onKey); base.element.removeEventListener("focusout", onFocusOut);
    dialog.removeEventListener("focusin", onFocus); dialog.removeEventListener("click", onDialogClick); dialog.removeEventListener("input", onEntry); dialog.removeEventListener("cancel", onCancel);
    dialog.removeEventListener("scroll", onScroll, true); dialog.removeEventListener("scrollend", onScroll, true); clearTimeout(quiet);
    base.lifecycle.destroy();
  };
  const api = withAPI({
    element: base.element, input, getClass: base.getClass,
    disabled: { enable: () => setDisabled(false), disable: () => setDisabled(true), isDisabled: () => base.disabled.isDisabled() }, lifecycle: { destroy }, destroy,
    open() { open(); return api; }, close() { close(); return api; }, isOpen: () => opened, getValue,
    getFormattedValue: () => formatted(committed, committedEnd),
    setValue(value) { assignValue(value, false); return api; },
    setReadOnly(value) { setReadOnly(value); return api; }, isReadOnly: () => readOnly,
    setRequired(value) { input.required = value; if (!value) syncInput(); return api; }, checkValidity, reportValidity,
    setSupportingText(text) { help.textContent = text || state.dateFormat; return api; },
    clear() { clearValue(false); return api; },
    enable() { setDisabled(false); return api; }, disable() { setDisabled(true); return api; },
    setMinDate(value) { const date = parseDate(value); if (date && !destroyed) { state.minDate = date; render(); if (state.inputMode) validateEntries(); } return api; },
    setMaxDate(value) { const date = parseDate(value); if (date && !destroyed) { state.maxDate = date; render(); if (state.inputMode) validateEntries(); } return api; },
    calendar: {
      goToDate(value) { const date = parseDate(value); if (date) { navigationRequested = !opened; setDisplayDate(date); render(); } },
      nextMonth() { navigationRequested = !opened; setDisplayDate(addMonths(new Date(state.currentYear, state.currentMonth, 1), 1)); render(); },
      prevMonth() { navigationRequested = !opened; setDisplayDate(addMonths(new Date(state.currentYear, state.currentMonth, 1), -1)); render(); },
      nextYear() { navigationRequested = !opened; state.currentYear++; render(); }, prevYear() { navigationRequested = !opened; state.currentYear--; render(); },
      showDayView() { state.currentView = "day"; state.inputMode = false; render(); },
      showMonthView() { state.currentView = "month"; state.inputMode = false; render(); },
      showYearView() { state.currentView = "year"; state.inputMode = false; render(); },
      getCurrentView: () => state.currentView,
    },
  }, base);
  if (settings.value) assignValue(settings.value, false); else syncInput();
  dialog.append(renderCalendar(state), announcement);
  setDisabled(!!settings.disabled);
  if (settings.required) input.required = true;
  if (settings.readOnly) setReadOnly(true);
  // The runtime value follows the same mode the type names.
  return api as unknown as DatePickerComponent<DatePickerValueOf<M>>;
};
export default createDatePicker;
