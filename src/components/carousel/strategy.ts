// src/components/carousel/strategy.ts
//
// A strategy is the default keyline list plus the shifted lists used near
// the start and the end of the scroll range, so the first item is large at
// the leading edge and the last item large at the trailing edge. It also
// answers where an item snaps and how a given item is placed for a scroll
// offset. Ported from the Compose Material 3 carousel (Strategy.kt,
// KeylineSnapPosition.kt and the item placement in Carousel.kt).

import {
  Keyline,
  KeylineList,
  firstFocalIndex,
  lastFocalIndex,
  firstNonAnchorIndex,
  lastNonAnchorIndex,
  pivotIndex,
  focalCount,
  minSize,
  maxSize,
  isFirstFocalItemAtStartOfContainer,
  isLastFocalItemAtEndOfContainer,
  firstIndexAfterFocalRangeWithSize,
  lastIndexBeforeFocalRangeWithSize,
  keylineBefore,
  keylineAfter,
  lerpKeyline,
  lerpKeylineList,
  keylineListWithPivot,
} from './keylines';

export interface Strategy {
  defaultKeylines: KeylineList;
  startSteps: KeylineList[];
  endSteps: KeylineList[];
  availableSpace: number;
  gap: number;
  beforePadding: number;
  afterPadding: number;
  /** Size of a large item: the unit every item is measured in before adjustment */
  itemSize: number;
  minItemSize: number;
  maxItemSize: number;
  valid: boolean;
  startShiftDistance: number;
  endShiftDistance: number;
  startShiftPoints: number[];
  endShiftPoints: number[];
}

export interface ItemPlacement {
  /** Visible size of the item along the axis */
  size: number;
  /** Centre of the visible part, in container coordinates */
  center: number;
  /** Interpolated keyline the item sits on */
  keyline: Keyline;
}

const clampLerp = (outMin: number, outMax: number, inMin: number, inMax: number, value: number): number => {
  if (value <= inMin) return outMin;
  if (value >= inMax) return outMax;
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
};

const shiftedForContentPadding = (
  from: KeylineList,
  containerSize: number,
  gap: number,
  contentPadding: number,
  pivot: Keyline,
  pivotIdx: number,
): KeylineList => {
  const nonAnchors = from.filter((k) => !k.isAnchor).length;
  const reduction = contentPadding / nonAnchors;
  const shifted = keylineListWithPivot(
    containerSize,
    gap,
    pivotIdx,
    pivot.offset - reduction / 2 + contentPadding,
    from.map((k) => ({ size: k.size - Math.abs(reduction), isAnchor: k.isAnchor })),
  );
  return shifted.map((k, i) => ({ ...k, unadjustedOffset: from[i]!.unadjustedOffset }));
};

const moveKeyline = (from: KeylineList, srcIndex: number, dstIndex: number, containerSize: number, gap: number): KeylineList => {
  const dir = srcIndex > dstIndex ? 1 : -1;
  const src = from[srcIndex]!;
  const delta = (src.size - src.cutoff + gap) * dir;
  const pivot = from[pivotIndex(from)]!;
  const moved = from.slice();
  moved.splice(srcIndex, 1);
  moved.splice(dstIndex, 0, src);
  return keylineListWithPivot(
    containerSize,
    gap,
    pivotIndex(from) + dir,
    pivot.offset + delta,
    moved.map((k) => ({ size: k.size, isAnchor: k.isAnchor })),
  );
};

const startSteps = (defaults: KeylineList, containerSize: number, gap: number, beforePadding: number): KeylineList[] => {
  if (defaults.length === 0) return [];
  const steps: KeylineList[] = [defaults];
  if (isFirstFocalItemAtStartOfContainer(defaults)) {
    if (beforePadding !== 0) {
      steps.push(shiftedForContentPadding(defaults, containerSize, gap, beforePadding, defaults[firstFocalIndex(defaults)]!, firstFocalIndex(defaults)));
    }
    return steps;
  }
  const startIndex = firstNonAnchorIndex(defaults);
  const endIndex = firstFocalIndex(defaults);
  const numberOfSteps = endIndex - startIndex;
  if (numberOfSteps <= 0 && defaults[firstFocalIndex(defaults)]!.cutoff > 0) {
    steps.push(moveKeyline(defaults, 0, 0, containerSize, gap));
    return steps;
  }
  for (let i = 0; i < numberOfSteps; i++) {
    const prev = steps[steps.length - 1]!;
    const originalIndex = startIndex + i;
    let dstIndex = defaults.length - 1;
    if (originalIndex > 0) {
      const neighbourSize = defaults[originalIndex - 1]!.size;
      dstIndex = firstIndexAfterFocalRangeWithSize(prev, neighbourSize) - 1;
    }
    steps.push(moveKeyline(prev, firstNonAnchorIndex(defaults), dstIndex, containerSize, gap));
  }
  if (beforePadding !== 0) {
    const last = steps[steps.length - 1]!;
    steps[steps.length - 1] = shiftedForContentPadding(last, containerSize, gap, beforePadding, last[firstFocalIndex(last)]!, firstFocalIndex(last));
  }
  return steps;
};

