// test/components/dialog/dialog.test.ts
//
// The real component in a JSDOM document: what it renders, how it is named,
// where focus goes, and what it does to the page behind it.
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.MouseEvent = dom.window.MouseEvent;
g.CustomEvent = dom.window.CustomEvent;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);

// JSDOM lays nothing out, so every element would look invisible to the
// focusable filter
Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetWidth', { get: () => 40, configurable: true });
Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetHeight', { get: () => 40, configurable: true });

import createDialog from '../../../src/components/dialog';

const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** open() shows the dialog on a 10ms timer */
const opened = async (dialog: { open: () => unknown }) => {
  dialog.open();
  await after(30);
};

const buttons = [
  { text: 'Cancel', variant: 'text' },
  { text: 'Delete', variant: 'text' },
];

let trigger: HTMLButtonElement;

beforeEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
  trigger = document.createElement('button');
  trigger.textContent = 'Open';
  document.body.appendChild(trigger);
  trigger.focus();
});

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('dialog', () => {
  test('the dialog carries the role and the modal flag, not the scrim behind it', () => {
    const dialog = createDialog({ title: 'Delete file?', content: 'This cannot be undone.', buttons });
    const el = dialog.element;
    expect(el.getAttribute('role')).toBe('alertdialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.getAttribute('tabindex')).toBe('-1');

    const overlay = el.parentElement!;
    expect(overlay.classList.contains('mtrl-dialog-overlay')).toBe(true);
    expect(overlay.hasAttribute('role')).toBe(false);
    expect(overlay.hasAttribute('aria-modal')).toBe(false);
  });

  test('the headline names the dialog and the supporting text describes it', () => {
    const dialog = createDialog({ title: 'Delete file?', content: 'This cannot be undone.' });
    const el = dialog.element;
    const titleId = el.getAttribute('aria-labelledby')!;
    const contentId = el.getAttribute('aria-describedby')!;
    expect(el.querySelector(`#${titleId}`)!.textContent).toBe('Delete file?');
    expect(el.querySelector(`#${contentId}`)!.textContent).toBe('This cannot be undone.');
    // two dialogs do not share ids
    const other = createDialog({ title: 'Another', content: 'Body' });
    expect(other.element.getAttribute('aria-labelledby')).not.toBe(titleId);
    // without a headline the name can be given directly
    const unnamed = createDialog({ content: 'Body', ariaLabel: 'Choose a colour' });
    expect(unnamed.element.getAttribute('aria-label')).toBe('Choose a colour');
  });

  test('a full-screen dialog is a plain dialog and keeps a close affordance', () => {
    const basic = createDialog({ title: 'Basic' });
    expect(basic.element.querySelector('.mtrl-dialog-header-close')).toBeNull();

    const full = createDialog({ title: 'New event', size: 'fullscreen' });
    expect(full.element.getAttribute('role')).toBe('dialog');
    const close = full.element.querySelector('.mtrl-dialog-header-close');
    expect(close).not.toBeNull();
    expect(close!.getAttribute('aria-label')).toBe('Close dialog');
    // and a basic dialog can still ask for one
    expect(createDialog({ title: 'x', closeButton: true }).element.querySelector('.mtrl-dialog-header-close')).not.toBeNull();
  });

  test('opening moves focus to the first action and closing gives it back', async () => {
    const dialog = createDialog({ title: 'Delete file?', buttons });
    expect(document.activeElement).toBe(trigger);
    await opened(dialog);
    const first = dialog.element.querySelector('button')!;
    expect(document.activeElement).toBe(first);
    dialog.close();
    expect(document.activeElement).toBe(trigger);
  });

  test('focus comes back even when the trap is off', async () => {
    const dialog = createDialog({ title: 'Delete file?', buttons, trapFocus: false });
    await opened(dialog);
    dialog.close();
    expect(document.activeElement).toBe(trigger);
  });

  test('a dialog with nothing to focus takes focus itself', async () => {
    const dialog = createDialog({ title: 'Saving', content: 'One moment.' });
    await opened(dialog);
    expect(document.activeElement).toBe(dialog.element);
  });

  test('Tab cycles inside the dialog', async () => {
    const dialog = createDialog({ title: 'Delete file?', buttons });
    await opened(dialog);
    const [first, last] = Array.from(dialog.element.querySelectorAll('button')) as HTMLButtonElement[];
    last.focus();
    last.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);
  });

  test('the Tab handler is taken off on close, so it does not pile up', async () => {
    const dialog = createDialog({ title: 'Delete file?', buttons });
    let handled = 0;
    const el = dialog.element;
    const originalAdd = el.addEventListener.bind(el);
    const originalRemove = el.removeEventListener.bind(el);
    const listeners = new Set<EventListenerOrEventListenerObject>();
    el.addEventListener = ((type: string, fn: EventListenerOrEventListenerObject, opts?: unknown) => {
      if (type === 'keydown') { listeners.add(fn); handled++; }
      return originalAdd(type, fn as EventListener, opts as boolean);
    }) as typeof el.addEventListener;
    el.removeEventListener = ((type: string, fn: EventListenerOrEventListenerObject, opts?: unknown) => {
      if (type === 'keydown') listeners.delete(fn);
      return originalRemove(type, fn as EventListener, opts as boolean);
    }) as typeof el.removeEventListener;

    for (let i = 0; i < 3; i++) {
      await opened(dialog);
      dialog.close();
      await after(20);
    }
    expect(handled).toBe(3);
    expect(listeners.size).toBe(0);
  });

  test('the page behind is taken out of reach while the dialog is open', async () => {
    const dialog = createDialog({ title: 'Delete file?', buttons });
    await opened(dialog);
    expect(trigger.hasAttribute('inert')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    expect(dialog.element.parentElement!.hasAttribute('inert')).toBe(false);
    dialog.close();
    expect(trigger.hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  test('a dialog that is not modal leaves the page alone', async () => {
    const dialog = createDialog({ title: 'Notes', buttons, modal: false });
    await opened(dialog);
    expect(dialog.element.hasAttribute('aria-modal')).toBe(false);
    expect(trigger.hasAttribute('inert')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    dialog.close();
  });

  test('Escape closes it, and the close event says so', async () => {
    const dialog = createDialog({ title: 'Delete file?', buttons });
    const closes: string[] = [];
    dialog.on('close', () => closes.push('close'));
    await opened(dialog);
    expect(dialog.isOpen()).toBe(true);
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dialog.isOpen()).toBe(false);
    expect(closes).toEqual(['close']);
  });

  test('the actions are text buttons in the footer, confirmation last', async () => {
    const dialog = createDialog({ title: 'Delete file?', buttons });
    const footer = dialog.element.querySelector('.mtrl-dialog-footer')!;
    const rendered = Array.from(footer.querySelectorAll('button'));
    expect(rendered.length).toBe(2);
    expect(rendered[0]!.textContent).toContain('Cancel');
    expect(rendered[1]!.textContent).toContain('Delete');
    expect(rendered[0]!.classList.contains('mtrl-button--text')).toBe(true);
  });

  test('destroy takes the dialog and its scrim off the page', async () => {
    const dialog = createDialog({ title: 'Delete file?', buttons });
    await opened(dialog);
    const overlay = dialog.element.parentElement!;
    dialog.destroy();
    await after(20);
    expect(document.body.contains(overlay)).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });
});
