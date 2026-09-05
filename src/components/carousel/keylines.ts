// src/components/carousel/keylines.ts
//
// Keylines describe where items sit along the carousel and how large they
// are at rest: anchors just outside both edges, then the large, medium and
// small slots. Items interpolate between neighbouring keylines as they
// scroll. Ported from the Compose Material 3 carousel (KeylineList.kt and
// Keylines.kt); the size rules come from CarouselDefaults.

import { findLowestCostArrangement, itemCount, Arrangement } from './arrangement';

export interface Keyline {
  size: number;
  /** Centre of the item along the axis, in container coordinates */
  offset: number;
  /** Centre the item would have if every item were large */
  unadjustedOffset: number;
  isFocal: boolean;
  isAnchor: boolean;
  isPivot: boolean;
  /** How much of the item hangs outside the container */
  cutoff: number;
}

export type KeylineList = Keyline[];

interface TmpKeyline {
  size: number;
  isAnchor: boolean;
}

export interface KeylineRules {
  minSmallSize: number;
  maxSmallSize: number;
  anchorSize: number;
  /** A medium item wider than this share of a large one is cut differently in uncontained layouts */
  mediumLargeThreshold: number;
}

// ── List queries ────────────────────────────────────────────────

export const firstFocalIndex = (list: KeylineList): number => list.findIndex((k) => k.isFocal);
export const lastFocalIndex = (list: KeylineList): number => {
  for (let i = list.length - 1; i >= 0; i--) if (list[i]!.isFocal) return i;
  return -1;
};
export const firstNonAnchorIndex = (list: KeylineList): number => list.findIndex((k) => !k.isAnchor);
export const lastNonAnchorIndex = (list: KeylineList): number => {
  for (let i = list.length - 1; i >= 0; i--) if (!list[i]!.isAnchor) return i;
  return -1;
};
export const pivotIndex = (list: KeylineList): number => list.findIndex((k) => k.isPivot);
export const focalCount = (list: KeylineList): number => lastFocalIndex(list) - firstFocalIndex(list) + 1;
export const minSize = (list: KeylineList): number => list.reduce((m, k) => Math.min(m, k.size), Number.MAX_VALUE);
export const maxSize = (list: KeylineList): number => list.reduce((m, k) => Math.max(m, k.size), 0);

export const isFirstFocalItemAtStartOfContainer = (list: KeylineList): boolean => {
  const first = list[firstFocalIndex(list)]!;
  return first.offset - first.size / 2 >= 0 && firstFocalIndex(list) === firstNonAnchorIndex(list);
};

export const isLastFocalItemAtEndOfContainer = (list: KeylineList, containerSize: number): boolean => {
  const last = list[lastFocalIndex(list)]!;
  return last.offset + last.size / 2 <= containerSize && lastFocalIndex(list) === lastNonAnchorIndex(list);
};

export const firstIndexAfterFocalRangeWithSize = (list: KeylineList, size: number): number => {
  for (let i = lastFocalIndex(list); i < list.length; i++) if (list[i]!.size === size) return i;
  return list.length - 1;
};

export const lastIndexBeforeFocalRangeWithSize = (list: KeylineList, size: number): number => {
  for (let i = firstFocalIndex(list) - 1; i >= 0; i--) if (list[i]!.size === size) return i;
  return 0;
};

export const keylineBefore = (list: KeylineList, unadjustedOffset: number): Keyline => {
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i]!.unadjustedOffset < unadjustedOffset) return list[i]!;
  }
  return list[0]!;
};

export const keylineAfter = (list: KeylineList, unadjustedOffset: number): Keyline =>
  list.find((k) => k.unadjustedOffset >= unadjustedOffset) ?? list[list.length - 1]!;

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

export const lerpKeyline = (a: Keyline, b: Keyline, t: number): Keyline => ({
  size: mix(a.size, b.size, t),
  offset: mix(a.offset, b.offset, t),
  unadjustedOffset: mix(a.unadjustedOffset, b.unadjustedOffset, t),
  isFocal: t < 0.5 ? a.isFocal : b.isFocal,
  isAnchor: t < 0.5 ? a.isAnchor : b.isAnchor,
  isPivot: t < 0.5 ? a.isPivot : b.isPivot,
  cutoff: mix(a.cutoff, b.cutoff, t),
});

