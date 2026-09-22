import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import createDatePicker from "../../../src/components/datepicker";
import type { DatePickerComponent, DatePickerConfig } from "../../../src/components/datepicker";

let dom: JSDOM;
let pickers: DatePickerComponent[];
beforeEach(() => {
  dom = new JSDOM("<!doctype html><body><button id='outside'>Outside</button></body>", { pretendToBeVisual: true });
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node, Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent });
  pickers = [];
});
afterEach(() => { pickers.forEach(picker => picker.destroy()); dom.window.close(); });
const mount = (config: DatePickerConfig = {}) => {
  const picker = createDatePicker({ value: "2026-09-15", ...config }); pickers.push(picker); document.body.append(picker.element); return picker;
};
const query = <T extends HTMLElement = HTMLElement>(picker: DatePickerComponent, selector: string) => picker.element.querySelector<T>(selector)!;
const click = (picker: DatePickerComponent, selector: string) => query<HTMLButtonElement>(picker, selector).click();
const key = (element: HTMLElement, key: string, shiftKey = false) => element.dispatchEvent(new KeyboardEvent("keydown", { key, shiftKey, bubbles: true, cancelable: true }));
const day = (picker: DatePickerComponent, date: string) => query<HTMLButtonElement>(picker, `[data-date="${date}"]`);
const inputDate = (input: HTMLInputElement, value: string, event = "input") => { input.value = value; input.dispatchEvent(new Event(event, { bubbles: true })); };

