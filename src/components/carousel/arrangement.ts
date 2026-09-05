// src/components/carousel/arrangement.ts
//
// How many large, medium and small items fit in a carousel and how wide
// each is. Ported from the Compose Material 3 carousel (Arrangement.kt):
// every combination of counts is fitted to the available space and the one
// whose large size lands closest to the target wins; ties go to the
// combination tried first.

export interface Arrangement {
  priority: number;
  smallSize: number;
  smallCount: number;
  mediumSize: number;
  mediumCount: number;
  largeSize: number;
  largeCount: number;
}

/** A medium item may grow or shrink by this share of its size to help the large items reach their target */
const MEDIUM_ITEM_FLEX = 0.1;

export const itemCount = (a: Arrangement): number =>
  a.largeCount + a.mediumCount + a.smallCount;

const isValid = (a: Arrangement): boolean => {
  if (a.largeCount > 0 && a.smallCount > 0 && a.mediumCount > 0) {
    return a.largeSize > a.mediumSize && a.mediumSize > a.smallSize;
  }
  if (a.largeCount > 0 && a.smallCount > 0) {
    return a.largeSize > a.smallSize;
  }
  return true;
};

const cost = (a: Arrangement, targetLargeSize: number): number =>
  isValid(a) ? Math.abs(targetLargeSize - a.largeSize) * a.priority : Number.MAX_VALUE;

const largeSizeFor = (
  space: number,
  smallCount: number,
  smallSize: number,
  mediumCount: number,
  largeCount: number,
): number =>
  (space - (smallCount + mediumCount / 2) * smallSize) / (largeCount + mediumCount / 2);

const fit = (
  priority: number,
  availableSpace: number,
  gap: number,
  smallCount: number,
  smallSize: number,
  minSmallSize: number,
  maxSmallSize: number,
  mediumCount: number,
  mediumSize: number,
  largeCount: number,
  largeSize: number,
): Arrangement => {
  const total = largeCount + mediumCount + smallCount;
  const space = availableSpace - (total - 1) * gap;

  let small = Math.min(Math.max(smallSize, minSmallSize), maxSmallSize);
  const taken = largeSize * largeCount + mediumSize * mediumCount + small * smallCount;
  const delta = space - taken;
  if (smallCount > 0 && delta > 0) {
    small += Math.min(delta / smallCount, maxSmallSize - small);
  } else if (smallCount > 0 && delta < 0) {
    small += Math.max(delta / smallCount, minSmallSize - small);
  }
  small = smallCount > 0 ? small : 0;

  let large = largeSizeFor(space, smallCount, small, mediumCount, largeCount);
  let medium = (large + small) / 2;

  // Give the medium items' flex to the large items so they get closer to their target
  if (mediumCount > 0 && large !== largeSize) {
    const targetAdjustment = (largeSize - large) * largeCount;
    const flex = medium * MEDIUM_ITEM_FLEX * mediumCount;
    const distribute = Math.min(Math.abs(targetAdjustment), flex);
    if (targetAdjustment > 0) {
      medium -= distribute / mediumCount;
      large += distribute / largeCount;
    } else {
      medium += distribute / mediumCount;
      large -= distribute / largeCount;
    }
  }

  return { priority, smallSize: small, smallCount, mediumSize: medium, mediumCount, largeSize: large, largeCount };
};

export interface ArrangementOptions {
  availableSpace: number;
  gap: number;
  targetSmallSize: number;
  minSmallSize: number;
  maxSmallSize: number;
  smallCounts: number[];
  targetMediumSize: number;
  mediumCounts: number[];
  targetLargeSize: number;
  largeCounts: number[];
}

export const findLowestCostArrangement = (o: ArrangementOptions): Arrangement | null => {
  let lowest: Arrangement | null = null;
  let priority = 1;
  for (const largeCount of o.largeCounts) {
    for (const mediumCount of o.mediumCounts) {
      for (const smallCount of o.smallCounts) {
        const candidate = fit(
          priority,
          o.availableSpace,
          o.gap,
          smallCount,
          o.targetSmallSize,
          o.minSmallSize,
          o.maxSmallSize,
          mediumCount,
          o.targetMediumSize,
          largeCount,
          o.targetLargeSize,
        );
        if (lowest === null || cost(candidate, o.targetLargeSize) < cost(lowest, o.targetLargeSize)) {
          lowest = candidate;
          if (cost(lowest, o.targetLargeSize) === 0) return lowest;
        }
        priority++;
      }
    }
  }
  return lowest;
};
