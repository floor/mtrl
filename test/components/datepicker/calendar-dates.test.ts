// test/components/datepicker/calendar-dates.test.ts
//
// generateCalendarDates builds the 42-cell grid, and marks each cell disabled
// when it falls outside minDate/maxDate. The check was written as
//
//   (minDate && date < minDate) || (maxDate && date > maxDate)
//
// which yields `null` — not `false` — when both bounds are absent. CalendarDate
// declares isDisabled as a boolean, so every cell of an unbounded calendar
// carried null behind a type that promised otherwise. Falsy either way, so
// nothing rendered wrong, but a consumer testing `=== false` got nothing back.
//
// Found while clearing this file for strictNullChecks (FLO-114).

import { describe, test, expect } from "bun:test";
import { generateCalendarDates } from "../../../src/components/datepicker/utils";

// March 2025 (month is 0-based, so 2 is March).
const YEAR = 2025;
const MONTH = 2;

describe("generateCalendarDates marks disabled cells", () => {
  test("isDisabled is a boolean when there are no bounds", () => {
    const dates = generateCalendarDates(YEAR, MONTH);

    expect(dates.length).toBe(42);
    for (const date of dates) {
      expect(typeof date.isDisabled).toBe("boolean");
    }
  });

  // The defect, stated the way a consumer would meet it.
  test("an unbounded calendar has every cell explicitly not disabled", () => {
    const dates = generateCalendarDates(YEAR, MONTH);

    expect(dates.every((date) => date.isDisabled === false)).toBe(true);
  });

  test("it is a boolean when only one bound is given", () => {
    const min = generateCalendarDates(YEAR, MONTH, null, null, new Date(YEAR, MONTH, 10), null);
    const max = generateCalendarDates(YEAR, MONTH, null, null, null, new Date(YEAR, MONTH, 20));

    for (const date of [...min, ...max]) {
      expect(typeof date.isDisabled).toBe("boolean");
    }
  });

  test("a date before minDate is disabled, one after it is not", () => {
    const minDate = new Date(YEAR, MONTH, 10);
    const dates = generateCalendarDates(YEAR, MONTH, null, null, minDate, null);

    const before = dates.find((d) => d.isCurrentMonth && d.day === 5);
    const after = dates.find((d) => d.isCurrentMonth && d.day === 15);

    expect(before?.isDisabled).toBe(true);
    expect(after?.isDisabled).toBe(false);
  });

  test("a date after maxDate is disabled, one before it is not", () => {
    const maxDate = new Date(YEAR, MONTH, 20);
    const dates = generateCalendarDates(YEAR, MONTH, null, null, null, maxDate);

    const before = dates.find((d) => d.isCurrentMonth && d.day === 15);
    const after = dates.find((d) => d.isCurrentMonth && d.day === 25);

    expect(before?.isDisabled).toBe(false);
    expect(after?.isDisabled).toBe(true);
  });

  // The leading and trailing cells run through the same check, and each had
  // its own copy of it before this was extracted into one helper.
  test("cells from the neighbouring months are marked the same way", () => {
    const dates = generateCalendarDates(YEAR, MONTH, null, null, new Date(YEAR, MONTH, 10), null);
    const neighbours = dates.filter((d) => !d.isCurrentMonth);

    expect(neighbours.length).toBeGreaterThan(0);
    for (const date of neighbours) {
      expect(typeof date.isDisabled).toBe("boolean");
    }
    // Everything before the 10th of this month is out of range, which
    // includes every trailing cell of the previous one.
    const leading = neighbours.filter((d) => d.date < new Date(YEAR, MONTH, 1));
    expect(leading.length).toBeGreaterThan(0);
    expect(leading.every((d) => d.isDisabled === true)).toBe(true);
  });
});
