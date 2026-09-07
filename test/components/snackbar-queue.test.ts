// test/components/snackbar-queue.test.ts
import { describe, test, expect } from 'bun:test';
import { createSnackbarQueue } from '../../src/components/snackbar/queue';
import type { QueuedSnackbar } from '../../src/components/snackbar/types';

/**
 * Builds a fake queued snackbar that records show/hide calls and lets a test
 * simulate the auto-dismiss timer firing via dismiss().
 */
const makeFake = (id: string) => {
  const listeners = new Map<string, () => void>();
  return {
    id,
    shown: 0,
    hidden: 0,
    _show() {
      this.shown++;
    },
    _hide() {
      this.hidden++;
    },
    on(event: string, handler: () => void) {
      listeners.set(event, handler);
    },
    off(event: string, handler: () => void) {
      if (listeners.get(event) === handler) listeners.delete(event);
    },
    /** Simulate the dismiss event the real timer emits */
    dismiss() {
      listeners.get('dismiss')?.();
    }
  } as QueuedSnackbar & { id: string; shown: number; hidden: number; dismiss: () => void };
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Snackbar Queue', () => {
  test("'queue' behavior shows one at a time, in order", async () => {
    const queue = createSnackbarQueue(0);
    const a = makeFake('a');
    const b = makeFake('b');

    queue.add(a);
    queue.add(b);

    // Only the first is shown; the second waits its turn.
    expect(a.shown).toBe(1);
    expect(b.shown).toBe(0);
    expect(queue.getLength()).toBe(2);

    // Dismissing the first lets the second through after the gap.
    a.dismiss();
    await tick();
    expect(b.shown).toBe(1);
    expect(queue.getLength()).toBe(1);
  });

  test("'replace' evicts the current snackbar and shows immediately", () => {
    const queue = createSnackbarQueue(0);
    const a = makeFake('a');
    const b = makeFake('b');

    queue.add(a);
    expect(a.shown).toBe(1);

    queue.add(b, { behavior: 'replace' });

    // The on-screen one is hidden without a dismiss event, the new one shows now.
    expect(a.hidden).toBe(1);
    expect(b.shown).toBe(1);
    expect(queue.getLength()).toBe(1);
  });

  test("'replace' drops everything still pending", () => {
    const queue = createSnackbarQueue(0);
    const a = makeFake('a');
    const b = makeFake('b');
    const c = makeFake('c');

    queue.add(a); // shown
    queue.add(b); // pending
    queue.add(c, { behavior: 'replace' });

    expect(a.hidden).toBe(1);
    expect(b.shown).toBe(0); // never shown — dropped
    expect(c.shown).toBe(1);
    expect(queue.getLength()).toBe(1);
  });

  test("rapid 'replace' calls do not back up", () => {
    const queue = createSnackbarQueue(0);
    const items = Array.from({ length: 10 }, (_, i) => makeFake(`s${i}`));

    items.forEach((item) => queue.add(item, { behavior: 'replace' }));

    // Only the last one is ever visible; all earlier ones were evicted.
    expect(queue.getLength()).toBe(1);
    expect(items[items.length - 1].shown).toBe(1);
    expect(items.slice(0, -1).every((item) => item.shown === 1 && item.hidden === 1)).toBe(true);
  });

  test('clear() dismisses the current snackbar and empties the queue', () => {
    const queue = createSnackbarQueue(0);
    const a = makeFake('a');
    const b = makeFake('b');

    queue.add(a);
    queue.add(b);
    queue.clear();

    expect(a.hidden).toBe(1);
    expect(queue.getLength()).toBe(0);
  });
});

describe('a snackbar the queue can no longer hear from', () => {
  test('a current whose element left the document does not hold the next one', () => {
    const queue = createSnackbarQueue(0);
    const gone = { ...makeFake('gone'), element: { isConnected: false } as HTMLElement };
    const next = makeFake('next');

    queue.add(gone as QueuedSnackbar);
    expect(gone.shown).toBe(1);

    // Its auto-dismiss timer belonged to a page that is gone, so it will never
    // fire; without this the queue would wait on it for the rest of the session.
    queue.add(next);
    expect(next.shown).toBe(1);
  });

  test('a current still on screen keeps its turn', () => {
    const queue = createSnackbarQueue(0);
    const onScreen = { ...makeFake('on-screen'), element: { isConnected: true } as HTMLElement };
    const next = makeFake('next');

    queue.add(onScreen as QueuedSnackbar);
    queue.add(next);
    expect(next.shown).toBe(0);
  });

  test('clear frees the queue even when hiding the active one throws', () => {
    const queue = createSnackbarQueue(0);
    const throws = makeFake('throws');
    throws._hide = () => {
      throw new Error('its page is gone');
    };
    const next = makeFake('next');

    queue.add(throws);
    queue.clear();
    expect(queue.getLength()).toBe(0);

    queue.add(next);
    expect(next.shown).toBe(1);
  });
});
