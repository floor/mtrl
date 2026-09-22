import { DATEPICKER_ICONS } from "./constants";
import { setHTML } from "../../core/dom/html";
import { createElement } from "../../core/dom/create";
import { MONTH_NAMES, MONTH_NAMES_SHORT, type DatePickerState } from "./types";
import { formatDate, generateCalendarDates, generateYearRange, isSameDay, parseDate } from "./utils";

/** Rendering is passive: one delegated listener owns each picker, including rerenders. */
export function renderCalendar(state: DatePickerState): HTMLElement {
  const cls = (name: string) => `${state.prefix}-datepicker__${name}`;
  const make = (tag: string, name: string, text?: string, attributes?: Record<string, string | boolean>) =>
    createElement({ tag, className: cls(name), text, attributes });
  const button = (name: string, text: string, action: string, label = text) => {
    const element = make("button", name, text, { type: "button", "data-action": action, "aria-label": label });
    const icon = action === "toggle-mode" ? (state.inputMode ? DATEPICKER_ICONS.calendar : DATEPICKER_ICONS.edit) : action === "prev" ? DATEPICKER_ICONS.previous : action === "next" ? DATEPICKER_ICONS.next : null;
    if (icon) setHTML(element, icon);
    return element;
  };
  const content = make("div", "content");
  const modal = state.variant !== "docked";
  if (modal) {
    const header = make("div", "modal-header");
    header.append(make("div", "title", state.label, { id: `${state.id}-title` }));
    const headline = state.selectedDate ? formatDate(state.selectedDate, "MMM D, YYYY") : "Select date";
    header.append(make("div", "headline", state.selectionMode === "range" && state.rangeEndDate ? `${headline} – ${formatDate(state.rangeEndDate, "MMM D, YYYY")}` : headline));
    header.append(button("mode-toggle", state.inputMode ? "▦" : "✎", "toggle-mode", state.inputMode ? "Switch to calendar" : "Switch to date input"));
    content.append(header);
  }
  if (state.inputMode) {
    const fields = make("div", "fields");
    for (const endpoint of state.selectionMode === "range" ? ["start", "end"] : ["start"]) {
      const wrapper = make("div", "field");
      const id = `${state.id}-${endpoint}`;
      wrapper.append(make("label", "label", state.selectionMode === "range" ? (endpoint === "start" ? "Start date" : "End date") : "Date", { for: id }));
      const input = make("input", "input", undefined, { id, type: "text", autocomplete: "off", placeholder: state.dateFormat, "data-entry": endpoint, "aria-describedby": `${id}-help ${id}-error` }) as HTMLInputElement;
      input.value = formatDate(endpoint === "start" ? state.selectedDate : state.rangeEndDate, state.dateFormat);
      wrapper.append(input, make("div", "help", state.dateFormat, { id: `${id}-help` }), make("div", "error", "", { id: `${id}-error`, "aria-live": "polite" }));
      fields.append(wrapper);
    }
    content.append(fields);
  } else {
    const header = make("div", "header");
    const nav = make("div", "navigation");
    nav.append(button("month-selector", MONTH_NAMES[state.currentMonth], "month", "Select month"), button("year-selector", String(state.currentYear), "year", "Select year"));
    const span = state.currentView === "day" ? "month" : state.currentView === "month" ? "year" : "year range";
    header.append(nav, button("prev", "‹", "prev", `Previous ${span}`), button("next", "›", "next", `Next ${span}`));
    content.append(header);
    if (state.currentView === "day") {
      const grid = make("div", "days", undefined, { role: "grid", "aria-label": `${MONTH_NAMES[state.currentMonth]} ${state.currentYear}`, "aria-describedby": `${state.id}-keyboard` });
      const weekdays = make("div", "weekdays", undefined, { role: "row" });
      for (const name of ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]) weekdays.append(make("span", "weekday", name[0], { role: "columnheader", "aria-label": name }));
      grid.append(weekdays);
      const dates = generateCalendarDates(state.currentYear, state.currentMonth, state.selectedDate, state.rangeEndDate, state.minDate, state.maxDate);
      const focus = dates.find(item => isSameDay(item.date, state.focusedDate) && state.isAllowed(item.date)) ?? dates.find(item => item.isCurrentMonth && state.isAllowed(item.date));
      for (let week = 0; week < 6; week++) {
        const row = make("div", "week", undefined, { role: "row" });
        for (const item of dates.slice(week * 7, week * 7 + 7)) {
          const selected = !!state.selectedDate && (isSameDay(item.date, state.selectedDate) || !!state.rangeEndDate && isSameDay(item.date, state.rangeEndDate));
          const inRange = !!state.selectedDate && !!state.rangeEndDate && item.date >= state.selectedDate && item.date <= state.rangeEndDate;
          const cell = make("div", "cell", undefined, { role: "gridcell", "aria-selected": String(selected || inRange) });
          if (inRange) cell.classList.add(cls("cell--range"));
          if (state.selectedDate && isSameDay(item.date, state.selectedDate)) cell.classList.add(cls("cell--range-start"));
          if (state.rangeEndDate && isSameDay(item.date, state.rangeEndDate)) cell.classList.add(cls("cell--range-end"));
          const special = state.specialDates.find(special => { const date = parseDate(special.date); return date && isSameDay(date, item.date); });
          const day = make("button", "day", String(item.day), {
            type: "button", "data-date": formatDate(item.date, "YYYY-MM-DD"), "aria-label": item.date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
            "aria-pressed": String(selected), disabled: !state.isAllowed(item.date), tabindex: item === focus ? "0" : "-1",
          });
          if (!state.isAllowed(item.date)) day.classList.add(cls("day--disabled"));
          if (item.isToday) { day.classList.add(cls("day--today")); day.setAttribute("aria-current", "date"); }
          if (!item.isCurrentMonth) day.classList.add(cls("day--outside"));
          if (selected) day.classList.add(cls("day--selected"));
          if (special?.highlight) day.classList.add(cls("day--highlight"));
          if (special?.tooltip) day.title = special.tooltip;
          cell.append(day); row.append(cell);
        }
        grid.append(row);
      }
      content.append(grid);
    } else {
      const months = state.currentView === "month";
      const grid = make("div", months ? "months" : "years", undefined, { role: "group", "aria-label": months ? "Choose month" : "Choose year" });
      for (const value of months ? Array.from({ length: 12 }, (_, i) => i) : generateYearRange(state.currentYear)) {
        const selected = value === (months ? state.currentMonth : state.currentYear);
        grid.append(make("button", months ? "month" : "year", months ? MONTH_NAMES_SHORT[value] : String(value), {
          type: "button", [months ? "data-month" : "data-year"]: String(value), "aria-pressed": String(selected), tabindex: selected ? "0" : "-1",
        }));
      }
      content.append(grid);
    }
    content.append(make("div", "sr-only", "Use arrow keys for days, Home and End for the week, Page Up and Page Down for months, with Shift for years.", { id: `${state.id}-keyboard` }));
  }
  if (modal) {
    const footer = make("div", "footer");
    const confirm = button("confirm", "OK", "confirm") as HTMLButtonElement;
    confirm.disabled = !state.selectedDate || !state.isAllowed(state.selectedDate) || state.selectionMode === "range" && (!state.rangeEndDate || !state.isAllowed(state.rangeEndDate));
    footer.append(button("cancel", "Cancel", "cancel"), confirm); content.append(footer);
  }
  return content;
}
