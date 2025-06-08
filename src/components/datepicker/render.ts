// src/components/datepicker/render.ts
import {
  MONTH_NAMES,
  MONTH_NAMES_SHORT,
  DAY_NAMES,
  TODAY_CLASS,
  SELECTED_CLASS,
  OUTSIDE_MONTH_CLASS,
  RANGE_START_CLASS,
  RANGE_END_CLASS,
  RANGE_MIDDLE_CLASS,
} from "./types";
import { CalendarDate } from "./types";
import { generateCalendarDates, generateYearRange } from "./utils";
import { createElement } from "../../core/dom/create";

/**
 * Renders the calendar header with navigation controls
 * @param {Object} params - Rendering parameters
 * @returns {HTMLElement} Calendar header element
 */
export const renderHeader = ({
  currentMonth,
  currentYear,
  currentView,
  prefix,
  emit,
}: any): HTMLElement => {
  const header = createElement({
    tag: "div",
    className: `${prefix}-datepicker-header`,
  });

  // Month selector
  const monthButton = createElement({
    tag: "button",
    className: `${prefix}-datepicker-month-selector`,
    text: MONTH_NAMES[currentMonth],
    attributes: {
      type: "button",
      "aria-label": "Select month",
    },
  });

  // Year selector
  const yearButton = createElement({
    tag: "button",
    className: `${prefix}-datepicker-year-selector`,
    text: currentYear.toString(),
    attributes: {
      type: "button",
      "aria-label": "Select year",
    },
  });

  // Navigation controls container
  const navControls = createElement({
    tag: "div",
    className: `${prefix}-datepicker-nav-controls`,
  });

  // Previous button
  const prevButton = createElement({
    tag: "button",
    className: `${prefix}-datepicker-prev-btn`,
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>',
    attributes: {
      type: "button",
      "aria-label":
        currentView === "day"
          ? "Previous month"
          : currentView === "month"
          ? "Previous year"
          : "Previous year range",
    },
  });

  // Next button
  const nextButton = createElement({
    tag: "button",
    className: `${prefix}-datepicker-next-btn`,
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
    attributes: {
      type: "button",
      "aria-label":
        currentView === "day"
          ? "Next month"
          : currentView === "month"
          ? "Next year"
          : "Next year range",
    },
  });

  // Event listeners
  monthButton.addEventListener("click", (event) => {
    // Prevent event from bubbling up
    event.stopPropagation();
    emit("viewChange", { view: "month" });
  });

  yearButton.addEventListener("click", (event) => {
    // Prevent event from bubbling up
    event.stopPropagation();
    emit("viewChange", { view: "year" });
  });

  prevButton.addEventListener("click", (event) => {
    // Prevent event from bubbling up
    event.stopPropagation();

    if (currentView === "day") {
      emit("prevMonth");
    } else if (currentView === "month") {
      emit("prevYear");
    } else {
      emit("prevYearRange");
    }
  });

  nextButton.addEventListener("click", (event) => {
    // Prevent event from bubbling up
    event.stopPropagation();

    if (currentView === "day") {
      emit("nextMonth");
    } else if (currentView === "month") {
      emit("nextYear");
    } else {
      emit("nextYearRange");
    }
  });

  // Add buttons to container
  header.appendChild(monthButton);
  header.appendChild(yearButton);

  navControls.appendChild(prevButton);
  navControls.appendChild(nextButton);
  header.appendChild(navControls);

  return header;
};

/**
 * Renders the days of the week (S, M, T, etc.)
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Weekdays element
 */
export const renderWeekdays = (prefix: string): HTMLElement => {
  const weekdaysRow = createElement({
    tag: "div",
    className: `${prefix}-datepicker-weekdays`,
  });

  DAY_NAMES.forEach((day) => {
    const dayElement = createElement({
      tag: "span",
      className: `${prefix}-datepicker-weekday`,
      text: day,
    });
    weekdaysRow.appendChild(dayElement);
  });

  return weekdaysRow;
};

/**
 * Renders the calendar days
 * @param {Object} params - Rendering parameters
 * @returns {HTMLElement} Calendar days element
 */
export const renderDays = ({
  currentYear,
  currentMonth,
  selectedDate,
  rangeEndDate,
  minDate,
  maxDate,
  prefix,
  emit,
}: any): HTMLElement => {
  const daysGrid = createElement({
    tag: "div",
    className: `${prefix}-datepicker-days`,
  });

  const calendarDates = generateCalendarDates(
    currentYear,
    currentMonth,
    selectedDate,
    rangeEndDate,
    minDate,
    maxDate
  );

  calendarDates.forEach((calendarDate: CalendarDate) => {
    const classNames = [
      `${prefix}-datepicker-day`,
      calendarDate.isCurrentMonth ? "" : OUTSIDE_MONTH_CLASS,
      calendarDate.isToday ? TODAY_CLASS : "",
      calendarDate.isSelected ? SELECTED_CLASS : "",
      calendarDate.isDisabled ? "disabled" : "",
      calendarDate.isRangeStart ? RANGE_START_CLASS : "",
      calendarDate.isRangeEnd ? RANGE_END_CLASS : "",
      calendarDate.isRangeMiddle ? RANGE_MIDDLE_CLASS : "",
    ]
      .filter(Boolean)
      .join(" ");

    const dayElement = createElement({
      tag: "button",
      className: classNames,
      text: calendarDate.day.toString(),
      attributes: {
        type: "button",
        "aria-label": calendarDate.date.toLocaleDateString(),
        "aria-selected": calendarDate.isSelected ? "true" : "false",
        "aria-disabled": calendarDate.isDisabled ? "true" : "false",
        "data-date": calendarDate.date.toISOString(),
        disabled: calendarDate.isDisabled,
      },
    });

    // Event listener
    dayElement.addEventListener("click", (event) => {
      // Prevent event from bubbling up
      event.stopPropagation();

      if (!calendarDate.isDisabled) {
        emit("dateSelected", { date: calendarDate.date });
      }
    });

    daysGrid.appendChild(dayElement);
  });

  return daysGrid;
};