describe("Material date picker", () => {
  test("labels, controls and descriptions resolve uniquely across instances", () => {
    const a = mount({ label: '<b>Departure</b>' }), b = mount({ label: 'Return' });
    expect(a.element.querySelector('b')).toBeNull();
    expect(query(a, 'label').textContent).toBe('<b>Departure</b>');
    expect(a.input.id).not.toBe(b.input.id);
    for (const picker of [a, b]) {
      expect(query(picker, 'label').getAttribute('for')).toBe(picker.input.id);
      picker.open();
      for (const el of picker.element.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')) {
        for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby']) for (const id of (el.getAttribute(attr) ?? '').split(' ').filter(Boolean)) expect(document.getElementById(id)).not.toBeNull();
      }
      expect(picker.element.getAttribute('role')).not.toBe('application');
    }
  });
  test("modal renders header and draft selection; Cancel discards and OK commits once", () => {
    const picker = mount({ variant: 'modal' }); const changes: string[] = [];
    picker.on('change', value => changes.push(value.formattedValue)); picker.open();
    expect(query(picker, 'dialog').getAttribute('aria-modal')).toBe('true');
    expect(query(picker, '.mtrl-datepicker__headline').textContent).toContain('Sep');
    day(picker, '2026-09-18').click();
    expect(picker.getFormattedValue()).toBe('09/15/2026'); expect(changes).toEqual([]);
    click(picker, '[data-action="cancel"]');
    expect(query(picker, 'dialog').hasAttribute('open')).toBe(false);
    picker.open(); day(picker, '2026-09-19').click(); click(picker, '[data-action="confirm"]');
    expect(picker.getFormattedValue()).toBe('09/19/2026'); expect(changes).toEqual(['09/19/2026']);
  });
  test("modal input validates actual dates and bounds before confirmation", () => {
    const picker = mount({ variant: 'modal-input', minDate: '2026-01-01', maxDate: '2026-12-31' }); picker.open();
    const field = query<HTMLInputElement>(picker, '[data-entry="start"]');
    expect(field.readOnly).toBe(false);
    for (const invalid of ['02/30/2026', '02/29/2025', '13/01/2026', '01/01/2027']) {
      inputDate(field, invalid); expect(field.getAttribute('aria-invalid')).toBe('true'); expect(query<HTMLButtonElement>(picker, '[data-action="confirm"]').disabled).toBe(true);
    }
    inputDate(field, '02/28/2026'); expect(field.hasAttribute('aria-invalid')).toBe(false);
    click(picker, '[data-action="confirm"]'); expect(picker.getFormattedValue()).toBe('02/28/2026');
  });
  test("input mode can switch to calendar and back without committing a draft", () => {
    const picker = mount({ variant: 'modal-input' }); picker.open();
    inputDate(query<HTMLInputElement>(picker, '[data-entry="start"]'), '09/20/2026');
    click(picker, '[data-action="toggle-mode"]');
    expect(day(picker, '2026-09-20').getAttribute('aria-pressed')).toBe('true');
    click(picker, '[data-action="toggle-mode"]');
    expect(query<HTMLInputElement>(picker, '[data-entry="start"]').value).toBe('09/20/2026');
    key(query(picker, 'dialog'), 'Escape'); expect(picker.getFormattedValue()).toBe('09/15/2026');
  });
  test("docked input accepts configured formats, rejects rollover and clears", () => {
    const picker = mount({ dateFormat: 'DD/MM/YYYY' });
    expect(picker.input.readOnly).toBe(false);
    inputDate(picker.input, '31/02/2026', 'change'); expect(picker.input.getAttribute('aria-invalid')).toBe('true'); expect(picker.getFormattedValue()).toBe('15/09/2026');
    inputDate(picker.input, '25/12/2026', 'change'); expect(picker.getFormattedValue()).toBe('25/12/2026');
    inputDate(picker.input, '', 'change'); expect(picker.getValue()).toBeNull();
  });
  test("date-only values remain local and detached from caller dates", () => {
    const value = new Date(2024, 1, 29, 15); const picker = mount({ value }); value.setDate(1);
    expect(picker.getFormattedValue()).toBe('02/29/2024');
    const returned = picker.getValue() as Date; returned.setDate(2); expect(picker.getFormattedValue()).toBe('02/29/2024');
    picker.setValue('2026-02-30'); expect(picker.getFormattedValue()).toBe('02/29/2024');
  });
  test("range input requires an ordered complete range and shares validation", () => {
    const picker = mount({ variant: 'modal-input', selectionMode: 'range', value: ['2026-09-10', '2026-09-15'] }); picker.open();
    inputDate(query<HTMLInputElement>(picker, '[data-entry="end"]'), '09/01/2026');
    expect(query<HTMLButtonElement>(picker, '[data-action="confirm"]').disabled).toBe(true);
    inputDate(query<HTMLInputElement>(picker, '[data-entry="end"]'), '09/20/2026'); click(picker, '[data-action="confirm"]');
    expect(picker.getFormattedValue()).toBe('09/10/2026 - 09/20/2026'); expect(Array.isArray(picker.getValue())).toBe(true);
  });
  test("range calendar orders endpoints and confirms only a complete range", () => {
    const picker = mount({ variant: 'modal', selectionMode: 'range', value: ['2026-09-10', '2026-09-15'] }); picker.open();
    day(picker, '2026-09-22').click(); expect(query<HTMLButtonElement>(picker, '[data-action="confirm"]').disabled).toBe(true);
    day(picker, '2026-09-18').click(); click(picker, '[data-action="confirm"]');
    expect(picker.getFormattedValue()).toBe('09/18/2026 - 09/22/2026');
  });
  test("bounds and special disabled dates apply to click, keyboard, entry and API", () => {
    const picker = mount({ minDate: new Date(2026, 8, 10, 14), maxDate: '2026-09-20', specialDates: [{ date: '2026-09-16', disabled: true }, { date: '2026-09-17', highlight: true, tooltip: 'Holiday' }] }); picker.open();
    expect(day(picker, '2026-09-10').disabled).toBe(false); expect(day(picker, '2026-09-09').disabled).toBe(true);
    expect(day(picker, '2026-09-16').disabled).toBe(true); expect(day(picker, '2026-09-17').title).toBe('Holiday');
    day(picker, '2026-09-15').focus(); key(day(picker, '2026-09-15'), 'ArrowRight'); expect(document.activeElement).toBe(day(picker, '2026-09-17'));
    picker.setValue('2026-09-16'); expect(picker.getFormattedValue()).toBe('09/15/2026');
    picker.setMinDate('2026-09-18'); expect(day(picker, '2026-09-17').disabled).toBe(true);
  });
  test("roving calendar focus crosses month/year and clamps page navigation", () => {
    const picker = mount({ value: '2024-01-31' }); picker.open();
    expect(query(picker, '[data-date][tabindex="0"]')).toBe(day(picker, '2024-01-31'));
    key(day(picker, '2024-01-31'), 'PageDown'); expect(document.activeElement).toBe(day(picker, '2024-02-29'));
    key(day(picker, '2024-02-29'), 'PageDown', true); expect(document.activeElement).toBe(day(picker, '2025-02-28'));
    key(day(picker, '2025-02-28'), 'ArrowRight'); expect(document.activeElement).toBe(day(picker, '2025-03-01'));
    key(day(picker, '2025-03-01'), 'Home'); expect(document.activeElement).toBe(day(picker, '2025-02-23'));
    expect(picker.element.querySelectorAll('[data-date][tabindex="0"]')).toHaveLength(1);
  });
  test("month/year views expose navigation and keyboard focus", () => {
    const picker = mount(); picker.open(); picker.calendar.showYearView();
    const selected = query(picker, '[data-year="2026"]'); selected.focus(); key(selected, 'ArrowRight');
    expect(document.activeElement?.getAttribute('data-year')).toBe('2027'); (document.activeElement as HTMLButtonElement).click();
    expect(picker.calendar.getCurrentView()).toBe('month'); click(picker, '[data-month="0"]'); expect(picker.calendar.getCurrentView()).toBe('day');
    expect(picker.element.querySelector('[data-date="2027-01-15"]')).not.toBeNull();
  });
  test("open/close are idempotent, Escape and native cancellation restore trigger focus", () => {
    const picker = mount({ variant: 'modal' }); let opened = 0, closed = 0;
    picker.on('open', () => opened++).on('close', () => closed++);
    const trigger = query<HTMLButtonElement>(picker, '[data-action="open"]'); trigger.focus(); trigger.click(); picker.open();
    key(query(picker, 'dialog'), 'Escape'); picker.close(); expect(opened).toBe(1); expect(closed).toBe(1); expect(document.activeElement).toBe(trigger);
    picker.open(); query(picker, 'dialog').dispatchEvent(new Event('cancel', { cancelable: true })); expect(closed).toBe(2);
  });
  test("disabled state covers both APIs, open controls, and closes an active modal", () => {
    const picker = mount({ variant: 'modal', disabled: true }); picker.open(); expect(query(picker, 'dialog').hasAttribute('open')).toBe(false);
    expect(picker.input.disabled).toBe(true); expect(query<HTMLButtonElement>(picker, '[data-action="open"]').disabled).toBe(true);
    picker.disabled.enable(); picker.open(); expect(query(picker, 'dialog').hasAttribute('open')).toBe(true);
    picker.disabled.disable(); expect(query(picker, 'dialog').hasAttribute('open')).toBe(false); expect(picker.input.disabled).toBe(true);
  });
  test("closeOnSelect commits and hides the visible surface with one close event", () => {
    const picker = mount({ variant: 'modal', closeOnSelect: true }); let close = 0; picker.on('close', () => close++); picker.open(); day(picker, '2026-09-20').click();
    expect(picker.getFormattedValue()).toBe('09/20/2026'); expect(query(picker, 'dialog').hasAttribute('open')).toBe(false); expect(close).toBe(1);
  });
  test("Enter accepts valid modal input and docked text", () => {
    const modal = mount({ variant: 'modal-input' }); modal.open();
    const field = query<HTMLInputElement>(modal, '[data-entry="start"]');
    inputDate(field, '09/21/2026'); key(field, 'Enter');
    expect(modal.getFormattedValue()).toBe('09/21/2026'); expect(query(modal, 'dialog').hasAttribute('open')).toBe(false);
    const docked = mount(); docked.input.value = '09/22/2026'; key(docked.input, 'Enter'); expect(docked.getFormattedValue()).toBe('09/22/2026');
  });
  test("navigation before opening is retained and month buttons do not close a docked picker", () => {
    const picker = mount(); picker.calendar.goToDate(new Date(2024, 1, 29)); picker.open();
    expect(query(picker, '[data-date][tabindex="0"]')).toBe(day(picker, '2024-02-29'));
    click(picker, '[data-action="next"]'); expect(query(picker, 'dialog').hasAttribute('open')).toBe(true);
    expect(picker.element.querySelector('[data-date="2024-03-29"]')).not.toBeNull();
  });
  test("two modal instances preserve body scroll locking until the last closes", () => {
    document.body.style.overflow = 'scroll';
    const a = mount({ variant: 'modal' }), b = mount({ variant: 'modal-input' }); a.open(); b.open(); a.destroy();
    expect(document.body.style.overflow).toBe('hidden'); b.close(); expect(document.body.style.overflow).toBe('scroll');
  });
  test("destroy and lifecycle.destroy remove global listeners and leave retained controls inert", () => {
    const picker = mount({ variant: 'modal' }); let opens = 0; picker.on('open', () => opens++); picker.open();
    const trigger = query<HTMLButtonElement>(picker, '[data-action="open"]'); picker.lifecycle.destroy(); picker.destroy(); trigger.click(); picker.open();
    expect(opens).toBe(1); expect(picker.element.isConnected).toBe(false); expect(document.body.style.overflow).toBe('');
  });
});