export const lerpKeylineList = (from: KeylineList, to: KeylineList, t: number): KeylineList =>
  from.map((k, i) => lerpKeyline(k, to[i]!, t));

// ── List construction ───────────────────────────────────────────

const isCutoffLeft = (size: number, offset: number): boolean =>
  offset - size / 2 < 0 && offset + size / 2 > 0;

const isCutoffRight = (size: number, offset: number, containerSize: number): boolean =>
  offset - size / 2 < containerSize && offset + size / 2 > containerSize;

/** The focal keylines are the run of largest non-anchor sizes */
const focalRange = (tmp: TmpKeyline[]): [number, number, number] => {
  let first = -1;
  let size = 0;
  tmp.forEach((k, i) => {
    if (!k.isAnchor && k.size > size) {
      first = i;
      size = k.size;
    }
  });
  if (first < 0) return [-1, -1, 0];
  let last = first;
  while (last < tmp.length - 1 && tmp[last + 1]!.size === size) last++;
  return [first, last, size];
};

const buildAroundPivot = (
  tmp: TmpKeyline[],
  pivotIdx: number,
  pivotOffset: number,
  firstFocal: number,
  lastFocal: number,
  itemSize: number,
  containerSize: number,
  gap: number,
): KeylineList => {
  if (tmp.length === 0 || pivotIdx < 0 || pivotIdx >= tmp.length) return [];
  const pivot = tmp[pivotIdx]!;
  const list: KeylineList = [];
  const pivotCutoff = isCutoffLeft(pivot.size, pivotOffset)
    ? pivotOffset - pivot.size / 2
    : isCutoffRight(pivot.size, pivotOffset, containerSize)
      ? pivotOffset + pivot.size / 2 - containerSize
      : 0;
  list.push({
    size: pivot.size,
    offset: pivotOffset,
    unadjustedOffset: pivotOffset,
    isFocal: pivotIdx >= firstFocal && pivotIdx <= lastFocal,
    isAnchor: pivot.isAnchor,
    isPivot: true,
    cutoff: pivotCutoff,
  });

  let offset = pivotOffset - itemSize / 2 - gap;
  let unadjusted = pivotOffset - itemSize / 2 - gap;
  for (let i = pivotIdx - 1; i >= 0; i--) {
    const k = tmp[i]!;
    const kOffset = offset - k.size / 2;
    const kUnadjusted = unadjusted - itemSize / 2;
    list.unshift({
      size: k.size,
      offset: kOffset,
      unadjustedOffset: kUnadjusted,
      isFocal: i >= firstFocal && i <= lastFocal,
      isAnchor: k.isAnchor,
      isPivot: false,
      cutoff: isCutoffLeft(k.size, kOffset) ? Math.abs(kOffset - k.size / 2) : 0,
    });
    offset -= k.size + gap;
    unadjusted -= itemSize + gap;
  }

  offset = pivotOffset + itemSize / 2 + gap;
  unadjusted = pivotOffset + itemSize / 2 + gap;
  for (let i = pivotIdx + 1; i < tmp.length; i++) {
    const k = tmp[i]!;
    const kOffset = offset + k.size / 2;
    const kUnadjusted = unadjusted + itemSize / 2;
    list.push({
      size: k.size,
      offset: kOffset,
      unadjustedOffset: kUnadjusted,
      isFocal: i >= firstFocal && i <= lastFocal,
      isAnchor: k.isAnchor,
      isPivot: false,
      cutoff: isCutoffRight(k.size, kOffset, containerSize) ? kOffset + k.size / 2 - containerSize : 0,
    });
    offset += k.size + gap;
    unadjusted += itemSize + gap;
  }
  return list;
};

/** Builds a keyline list with an explicit pivot (used for the shifted start and end steps) */
export const keylineListWithPivot = (
  containerSize: number,
  gap: number,
  pivotIdx: number,
  pivotOffset: number,
  tmp: TmpKeyline[],
): KeylineList => {
  const [firstFocal, lastFocal, itemSize] = focalRange(tmp);
  return buildAroundPivot(tmp, pivotIdx, pivotOffset, firstFocal, lastFocal, itemSize, containerSize, gap);
};