const endSteps = (defaults: KeylineList, containerSize: number, gap: number, afterPadding: number): KeylineList[] => {
  if (defaults.length === 0) return [];
  const steps: KeylineList[] = [defaults];
  if (isLastFocalItemAtEndOfContainer(defaults, containerSize)) {
    if (afterPadding !== 0) {
      steps.push(shiftedForContentPadding(defaults, containerSize, gap, -afterPadding, defaults[lastFocalIndex(defaults)]!, lastFocalIndex(defaults)));
    }
    return steps;
  }
  const startIndex = lastFocalIndex(defaults);
  const endIndex = lastNonAnchorIndex(defaults);
  const numberOfSteps = endIndex - startIndex;
  if (numberOfSteps <= 0 && defaults[lastFocalIndex(defaults)]!.cutoff > 0) {
    steps.push(moveKeyline(defaults, 0, 0, containerSize, gap));
    return steps;
  }
  for (let i = 0; i < numberOfSteps; i++) {
    const prev = steps[steps.length - 1]!;
    const originalIndex = endIndex - i;
    let dstIndex = 0;
    if (originalIndex < defaults.length - 1) {
      const neighbourSize = defaults[originalIndex + 1]!.size;
      dstIndex = lastIndexBeforeFocalRangeWithSize(prev, neighbourSize) + 1;
    }
    steps.push(moveKeyline(prev, lastNonAnchorIndex(defaults), dstIndex, containerSize, gap));
  }
  if (afterPadding !== 0) {
    const last = steps[steps.length - 1]!;
    steps[steps.length - 1] = shiftedForContentPadding(last, containerSize, gap, -afterPadding, last[lastFocalIndex(last)]!, lastFocalIndex(last));
  }
  return steps;
};

const stepInterpolationPoints = (totalShift: number, steps: KeylineList[], shiftingLeft: boolean): number[] => {
  const points = [0];
  if (totalShift === 0 || steps.length === 0) return points;
  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1]!;
    const curr = steps[i]!;
    const shifted = shiftingLeft
      ? curr[0]!.unadjustedOffset - prev[0]!.unadjustedOffset
      : prev[prev.length - 1]!.unadjustedOffset - curr[curr.length - 1]!.unadjustedOffset;
    const point = i === steps.length - 1 ? 1 : points[i - 1]! + shifted / totalShift;
    points.push(point);
  }
  return points;
};

export const createStrategy = (
  defaultKeylines: KeylineList,
  availableSpace: number,
  gap: number,
  beforePadding: number,
  afterPadding: number,
): Strategy => {
  const starts = startSteps(defaultKeylines, availableSpace, gap, beforePadding);
  const ends = endSteps(defaultKeylines, availableSpace, gap, afterPadding);
  const itemSize = defaultKeylines.length ? defaultKeylines[firstFocalIndex(defaultKeylines)]!.size : 0;
  const startShiftDistance = starts.length
    ? Math.max(starts[starts.length - 1]![0]!.unadjustedOffset - starts[0]![0]!.unadjustedOffset, beforePadding)
    : 0;
  const endShiftDistance = ends.length
    ? Math.max(ends[0]![ends[0]!.length - 1]!.unadjustedOffset - ends[ends.length - 1]![ends[ends.length - 1]!.length - 1]!.unadjustedOffset, afterPadding)
    : 0;
  let min = defaultKeylines.length ? minSize(defaultKeylines) : 0;
  let max = defaultKeylines.length ? maxSize(defaultKeylines) : 0;
  for (const step of [...starts, ...ends]) {
    min = Math.min(min, minSize(step));
    max = Math.max(max, maxSize(step));
  }
  return {
    defaultKeylines,
    startSteps: starts,
    endSteps: ends,
    availableSpace,
    gap,
    beforePadding,
    afterPadding,
    itemSize,
    minItemSize: min,
    maxItemSize: max,
    valid: defaultKeylines.length > 0 && availableSpace !== 0 && itemSize !== 0,
    startShiftDistance,
    endShiftDistance,
    startShiftPoints: stepInterpolationPoints(startShiftDistance, starts, true),
    endShiftPoints: stepInterpolationPoints(endShiftDistance, ends, false),
  };
};

