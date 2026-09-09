// test/styles/bottom-sheet.test.ts
//
// The stylesheet against the M3 tokens (Compose SheetBottomTokens and
// BottomSheetDefaults).
import { describe, test, expect, beforeAll } from 'bun:test';
import { compileString } from 'sass';

let css = '';

const rules = (selector: string): string[] => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Array.from(css.matchAll(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g')), (m) => m[2]);
};

const value = (selector: string, property: string): string | undefined =>
  rules(selector)
    .map((block) => block.match(new RegExp(`(?:^|;|\\n)\\s*${property}\\s*:\\s*([^;]+);`))?.[1].trim())
    .filter((v): v is string => v !== undefined)
    .pop();

beforeAll(() => {
  css = compileString(`@use 'components/bottom-sheet';`, { loadPaths: ['src/styles'], style: 'expanded' }).css.replace(/,\n/g, ', ');
});

describe('bottom sheet stylesheet', () => {
  test('the container is surface-container-low at level 1', () => {
    expect(value('.mtrl-bottom-sheet-container', 'background-color')).toBe('var(--mtrl-sys-color-surface-container-low)');
    expect(value('.mtrl-bottom-sheet-container', 'color')).toBe('var(--mtrl-sys-color-on-surface)');
    // DockedStandardContainerElevation is Level1
    expect(value('.mtrl-bottom-sheet-container', 'box-shadow')).toBe('0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)');
  });

  test('only the top corners round, at extra-large', () => {
    // CornerExtraLargeTop: the bottom edge meets the screen
    expect(value('.mtrl-bottom-sheet-container', 'border-start-start-radius')).toBe('28px');
    expect(value('.mtrl-bottom-sheet-container', 'border-start-end-radius')).toBe('28px');
    expect(value('.mtrl-bottom-sheet-container', 'border-radius')).toBeUndefined();
  });

  test('it stops at 640dp so it does not stretch across a desktop', () => {
    // BottomSheetDefaults.SheetMaxWidth
    expect(value('.mtrl-bottom-sheet-container', 'max-width')).toBe('640px');
    expect(value('.mtrl-bottom-sheet', 'justify-content')).toBe('center');
    expect(value('.mtrl-bottom-sheet', 'align-items')).toBe('flex-end');
  });

  test('the drag handle is 32 by 4dp in on-surface-variant', () => {
    // DockedDragHandleWidth / DockedDragHandleHeight / DockedDragHandleColor
    expect(value('.mtrl-bottom-sheet-handle', 'width')).toBe('32px');
    expect(value('.mtrl-bottom-sheet-handle', 'height')).toBe('4px');
    expect(value('.mtrl-bottom-sheet-handle', 'background-color')).toBe('var(--mtrl-sys-color-on-surface-variant)');
    // the sheet handles the gesture, so the browser must not pan instead
    expect(value('.mtrl-bottom-sheet-handle', 'touch-action')).toBe('none');
  });

  test('the scrim is 32% of the scrim role and hidden until it opens', () => {
    expect(value('.mtrl-bottom-sheet-scrim', 'background-color')).toBe('color-mix(in srgb, var(--mtrl-sys-color-scrim) 32%, transparent)');
    expect(value('.mtrl-bottom-sheet-scrim', 'opacity')).toBe('0');
    expect(value('.mtrl-bottom-sheet-scrim', 'visibility')).toBe('hidden');
    expect(value('.mtrl-bottom-sheet--partial .mtrl-bottom-sheet-scrim', 'opacity')).toBe('1');
  });

  test('a closed sheet lets clicks through to the page behind it', () => {
    expect(value('.mtrl-bottom-sheet', 'pointer-events')).toBe('none');
    expect(value('.mtrl-bottom-sheet-container', 'pointer-events')).toBe('auto');
    // a standard sheet never blocks the page, whatever its state
    expect(value('.mtrl-bottom-sheet--standard', 'pointer-events')).toBe('none');
  });

  test('it slides rather than appearing, and stops for reduced motion', () => {
    expect(value('.mtrl-bottom-sheet-container', 'transform')).toBe('translateY(100%)');
    expect(value('.mtrl-bottom-sheet--partial .mtrl-bottom-sheet-container', 'transform')).toBe('translateY(0)');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,300}?transition: none;/);
  });

  test('the focus ring uses the secondary role', () => {
    // SheetBottomTokens.FocusIndicatorColor
    expect(value('.mtrl-bottom-sheet-container:focus-visible', 'outline')).toBe('3px solid var(--mtrl-sys-color-secondary)');
    expect(value('.mtrl-bottom-sheet-container:focus', 'outline')).toBe('none');
  });

  test('no corner is written as an unanimatable pill', () => {
    expect(css).not.toContain('9999px');
    expect(css).not.toContain('!important');
  });
});