/** Builds a keyline list aligned to the start or centre of the container */
export const keylineListAligned = (
  containerSize: number,
  gap: number,
  alignment: 'start' | 'center',
  tmp: TmpKeyline[],
): KeylineList => {
  const [firstFocal, lastFocal, itemSize] = focalRange(tmp);
  if (firstFocal < 0) return [];
  const focalItems = lastFocal - firstFocal;
  let pivotOffset = itemSize / 2;
  if (alignment === 'center') {
    const split = gap === 0 || focalItems % 2 === 0 ? 0 : gap / 2;
    const spaces = Math.floor(focalItems / 2) * gap;
    pivotOffset = containerSize / 2 - (itemSize / 2) * focalItems - split - spaces;
  }
  return buildAroundPivot(tmp, firstFocal, pivotOffset, firstFocal, lastFocal, itemSize, containerSize, gap);
};

const fromArrangement = (
  a: Arrangement,
  containerSize: number,
  gap: number,
  leftAnchor: number,
  rightAnchor: number,
  alignment: 'start' | 'center',
): KeylineList => {
  const tmp: TmpKeyline[] = [{ size: leftAnchor, isAnchor: true }];
  const push = (size: number, count: number) => {
    for (let i = 0; i < count; i++) tmp.push({ size, isAnchor: false });
  };
  if (alignment === 'center') {
    push(a.smallSize, Math.floor(a.smallCount / 2));
    push(a.mediumSize, Math.floor(a.mediumCount / 2));
    push(a.largeSize, a.largeCount);
    push(a.mediumSize, Math.ceil(a.mediumCount / 2));
    push(a.smallSize, Math.ceil(a.smallCount / 2));
  } else {
    push(a.largeSize, a.largeCount);
    push(a.mediumSize, a.mediumCount);
    push(a.smallSize, a.smallCount);
  }
  tmp.push({ size: rightAnchor, isAnchor: true });
  return keylineListAligned(containerSize, gap, alignment, tmp);
};

const range = (from: number, to: number): number[] => {
  const out: number[] = [];
  for (let n = from; n >= to; n--) out.push(n);
  return out;
};

// ── Layouts ─────────────────────────────────────────────────────

/**
 * Multi-browse: at least one large, one medium and one small item; a small
 * item aims for a third of a large one within the 40–56dp range and the
 * medium item sits halfway. More large items appear as the container grows.
 */
export const multiBrowseKeylines = (
  containerSize: number,
  preferredItemSize: number,
  gap: number,
  count: number,
  rules: KeylineRules,
): KeylineList => {
  if (containerSize <= 0 || preferredItemSize <= 0) return [];
  let smallCounts = [1];
  const mediumCounts = [1, 0];
  const targetLarge = Math.min(preferredItemSize, containerSize);
  const targetSmall = Math.min(Math.max(targetLarge / 3, rules.minSmallSize), rules.maxSmallSize);
  const targetMedium = (targetLarge + targetSmall) / 2;
  if (containerSize < rules.minSmallSize * 2) smallCounts = [0];

  const minLargeSpace = containerSize - targetMedium * Math.max(...mediumCounts) - rules.maxSmallSize * Math.max(...smallCounts);
  const minLargeCount = Math.max(1, Math.floor(minLargeSpace / targetLarge));
  const maxLargeCount = Math.ceil(containerSize / targetLarge);
  const largeCounts = range(maxLargeCount, minLargeCount);

  const options = {
    availableSpace: containerSize,
    gap,
    targetSmallSize: targetSmall,
    minSmallSize: rules.minSmallSize,
    maxSmallSize: rules.maxSmallSize,
    smallCounts,
    targetMediumSize: targetMedium,
    mediumCounts,
    targetLargeSize: targetLarge,
    largeCounts,
  };
  let arrangement = findLowestCostArrangement(options);

  // Fewer items than slots: drop small then medium slots, keeping one medium
  if (arrangement && itemCount(arrangement) > count) {
    let surplus = itemCount(arrangement) - count;
    let smallCount = arrangement.smallCount;
    let mediumCount = arrangement.mediumCount;
    while (surplus > 0) {
      if (smallCount > 0) smallCount -= 1;
      else if (mediumCount > 1) mediumCount -= 1;
      surplus -= 1;
    }
    arrangement = findLowestCostArrangement({ ...options, smallCounts: [smallCount], mediumCounts: [mediumCount] });
  }
  if (!arrangement) return [];
  return fromArrangement(arrangement, containerSize, gap, rules.anchorSize, rules.anchorSize, 'start');
};