/** Keylines in effect for a scroll offset: default, or interpolated within the start or end shift range */
export const keylinesForScrollOffset = (s: Strategy, scrollOffset: number, maxScrollOffset: number, roundToNearestStep = false): KeylineList => {
  const positive = Math.max(0, scrollOffset);
  const startShiftOffset = s.startShiftDistance;
  const endShiftOffset = Math.max(0, maxScrollOffset - s.endShiftDistance);
  if (positive >= startShiftOffset && positive <= endShiftOffset) return s.defaultKeylines;

  let interpolation = clampLerp(1, 0, 0, startShiftOffset, positive);
  let points = s.startShiftPoints;
  let steps = s.startSteps;
  if (positive > endShiftOffset) {
    interpolation = clampLerp(0, 1, endShiftOffset, maxScrollOffset, positive);
    points = s.endShiftPoints;
    steps = s.endSteps;
    if (endShiftOffset < 0.01 && s.startSteps.length === 2 && s.endSteps.length === 2) {
      steps = [s.startSteps[1]!, s.endSteps[1]!];
    }
  }

  let fromStep = 0;
  let toStep = 0;
  let stepped = 0;
  let lower = points[0]!;
  for (let i = 1; i < steps.length; i++) {
    const upper = points[i]!;
    if (interpolation <= upper) {
      fromStep = i - 1;
      toStep = i;
      stepped = clampLerp(0, 1, lower, upper, interpolation);
      break;
    }
    lower = upper;
  }
  if (roundToNearestStep) return steps[Math.round(stepped) === 0 ? fromStep : toStep]!;
  return lerpKeylineList(steps[fromStep]!, steps[toStep]!, stepped);
};

/** Distance from the container start to an item's start when that item is snapped */
export const snapPositionOffset = (s: Strategy, index: number, count: number): number => {
  if (!s.valid) return 0;
  const focalStart = (list: KeylineList) => list[firstFocalIndex(list)]!.unadjustedOffset - s.itemSize / 2;
  const focalEnd = (list: KeylineList) => list[lastFocalIndex(list)]!.unadjustedOffset - s.itemSize / 2;
  let offset = Math.round(focalStart(s.defaultKeylines));
  const lastStart = s.startSteps.length - 1;
  if (index <= lastStart) {
    const step = Math.min(Math.max(lastStart - index, 0), lastStart);
    offset = Math.round(focalStart(s.startSteps[step]!));
  }
  const lastEnd = s.endSteps.length - 1;
  const lastItem = count - 1;
  if (index >= lastItem - lastEnd && count > focalCount(s.defaultKeylines)) {
    const step = Math.min(Math.max(lastEnd - (lastItem - index), 0), lastEnd);
    offset = Math.round(focalEnd(s.endSteps[step]!));
  }
  return offset;
};

/** Largest scroll offset: the content laid out at large size minus the container */
export const maxScrollOffset = (s: Strategy, count: number): number =>
  Math.max(0, s.itemSize * count + s.gap * (count - 1) - s.availableSpace);

/** Where an item sits and how much of it shows for the keylines in effect */
export const placeItem = (s: Strategy, keylines: KeylineList, index: number, scrollOffset: number): ItemPlacement => {
  const unit = s.itemSize + s.gap;
  const unadjustedCenter = index * unit + s.itemSize / 2 - scrollOffset;
  const before = keylineBefore(keylines, unadjustedCenter);
  const after = keylineAfter(keylines, unadjustedCenter);
  const progress = before === after ? 1 : (unadjustedCenter - before.unadjustedOffset) / (after.unadjustedOffset - before.unadjustedOffset);
  const keyline = lerpKeyline(before, after, progress);
  let center = keyline.offset;
  if (before === after) {
    // Past the outermost keylines: keep drifting with the scroll
    center += (unadjustedCenter - keyline.unadjustedOffset) / keyline.size;
  }
  return { size: keyline.size, center, keyline };
};
