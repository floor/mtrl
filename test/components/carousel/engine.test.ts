// test/components/carousel/engine.test.ts
//
// The keyline engine against the Material 3 carousel rules (Compose
// CarouselDefaults, Keylines.kt, Arrangement.kt, Strategy.kt).
import { describe, test, expect } from 'bun:test';
import {
  KeylineRules,
  multiBrowseKeylines,
  heroKeylines,
  uncontainedKeylines,
  fullScreenKeylines,
  firstFocalIndex,
} from '../../../src/components/carousel/keylines';
import {
  createStrategy,
  keylinesForScrollOffset,
  snapPositionOffset,
  maxScrollOffset,
  placeItem,
} from '../../../src/components/carousel/strategy';

const rules: KeylineRules = { minSmallSize: 40, maxSmallSize: 56, anchorSize: 10, mediumLargeThreshold: 0.85 };

const nonAnchors = (list: ReturnType<typeof multiBrowseKeylines>) => list.filter((k) => !k.isAnchor);
const sizes = (list: ReturnType<typeof multiBrowseKeylines>) => nonAnchors(list).map((k) => Math.round(k.size));

describe('carousel keylines', () => {
  test('multi-browse fits one large, one medium and one small item into a compact container', () => {
    const list = multiBrowseKeylines(360, 200, 8, 10, rules);
    const items = nonAnchors(list);
    expect(list[0]!.isAnchor && list[list.length - 1]!.isAnchor).toBe(true);
    expect(items.length).toBe(3);
    const [large, medium, small] = items.map((k) => k.size) as [number, number, number];
    expect(large).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(small);
    expect(small).toBeGreaterThanOrEqual(40);
    expect(small).toBeLessThanOrEqual(56);
    // the items and the two gaps between them fill the container
    expect(Math.round(large + medium + small + 2 * 8)).toBe(360);
    // the large item starts at the leading edge
    expect(items[0]!.offset - items[0]!.size / 2).toBeCloseTo(0, 5);
  });

  test('multi-browse adds large items as the container grows', () => {
    expect(sizes(multiBrowseKeylines(360, 280, 8, 10, rules))).toEqual([296, 56]);
    expect(sizes(multiBrowseKeylines(800, 280, 8, 10, rules))).toEqual([280, 280, 168, 48]);
    expect(sizes(multiBrowseKeylines(1200, 280, 8, 10, rules))).toEqual([280, 280, 280, 280, 48]);
  });

  test('multi-browse drops small then medium slots when there are fewer items than slots', () => {
    const list = multiBrowseKeylines(360, 280, 8, 2, rules);
    expect(nonAnchors(list).length).toBe(2);
  });

  test('hero shows one large and one small item, the small one between 40 and 56', () => {
    const list = heroKeylines(360, null, 8, 5, false, rules);
    const items = nonAnchors(list);
    expect(items.length).toBe(2);
    expect(items[0]!.isFocal).toBe(true);
    expect(items[1]!.size).toBeGreaterThanOrEqual(40);
    expect(items[1]!.size).toBeLessThanOrEqual(56);
    expect(Math.round(items[0]!.size + items[1]!.size + 8)).toBe(360);
  });

  test('centred hero puts the large item between two small ones', () => {
    const list = heroKeylines(360, null, 8, 5, true, rules);
    const items = nonAnchors(list);
    expect(items.map((k) => k.isFocal)).toEqual([false, true, false]);
    expect(items[1]!.offset).toBeCloseTo(180, 5);
  });

  test('hero with a single item goes full width', () => {
    const list = heroKeylines(360, null, 8, 1, false, rules);
    expect(sizes(list)).toEqual([360]);
  });

  test('uncontained keeps one item size and cuts the last one off by a third', () => {
    const list = uncontainedKeylines(700, 280, 8, rules);
    const items = nonAnchors(list);
    expect(items.filter((k) => k.isFocal).length).toBe(2);
    expect(items[0]!.size).toBe(280);
    expect(items[1]!.size).toBe(280);
    // 700 - 2 * (280 + 8) = 124 left: the third item is 186 wide with 62 hidden
    const cut = items.at(-1)!;
    expect(cut.size).toBe(186);
    expect(cut.cutoff).toBeCloseTo(62, 5);
  });

  test('full-screen is one item the size of the container', () => {
    expect(sizes(fullScreenKeylines(800, 16, rules))).toEqual([800]);
  });

  test('an empty container yields no keylines', () => {
    expect(multiBrowseKeylines(0, 280, 8, 5, rules)).toEqual([]);
    expect(heroKeylines(0, null, 8, 5, false, rules)).toEqual([]);
  });
});

describe('carousel strategy', () => {
  const list = multiBrowseKeylines(360, 280, 8, 10, rules);
  const strategy = createStrategy(list, 360, 8, 16, 16);

  test('is valid and measures items in large units', () => {
    expect(strategy.valid).toBe(true);
    expect(strategy.itemSize).toBeCloseTo(list[firstFocalIndex(list)]!.size, 5);
    expect(strategy.startSteps.length).toBeGreaterThanOrEqual(1);
    expect(strategy.endSteps.length).toBeGreaterThan(1);
  });

  test('items snap at the focal slot; the last ones snap where they land large at the trailing edge', () => {
    expect(snapPositionOffset(strategy, 0, 10)).toBe(0);
    expect(snapPositionOffset(strategy, 4, 10)).toBe(0);
    expect(snapPositionOffset(strategy, 9, 10)).toBeGreaterThan(0);
  });

  test('keylines shift near the end so the last item is large at the trailing edge', () => {
    const max = maxScrollOffset(strategy, 10);
    const atEnd = keylinesForScrollOffset(strategy, max, max);
    const focal = atEnd.filter((k) => k.isFocal);
    const last = focal.at(-1)!;
    expect(last.offset + last.size / 2).toBeCloseTo(360 - 16, 0);
    expect(keylinesForScrollOffset(strategy, max / 2, max)).toBe(strategy.defaultKeylines);
  });

  test('places an item on the keyline its unadjusted centre falls on', () => {
    const scrollOffset = -snapPositionOffset(strategy, 0, 10);
    const keylines = keylinesForScrollOffset(strategy, scrollOffset, maxScrollOffset(strategy, 10));
    // the leading padding is taken out of the items (16dp over 2 items) and shifts them by 16dp
    const first = placeItem(strategy, keylines, 0, scrollOffset);
    expect(first.size).toBeCloseTo(strategy.itemSize - 8, 0);
    expect(first.center - first.size / 2).toBeCloseTo(16, 0);
    const third = placeItem(strategy, keylines, 2, scrollOffset);
    expect(third.size).toBeLessThan(first.size);
  });

  test('an invalid strategy snaps at zero', () => {
    const empty = createStrategy([], 0, 8, 16, 16);
    expect(empty.valid).toBe(false);
    expect(snapPositionOffset(empty, 0, 3)).toBe(0);
  });
});