/**
 * Hero: one large item (or more on wide containers) and one small item; the
 * centred variant places the large item between two small ones.
 */
export const heroKeylines = (
  containerSize: number,
  maxItemSize: number | null,
  gap: number,
  count: number,
  centered: boolean,
  rules: KeylineRules,
): KeylineList => {
  if (containerSize <= 0) return [];
  const shouldCenter = centered && count >= 3;
  let smallCounts = count <= 1 ? [0] : shouldCenter ? [2] : [1];
  const targetLarge = Math.min(maxItemSize ?? containerSize, containerSize);
  const targetSmall = Math.min(Math.max(targetLarge / 3, rules.minSmallSize), rules.maxSmallSize);

  // Not enough room for the small items plus a large one at least 25% bigger: go full width
  const fullscreenThreshold = rules.minSmallSize * Math.max(...smallCounts) + rules.minSmallSize * 1.25;
  if (containerSize < fullscreenThreshold) smallCounts = [0];

  const minLargeSpace = containerSize - rules.minSmallSize * Math.max(...smallCounts);
  const minLargeCount = Math.max(1, Math.floor(minLargeSpace / targetLarge));
  const maxLargeCount = Math.ceil(containerSize / targetLarge);
  const arrangement = findLowestCostArrangement({
    availableSpace: containerSize,
    gap,
    targetSmallSize: targetSmall,
    minSmallSize: rules.minSmallSize,
    maxSmallSize: rules.maxSmallSize,
    smallCounts,
    targetMediumSize: 0,
    mediumCounts: [0],
    targetLargeSize: targetLarge,
    largeCounts: range(maxLargeCount, minLargeCount),
  });
  if (!arrangement) return [];
  const alignment = shouldCenter && count >= itemCount(arrangement) ? 'center' : 'start';
  return fromArrangement(arrangement, containerSize, gap, rules.anchorSize, rules.anchorSize, alignment);
};

const mediumChildSize = (minimum: number, largeSize: number, remaining: number, threshold: number): number => {
  let medium = Math.max(remaining * 1.5, minimum);
  if (medium > largeSize * threshold) medium = Math.max(remaining * 1.2, minimum);
  return medium;
};

/**
 * Uncontained: every item keeps its width and the last visible one is cut
 * off at the trailing edge, about a third of it hidden. Compose folds the
 * spacing into the item size; here the gaps stay between the items so the
 * spec's 8dp holds and the cut-off item keeps two thirds visible.
 */
export const uncontainedKeylines = (
  containerSize: number,
  itemSize: number,
  gap: number,
  rules: KeylineRules,
): KeylineList => {
  if (containerSize <= 0 || itemSize <= 0) return [];
  const large = Math.min(itemSize, containerSize);
  const largeCount = Math.max(1, Math.floor((containerSize + gap) / (large + gap)));
  const remaining = Math.max(0, containerSize - largeCount * (large + gap));
  const mediumCount = remaining > 0 ? 1 : 0;
  const medium = mediumChildSize(rules.anchorSize, large, remaining, rules.mediumLargeThreshold);
  const arrangement: Arrangement = {
    priority: 0,
    smallSize: 0,
    smallCount: 0,
    mediumSize: medium,
    mediumCount,
    largeSize: large,
    largeCount,
  };
  const xSmall = Math.min(rules.anchorSize, itemSize);
  const leftAnchor = Math.max(xSmall, medium * 0.5);
  return fromArrangement(arrangement, containerSize, gap, leftAnchor, rules.anchorSize, 'start');
};

/** Full-screen: one item fills the container edge to edge */
export const fullScreenKeylines = (containerSize: number, gap: number, rules: KeylineRules): KeylineList => {
  if (containerSize <= 0) return [];
  const arrangement: Arrangement = {
    priority: 0,
    smallSize: 0,
    smallCount: 0,
    mediumSize: 0,
    mediumCount: 0,
    largeSize: containerSize,
    largeCount: 1,
  };
  return fromArrangement(arrangement, containerSize, gap, rules.anchorSize, rules.anchorSize, 'start');
};