/**
 * Renders the month selection view
 * @param {Object} params - Rendering parameters
 * @returns {HTMLElement} Month selection element
 */
export const renderMonthSelection = ({
  currentMonth,
  prefix,
  emit,
}: any): HTMLElement => {
  const monthsGrid = createElement({
    tag: "div",
    className: `${prefix}-datepicker-months`,
  });

  MONTH_NAMES_SHORT.forEach((month, index) => {
    const isSelected = index === currentMonth;

    const monthElement = createElement({
      tag: "button",
      className: `${prefix}-datepicker-month ${
        isSelected ? SELECTED_CLASS : ""
      }`,
      text: month,
      attributes: {
        type: "button",
        "aria-selected": isSelected ? "true" : "false",
        "data-month": index.toString(),
      },
    });

    monthElement.addEventListener("click", (event) => {
      // Prevent event from bubbling up
      event.stopPropagation();
      emit("monthSelected", { month: index });
    });

    monthsGrid.appendChild(monthElement);
  });

  return monthsGrid;
};

/**
 * Renders the year selection view
 * @param {Object} params - Rendering parameters
 * @returns {HTMLElement} Year selection element
 */
export const renderYearSelection = ({
  currentYear,
  prefix,
  emit,
}: any): HTMLElement => {
  const yearsGrid = createElement({
    tag: "div",
    className: `${prefix}-datepicker-years`,
  });

  const yearRange = generateYearRange(currentYear, 10);

  yearRange.forEach((year) => {
    const isSelected = year === currentYear;

    const yearElement = createElement({
      tag: "button",
      className: `${prefix}-datepicker-year ${
        isSelected ? SELECTED_CLASS : ""
      }`,
      text: year.toString(),
      attributes: {
        type: "button",
        "aria-selected": isSelected ? "true" : "false",
        "data-year": year.toString(),
      },
    });

    yearElement.addEventListener("click", (event) => {
      // Prevent event from bubbling up
      event.stopPropagation();
      emit("yearSelected", { year });
    });

    yearsGrid.appendChild(yearElement);
  });

  return yearsGrid;
};

/**
 * Renders the footer with action buttons
 * @param {Object} params - Rendering parameters
 * @returns {HTMLElement} Footer element
 */
export const renderFooter = ({ prefix, emit }: any): HTMLElement => {
  const footer = createElement({
    tag: "div",
    className: `${prefix}-datepicker-footer`,
  });

  // Cancel button
  const cancelButton = createElement({
    tag: "button",
    className: `${prefix}-datepicker-cancel ${prefix}-button ${prefix}-button--text`,
    text: "Cancel",
    attributes: {
      type: "button",
    },
  });

  // OK button
  const okButton = createElement({
    tag: "button",
    className: `${prefix}-datepicker-ok ${prefix}-button ${prefix}-button--text`,
    text: "OK",
    attributes: {
      type: "button",
    },
  });

  cancelButton.addEventListener("click", (event) => {
    // Prevent event from bubbling up
    event.stopPropagation();
    emit("cancel");
  });

  okButton.addEventListener("click", (event) => {
    // Prevent event from bubbling up
    event.stopPropagation();
    emit("confirm");
  });

  footer.appendChild(cancelButton);
  footer.appendChild(okButton);

  return footer;
};

/**
 * Renders a complete calendar view
 * @param {Object} state - Current datepicker state
 * @param {Function} emit - Event emission function
 * @returns {HTMLElement} Rendered calendar
 */
export const renderCalendar = (state: any, emit: Function): HTMLElement => {
  const {
    prefix,
    currentView,
    currentMonth,
    currentYear,
    selectedDate,
    rangeEndDate,
    minDate,
    maxDate,
    variant,
  } = state;

  // Create calendar container
  const calendar = createElement({
    tag: "div",
    className: `${prefix}-datepicker-calendar-content`,
  });

  // Render header
  const header = renderHeader({
    currentMonth,
    currentYear,
    currentView,
    prefix,
    emit,
  });
  calendar.appendChild(header);

  // Render content based on current view
  if (currentView === "day") {
    const weekdays = renderWeekdays(prefix);
    calendar.appendChild(weekdays);

    const days = renderDays({
      currentYear,
      currentMonth,
      selectedDate,
      rangeEndDate,
      minDate,
      maxDate,
      prefix,
      emit,
    });
    calendar.appendChild(days);
  } else if (currentView === "month") {
    const months = renderMonthSelection({
      currentMonth,
      prefix,
      emit,
    });
    calendar.appendChild(months);
  } else if (currentView === "year") {
    const years = renderYearSelection({
      currentYear,
      prefix,
      emit,
    });
    calendar.appendChild(years);
  }

  // Only add footer for modal variants
  if (variant !== "docked") {
    const footer = renderFooter({
      prefix,
      emit,
    });
    calendar.appendChild(footer);
  }

  return calendar;
};
