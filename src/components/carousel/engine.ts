// src/components/carousel/engine.ts
// Ported from vlist carousel layout engine.
// Pure math — computes per-item sizes and positions for carousel variants.
//
// A "slot" is a visible position in the carousel at rest.
// During scroll, items transition between adjacent slots with smooth
// size interpolation. The sum of all slot widths equals the container size.

export interface LayoutConfig {
  slots: number[];
  focalSlot: number;
  containerSize: number;
  gap?: number;
}

export interface ItemLayout {
  size: number;
  offset: number;
  progress: number;
  relOffset: number;
  role: "large" | "medium" | "small";
}

export interface LayoutEngine {
  slotWidths: number[];
  stepSize: number;
  focalSlot: number;
  getItemLayout(vi: number, focalVi: number, frac: number, anchor: number): ItemLayout;
  getItemSize(vi: number, focalVi: number, frac: number): number;
  getAnchorOffset(focalVi: number, frac: number): number;
}

export function createLayoutEngine(config: LayoutConfig): LayoutEngine {
  const { slots, focalSlot, containerSize, gap: gapPx = 0 } = config;
  const slotCount = slots.length;

  const totalGap = Math.max(0, slotCount - 1) * gapPx;
  const availableSize = containerSize - totalGap;
  const slotWidths = slots.map(r => Math.round(r * availableSize));

  const roundingError = availableSize - slotWidths.reduce((a, b) => a + b, 0);
  if (focalSlot < slotWidths.length) slotWidths[focalSlot]! += roundingError;

  const stepSize = (slotWidths[focalSlot] ?? 0) + gapPx;

  const gapFor = (size: number): number => (size >= gapPx ? gapPx : Math.max(0, size));

  function getSlotSize(slotIndex: number): number {
    if (slotIndex < 0 || slotIndex >= slotCount) return 0;
    return slotWidths[slotIndex] ?? 0;
  }

  function getItemSize(vi: number, focalVi: number, frac: number): number {
    const rel = vi - focalVi;
    const fromSlot = focalSlot + rel;
    const toSlot = fromSlot - 1;
    const fromSize = getSlotSize(fromSlot);
    const toSize = getSlotSize(toSlot);
    return fromSize + frac * (toSize - fromSize);
  }

  function getItemLayout(
    vi: number,
    focalVi: number,
    frac: number,
    anchor: number,
  ): ItemLayout {
    const rel = vi - focalVi;
    const size = getItemSize(vi, focalVi, frac);

    let offset = anchor;
    if (rel > 0) {
      for (let r = 0; r < rel; r++) {
        const s = getItemSize(focalVi + r, focalVi, frac);
        offset += s + gapFor(s);
      }
    } else if (rel < 0) {
      for (let r = -1; r >= rel; r--) {
        const s = getItemSize(focalVi + r, focalVi, frac);
        offset -= s + gapFor(s);
      }
    }

    const fromSlot = focalSlot + rel;
    const toSlot = fromSlot - 1;
    let progress: number;
    if (fromSlot === focalSlot) {
      progress = frac;
    } else if (toSlot === focalSlot) {
      progress = 1 - frac;
    } else {
      progress = 1;
    }

    const maxSlotSize = slotWidths[focalSlot] ?? 0;
    const sizeRatio = maxSlotSize > 0 ? size / maxSlotSize : 0;
    const role: "large" | "medium" | "small" =
      sizeRatio > 0.6 ? "large" : sizeRatio > 0.3 ? "medium" : "small";

    return { size, offset, progress, relOffset: rel, role };
  }

  function getAnchorOffset(focalVi: number, frac: number): number {
    if (focalSlot === 0) return 0;
    let offset = 0;
    for (let r = -1; r >= -focalSlot; r--) {
      const s = getItemSize(focalVi + r, focalVi, frac);
      offset += s + gapFor(s);
    }
    return offset;
  }

  return { slotWidths, stepSize, focalSlot, getItemLayout, getItemSize, getAnchorOffset };
}
