import { afterEach, beforeEach, expect, test } from 'bun:test';
import { JSDOM } from 'jsdom';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import createSegmentedButton, { Density, SelectionMode } from '../../../src/components/segmented-button';
import type { SegmentedButtonComponent, SegmentedButtonConfig, SegmentedButtonEvent } from '../../../src/components/segmented-button/types';

let dom: JSDOM;
let groups: SegmentedButtonComponent[];
const icon = '<svg data-icon="original" viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>';
const check = '<svg data-icon="check" viewBox="0 0 24 24"><path d="M2 12l6 6L22 4"/></svg>';

beforeEach(() => {
  dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
  for (const name of ['window', 'document', 'HTMLElement', 'HTMLButtonElement', 'Element', 'Node', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent']) {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: name === 'window' ? dom.window : Reflect.get(dom.window, name) });
  }
  globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  groups = [];
});
afterEach(() => { groups.forEach(group => group.destroy()); dom.window.close(); });
const make = (config: SegmentedButtonConfig = {}) => {
  const group = createSegmentedButton({
    ripple: false,
    segments: [{ text: 'Day', value: 'day' }, { text: 'Week', value: 'week' }, { text: 'Month', value: 'month' }],
    ...config,
  });
  document.body.append(group.element); groups.push(group); return group;
};
const click = (group: SegmentedButtonComponent, index: number) => (group.segments[index].element as HTMLButtonElement).click();
const changes = (group: SegmentedButtonComponent) => {
  const events: SegmentedButtonEvent[] = [];
  group.on('change', event => events.push(event));
  return events;
};
const expectSelection = (group: SegmentedButtonComponent, values: string[]) => {
  expect(group.getValue()).toEqual(values);
  expect(group.getSelected().map(segment => segment.value)).toEqual(values);
  for (const segment of group.segments) {
    expect(segment.isSelected()).toBe(values.includes(segment.value));
    expect(segment.element.getAttribute('aria-pressed')).toBe(String(values.includes(segment.value)));
    expect(segment.element.classList.contains('mtrl-segment--selected')).toBe(values.includes(segment.value));
  }
};

test('single mode auto-selects the first enabled real button', () => {
  const group = make({ segments: [{ text: 'Off', value: 'off', disabled: true }, { text: 'Day', value: 'day' }] });
  expect(group.element.getAttribute('data-mode')).toBe('single');
  expect(group.segments.every(segment => segment.element instanceof HTMLButtonElement)).toBe(true);
  expectSelection(group, ['day']);
});

test('single mode preserves explicit initial selection', () => {
  const group = make({ segments: [{ text: 'Day', value: 'day' }, { text: 'Week', value: 'week', selected: true }] });
  expectSelection(group, ['week']);
});

test('single mode switches selection and keeps it on a second click', () => {
  const group = make(); const events = changes(group);
  click(group, 1); click(group, 1);
  expectSelection(group, ['week']); expect(events).toHaveLength(1);
  expect(events[0]).toEqual({ selected: [group.segments[1]], value: ['week'], oldValue: ['day'] });
  expect(Object.keys(events[0]).sort()).toEqual(['oldValue', 'selected', 'value']);
});

test('single select and deselect retain the last selection and emit only changes', () => {
  const group = make(); const events = changes(group);
  expect(group.select('month')).toBe(group);
  // `select('missing')` used to be a no-op and now clears the selection
  // (FLO-106); it is covered in test/components/selection-values.test.ts.
  group.select('month').deselect('month').deselect('day').deselect('missing');
  expectSelection(group, ['month']); expect(events).toHaveLength(1);
  expect(events[0]).toEqual({ selected: [group.segments[2]], value: ['month'], oldValue: ['day'] });
});

test('multi mode starts empty and clicks independently toggle segments', () => {
  const group = make({ mode: SelectionMode.MULTI }); const events = changes(group);
  expectSelection(group, []);
  click(group, 0); click(group, 2); click(group, 0);
  expectSelection(group, ['month']); expect(events).toHaveLength(3);
  expect(events[1]).toEqual({ selected: [group.segments[0], group.segments[2]], value: ['day', 'month'], oldValue: ['day'] });
  expect(events[2]).toEqual({ selected: [group.segments[2]], value: ['month'], oldValue: ['day', 'month'] });
});

test('multi select and deselect emit exact payloads only for changes', () => {
  const group = make({ mode: SelectionMode.MULTI }); const events = changes(group);
  // `select('missing')` now clears rather than doing nothing (FLO-106).
  group.select('day').select('day').select('month');
  expect(group.deselect('day')).toBe(group);
  group.deselect('day').deselect('missing');
  expectSelection(group, ['month']); expect(events).toHaveLength(3);
  expect(events[0]).toEqual({ selected: [group.segments[0]], value: ['day'], oldValue: [] });
  expect(events[2]).toEqual({ selected: [group.segments[2]], value: ['month'], oldValue: ['day', 'month'] });
});

test('multi mode preserves initially selected segments', () => {
  const group = make({ mode: SelectionMode.MULTI, segments: [{ text: 'Day', value: 'day', selected: true }, { text: 'Week', value: 'week', selected: true }] });
  expectSelection(group, ['day', 'week']);
});

// FLO-106 split this in two: `disabled` blocks the user, not the application,
// so a click is still refused and `select()` is not. Disabling the whole group
// disables every segment, so the rule reaches it the same way.
test('a disabled group blocks clicks but not programmatic selection', () => {
  const group = make({ mode: SelectionMode.MULTI }); const events = changes(group);
  expect(group.disable()).toBe(group);
  expect(group.element.classList.contains('mtrl-segmented-button--disabled')).toBe(true);
  for (const segment of group.segments) {
    expect(segment.isDisabled()).toBe(true); expect(segment.element.hasAttribute('disabled')).toBe(true);
  }
  click(group, 0); expect(events).toHaveLength(0); expectSelection(group, []);
  group.select('week'); expectSelection(group, ['week']); expect(events).toHaveLength(1);
  expect(group.enable()).toBe(group);
  expect(group.element.classList.contains('mtrl-segmented-button--disabled')).toBe(false);
  expect(group.segments.every(segment => !segment.isDisabled())).toBe(true);
  click(group, 0); expectSelection(group, ['day', 'week']); expect(events).toHaveLength(2);
});

test('group enable preserves configured individual disabled state', () => {
  const group = make({ disabled: true, mode: SelectionMode.MULTI, segments: [{ text: 'Day', value: 'day', disabled: true }, { text: 'Week', value: 'week' }] });
  expect(group.segments.every(segment => segment.isDisabled())).toBe(true);
  group.enable();
  expect(group.segments[0].isDisabled()).toBe(true); expect(group.segments[1].isDisabled()).toBe(false);
  click(group, 0); click(group, 1); expectSelection(group, ['week']);
});

test('per-segment disable gates clicks but not programmatic selection', () => {
  const group = make({ mode: SelectionMode.MULTI }); const events = changes(group);
  expect(group.disableSegment('day')).toBe(group);

  // The user cannot.
  click(group, 0); expectSelection(group, []); expect(events).toHaveLength(0);

  // The application can, since FLO-106.
  group.select('day'); expectSelection(group, ['day']); expect(events).toHaveLength(1);

  // `deselect` still refuses while the segment is disabled. That asymmetry is
  // outside the FLO-106 decision, which is about setting a value, and is
  // recorded on the issue rather than changed here.
  group.deselect('day'); expectSelection(group, ['day']);

  expect(group.enableSegment('day')).toBe(group);
  group.deselect('day'); expectSelection(group, []); expect(events).toHaveLength(2);
});

for (const density of [Density.DEFAULT, Density.COMFORTABLE, Density.COMPACT]) {
  test(`initial ${density} density is reflected in classes and API`, () => {
    const group = make({ density });
    expect(group.getDensity()).toBe(density); expect(group.element.getAttribute('data-density')).toBe(density);
    expect(Array.from(group.element.style).filter(name => name.startsWith('--segment-') || name.startsWith('--mtrl-segmented-button-'))).toEqual([]);
    for (const modifier of [Density.COMFORTABLE, Density.COMPACT]) {
      expect(group.element.classList.contains(`mtrl-segmented-button--${modifier}`)).toBe(modifier === density);
    }
  });
}

test('setDensity replaces the previous density class', () => {
  const group = make();
  for (const density of [Density.COMPACT, Density.COMFORTABLE, Density.DEFAULT]) {
    expect(group.setDensity(density)).toBe(group); expect(group.getDensity()).toBe(density);
    expect(Array.from(group.element.style).filter(name => name.startsWith('--segment-') || name.startsWith('--mtrl-segmented-button-'))).toEqual([]);
    for (const modifier of [Density.COMFORTABLE, Density.COMPACT]) {
      expect(group.element.classList.contains(`mtrl-segmented-button--${modifier}`)).toBe(modifier === density);
    }
  }
});

test('text-only segments insert a checkmark before the label', () => {
  const group = make({ mode: SelectionMode.MULTI }); const element = group.segments[0].element;
  const mark = element.querySelector('.mtrl-segment-checkmark')!;
  const label = element.querySelector('.mtrl-button__text')!;
  expect(mark.querySelector('svg')).not.toBeNull(); expect(mark.nextElementSibling).toBe(label);
  group.select('day'); expect(element.classList.contains('mtrl-segment--selected')).toBe(true);
  group.deselect('day'); expect(element.classList.contains('mtrl-segment--selected')).toBe(false);
  expect(element.querySelector('.mtrl-segment-checkmark')).toBe(mark);
});

test('icon and text swap the original icon for the configured checkmark', () => {
  const group = make({ mode: SelectionMode.MULTI, segments: [{ text: 'Day', value: 'day', icon, checkmarkIcon: check }] });
  const element = group.segments[0].element;
  expect(element.querySelector('[data-icon="original"]')).not.toBeNull();
  group.select('day');
  expect(element.querySelector('[data-icon="original"]')).toBeNull(); expect(element.querySelector('[data-icon="check"]')).not.toBeNull();
  group.deselect('day');
  expect(element.querySelector('[data-icon="original"]')).not.toBeNull(); expect(element.querySelector('[data-icon="check"]')).toBeNull();
});

test('initially selected icon and text use the checkmark', () => {
  const group = make({ segments: [{ text: 'Day', value: 'day', icon, checkmarkIcon: check, selected: true }] });
  expect(group.element.querySelector('[data-icon="check"]')).not.toBeNull();
  expect(group.element.querySelector('[data-icon="original"]')).toBeNull();
});

test('icon-only segments retain their icon while selected', () => {
  const group = make({ mode: SelectionMode.MULTI, segments: [{ value: 'day', icon, checkmarkIcon: check }] });
  group.select('day');
  expect(group.element.querySelector('[data-icon="original"]')).not.toBeNull();
  expect(group.element.querySelector('[data-icon="check"]')).toBeNull();
});

test('off removes a change subscription', () => {
  const group = make(); const events: SegmentedButtonEvent[] = []; const handler = (event: SegmentedButtonEvent) => events.push(event);
  group.on('change', handler).off('change', handler); click(group, 1); expect(events).toHaveLength(0);
});

test('destroy releases segment click listeners and emitter subscriptions', () => {
  const group = make(); const events = changes(group); const detachedButton = group.segments[1].element;
  group.destroy(); groups.splice(groups.indexOf(group), 1);
  expect(group.element.isConnected).toBe(false);
  detachedButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(group.getValue()).toEqual(['day']); expect(events).toHaveLength(0);
  group.select('month'); expect(events).toHaveLength(0);
  expect(group.element.querySelector('.mtrl-segment-checkmark')).toBeNull();
});

test('event declaration accepts exactly the payload emitted by the real component', () => {
  const directory = mkdtempSync(join(tmpdir(), 'mtrl-segmented-event-'));
  try {
    const file = join(directory, 'contract.ts');
    const source = fileURLToPath(new URL('../../../src/components/segmented-button/types', import.meta.url));
    writeFileSync(file, `import type { SegmentedButtonEvent, Segment } from ${JSON.stringify(source)};
const payload = { selected: [], value: [], oldValue: [] } satisfies SegmentedButtonEvent;
const selected: Segment[] = payload.selected;
const values: string[] = payload.value;
const previous: string[] = payload.oldValue;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
const exactKeys: Equal<keyof SegmentedButtonEvent, 'selected' | 'value' | 'oldValue'> = true;
`);
    const compiler = fileURLToPath(new URL('../../../node_modules/typescript/bin/tsc', import.meta.url));
    const result = Bun.spawnSync([
      process.execPath, compiler, '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2020',
      '--moduleResolution', 'node', '--typeRoots', directory, file,
    ], { stdout: 'pipe', stderr: 'pipe' });
    expect(result.exitCode, result.stdout.toString() + result.stderr.toString()).toBe(0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}, 10000);
