import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withDisabled, withLifecycle } from "../../core/compose/features";
import { createElement } from "../../core/dom/create";
import { setHTML } from "../../core/dom/html";
import { DATEPICKER_ICONS } from "./constants";
import { PREFIX } from "../../core/config";
import { createBaseConfig, getContainerConfig } from "./config";
import { withAPI } from "./api";
import { renderCalendar } from "./render";
import { addDays, addMonths, formatDate, isSameDay, parseDate, parseInputDate } from "./utils";
import type { DatePickerComponent, DatePickerConfig, DatePickerState, DatePickerValue, DatePickerView } from "./types";

let nextId = 0;
const scrollLocks = new WeakMap<Document, { count: number; overflow: string }>();
function lockScroll(doc: Document): () => void {
  const lock = scrollLocks.get(doc) ?? { count: 0, overflow: doc.body.style.overflow };
  lock.count++; scrollLocks.set(doc, lock); doc.body.style.overflow = "hidden";
  return () => { if (--lock.count === 0) { doc.body.style.overflow = lock.overflow; scrollLocks.delete(doc); } };
}

/** M3 calendar/input modes share a draft; modal acceptance is the commit boundary. */
const createDatePicker = (config: DatePickerConfig = {}): DatePickerComponent => {
  const settings = createBaseConfig(config);
  const base = pipe(createBase, withEvents(), withElement(getContainerConfig(settings)), withDisabled(settings), withLifecycle())(settings);
  const doc = base.element.ownerDocument;
  const id = `${PREFIX}-datepicker-${++nextId}`;
  const cls = (name: string) => base.getClass(`datepicker__${name}`);
  const today = parseDate(new Date())!;
  const state: DatePickerState = {
    id, prefix: PREFIX, label: settings.label || "Select date", selectedDate: null, rangeEndDate: null,
    currentView: ["month", "year"].includes(settings.initialView ?? "") ? settings.initialView as DatePickerView : "day",
    currentMonth: today.getMonth(), currentYear: today.getFullYear(), focusedDate: today,
    minDate: parseDate(settings.minDate ?? null), maxDate: parseDate(settings.maxDate ?? null),
    dateFormat: settings.dateFormat || "MM/DD/YYYY", variant: settings.variant === "modal" || settings.variant === "modal-input" ? settings.variant : "docked",
    selectionMode: settings.selectionMode === "range" ? "range" : "single", inputMode: settings.variant === "modal-input",
    specialDates: (settings.specialDates ?? []).map(item => ({ ...item })),
    isAllowed: date => (!state.minDate || date >= state.minDate) && (!state.maxDate || date <= state.maxDate) && !state.specialDates.some(item => { const special = parseDate(item.date); return item.disabled && special && isSameDay(date, special); }),
  };
  const modal = state.variant !== "docked";
  let opened = false, destroyed = false, navigationRequested = false;
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
  const help = createElement({ tag: "div", className: cls("help"), text: state.dateFormat, attributes: { id: `${id}-help` } });
  const error = createElement({ tag: "div", className: cls("error"), attributes: { id: `${id}-error`, "aria-live": "polite" } });
  const dialog = doc.createElement("dialog"); dialog.id = `${id}-dialog`; dialog.className = cls("calendar");
  dialog.classList.add(base.getClass(`datepicker--${modal ? "modal" : "docked"}`));
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
  const render = (focus = false, action?: string) => {
    if (!opened || destroyed) return;
    dialog.replaceChildren(renderCalendar(state), announcement);
    announcement.textContent = new Date(state.currentYear, state.currentMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (action) dialog.querySelector<HTMLElement>(`[data-action="${action}"]`)?.focus();
    else if (focus) focusCurrent();
  };
  const emitChange = () => base.emit("change", { value: getValue(), formattedValue: formatted(committed, committedEnd) });
  const commitDraft = (calendar = false) => {
    committed = state.selectedDate && new Date(state.selectedDate); committedEnd = state.rangeEndDate && new Date(state.rangeEndDate); syncInput();
    if (calendar && committed) base.emit("change", { value: new Date(committed), rangeEndDate: committedEnd && new Date(committedEnd), formattedValue: formatted(committed, committedEnd) });
    else emitChange();
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
    if (destroyed || opened || base.disabled.isDisabled()) return;
    opened = true; resetDraft(); state.inputMode = state.variant === "modal-input";
    let initial = committed ?? today;
    if (state.minDate && initial < state.minDate) initial = state.minDate;
    if (state.maxDate && initial > state.maxDate) initial = state.maxDate;
    if (!navigationRequested) setDisplayDate(initial);
    navigationRequested = false;
    returnFocus = doc.activeElement instanceof HTMLElement && doc.activeElement !== doc.body ? doc.activeElement : trigger;
    render();
    // The native top layer supplies the scrim and makes the background inert.
    // DOM-only environments without dialog methods still expose the open state.
    if (modal && typeof dialog.showModal === "function" && dialog.isConnected) dialog.showModal();
    else if (!modal && typeof dialog.show === "function") dialog.show();
    else dialog.setAttribute("open", "");
    if (modal) unlock = lockScroll(doc);
    trigger.setAttribute("aria-expanded", "true"); focusCurrent(); base.emit("open", { value: getValue() });
  };
  const assignValue = (value: Date | string | [Date | string, Date | string], emit: boolean) => {
    if (destroyed || Array.isArray(value) && state.selectionMode !== "range") return;
    const start = parseDate(Array.isArray(value) ? value[0] : value);
    const end = Array.isArray(value) ? parseDate(value[1]) : null;
    if (!start || !state.isAllowed(start) || Array.isArray(value) && (!end || !state.isAllowed(end))) return;
    committed = end && end < start ? end : start; committedEnd = end && end < start ? start : end;
    resetDraft(); setDisplayDate(committed); syncInput(); render(); if (emit) emitChange();
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
    if (!input.value.trim()) { api.clear(); return; }
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
    if (!modal || settings.closeOnSelect && (state.selectionMode !== "range" || state.rangeEndDate)) commitDraft(true);
    if (settings.closeOnSelect && (state.selectionMode !== "range" || state.rangeEndDate)) close(); else render(true);
  };
  const navigate = (amount: number) => {
    const count = state.currentView === "day" ? amount : state.currentView === "month" ? amount * 12 : amount * 12 * 21;
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
    else if (action === "prev" || action === "next") { navigate(action === "prev" ? -1 : 1); render(false, action); }
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
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first?.focus(); }
      return;
    }
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.dataset.date) {
      const date = parseDate(target.dataset.date)!;
      let next: Date;
      if (event.key === "ArrowLeft") next = addDays(date, -1);
      else if (event.key === "ArrowRight") next = addDays(date, 1);
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
      const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 } as Record<string, number>)[event.key];
      if (event.key === "Home") index = 0; else if (event.key === "End") index = buttons.length - 1; else if (delta) index = Math.min(buttons.length - 1, Math.max(0, index + delta)); else return;
      event.preventDefault(); buttons.forEach(button => button.tabIndex = -1); buttons[index].tabIndex = 0; buttons[index].focus();
    }
  };
  const onFocus = (event: FocusEvent) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.dataset.date) { state.focusedDate = parseDate(target.dataset.date)!; dialog.querySelectorAll<HTMLElement>('[data-date]').forEach(el => el.tabIndex = el === target ? 0 : -1); }
  };
  const onCancel = (event: Event) => { event.preventDefault(); close(); };
  const onOutside = (event: MouseEvent) => {
    if (!opened) return;
    if (!modal && event.target instanceof Node && !event.composedPath().includes(base.element)) close(false);
    if (modal && event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close(); }
  };
  const onDialogClick = (event: MouseEvent) => { onClick(event); onOutside(event); event.stopPropagation(); };
  const onInputClick = () => { if (modal) open(); };
  const onFocusOut = () => { queueMicrotask(() => { if (!destroyed && opened && !modal && !base.element.contains(doc.activeElement)) close(false); }); };
  base.element.addEventListener("click", onClick); base.element.addEventListener("keydown", onKey);
  base.element.addEventListener("focusout", onFocusOut); dialog.addEventListener("focusin", onFocus);
  dialog.addEventListener("click", onDialogClick); dialog.addEventListener("input", onEntry); dialog.addEventListener("cancel", onCancel);
  input.addEventListener("change", onInputChange); input.addEventListener("click", onInputClick); doc.addEventListener("click", onOutside);
  const setDisabled = (disabled: boolean) => {
    if (destroyed) return;
    if (disabled) { close(); base.disabled.disable(); } else base.disabled.enable();
    input.disabled = disabled; trigger.disabled = disabled;
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true; close();
    doc.removeEventListener("click", onOutside); input.removeEventListener("change", onInputChange); input.removeEventListener("click", onInputClick);
    base.element.removeEventListener("click", onClick); base.element.removeEventListener("keydown", onKey); base.element.removeEventListener("focusout", onFocusOut);
    dialog.removeEventListener("focusin", onFocus); dialog.removeEventListener("click", onDialogClick); dialog.removeEventListener("input", onEntry); dialog.removeEventListener("cancel", onCancel);
    base.lifecycle.destroy();
  };
  const api = withAPI({
    element: base.element, input, getClass: base.getClass,
    disabled: { enable: () => setDisabled(false), disable: () => setDisabled(true), isDisabled: () => base.disabled.isDisabled() }, lifecycle: { destroy }, destroy,
    open() { open(); return api; }, close() { close(); return api; }, getValue,
    getFormattedValue: () => formatted(committed, committedEnd),
    setValue(value) { assignValue(value, true); return api; },
    clear() { if (!destroyed) { committed = null; committedEnd = null; resetDraft(); syncInput(); render(); emitChange(); } return api; },
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
  return api;
};
export default createDatePicker;
